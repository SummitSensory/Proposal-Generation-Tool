import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  // Allow the module to load during build steps that don't touch the DB.
  console.warn("DATABASE_URL is not set. Database calls will fail until it is configured.");
}

const client = postgres(connectionString ?? "postgres://placeholder", {
  prepare: false,
  max: 10,
});

export const db = drizzle(client, { schema });
export * as schema from "./schema";
