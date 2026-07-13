const MONDAY_API_URL = "https://api.monday.com/v2";

export class MondayConfigError extends Error {}

export async function mondayRequest<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) {
    throw new MondayConfigError(
      "MONDAY_API_TOKEN is not set. Add it in Vercel (Settings → Environment Variables) and redeploy."
    );
  }

  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token,
      "API-Version": "2024-10",
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Monday.com API error: ${JSON.stringify(json.errors)}`);
  }
  return json.data as T;
}
