import { db } from "@/db";
import { qboConnection } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

const AUTHORIZE_URL = "https://appcenter.intuit.com/connect/oauth2";
const TOKEN_URL = "https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable ${name}. See README for QuickBooks Online setup.`);
  return value;
}

export function getApiBaseUrl(environment: string): string {
  return environment === "production"
    ? "https://quickbooks.api.intuit.com/v3/company"
    : "https://sandbox-quickbooks.api.intuit.com/v3/company";
}

/**
 * Step 1 of the OAuth flow: build the URL we send the owner to in order to authorize
 * this app against their QuickBooks Online company. See /api/qbo/connect.
 */
export function buildAuthorizeUrl(state: string): string {
  const clientId = requireEnv("QBO_CLIENT_ID");
  const redirectUri = requireEnv("QBO_REDIRECT_URI");
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "com.intuit.quickbooks.accounting",
    state,
  });
  return `${AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Step 2: Intuit redirects back to /api/qbo/callback with a `code` and `realmId`.
 * Exchange the code for access + refresh tokens and persist them.
 */
export async function exchangeCodeForTokens(code: string, realmId: string, connectedBy: number | null) {
  const clientId = requireEnv("QBO_CLIENT_ID");
  const clientSecret = requireEnv("QBO_CLIENT_SECRET");
  const redirectUri = requireEnv("QBO_REDIRECT_URI");
  const environment = process.env.QBO_ENVIRONMENT || "sandbox";

  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!res.ok) {
    throw new Error(`QuickBooks token exchange failed: ${res.status} ${await res.text()}`);
  }

  const json = await res.json();
  const now = Date.now();

  await db.insert(qboConnection).values({
    realmId,
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    accessTokenExpiresAt: new Date(now + json.expires_in * 1000),
    refreshTokenExpiresAt: new Date(now + json.x_refresh_token_expires_in * 1000),
    environment,
    connectedBy,
  });
}

async function refreshTokens(connection: typeof qboConnection.$inferSelect) {
  const clientId = requireEnv("QBO_CLIENT_ID");
  const clientSecret = requireEnv("QBO_CLIENT_SECRET");
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basicAuth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: connection.refreshToken,
    }),
  });

  if (!res.ok) {
    throw new Error(`QuickBooks token refresh failed: ${res.status} ${await res.text()}. You may need to reconnect QuickBooks.`);
  }

  const json = await res.json();
  const now = Date.now();

  await db.update(qboConnection).set({
    accessToken: json.access_token,
    refreshToken: json.refresh_token,
    accessTokenExpiresAt: new Date(now + json.expires_in * 1000),
    refreshTokenExpiresAt: new Date(now + json.x_refresh_token_expires_in * 1000),
    updatedAt: new Date(),
  }).where(eq(qboConnection.id, connection.id));

  return { ...connection, accessToken: json.access_token };
}

export async function getActiveConnection() {
  const [connection] = await db.select().from(qboConnection).orderBy(desc(qboConnection.id)).limit(1);
  if (!connection) return null;

  // Refresh if the access token is expired or about to expire in the next 2 minutes.
  if (connection.accessTokenExpiresAt.getTime() - Date.now() < 2 * 60 * 1000) {
    return refreshTokens(connection);
  }
  return connection;
}

/**
 * Thin wrapper around the QuickBooks Online v3 REST API. Throws if there's no active
 * connection — callers should check getActiveConnection()/isConnected() first and prompt
 * the owner to connect QuickBooks from Settings if not.
 */
export async function qboApiRequest(path: string, options: RequestInit = {}) {
  const connection = await getActiveConnection();
  if (!connection) {
    throw new Error("QuickBooks Online is not connected. Go to Settings to connect it.");
  }

  const base = getApiBaseUrl(connection.environment);
  const url = `${base}/${connection.realmId}/${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${connection.accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`QuickBooks Online API error (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export async function isConnected(): Promise<boolean> {
  const connection = await getActiveConnection();
  return !!connection;
}
