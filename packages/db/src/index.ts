import { createClient } from "@libsql/client";
import { env } from "@my-better-t-app/env/server";
import { drizzle } from "drizzle-orm/libsql";

import * as schema from "./schema";

export function createDb() {
  const client = createClient({
    url: env.DATABASE_URL,
  });

  return drizzle({ client, schema });
}

export const db = createDb();
