import { serve } from "@hono/node-server";
import { createApp } from "./app.js";
import { migratePlaintextApiKeys } from "./lib/secrets/api-key.js";

const app = createApp();

const port = Number(process.env.PORT ?? 4042);
const hostname = process.env.HOST ?? "127.0.0.1";

async function start() {
  const migrated = await migratePlaintextApiKeys();
  if (migrated > 0) {
    console.log(`Encrypted ${migrated} plaintext API key(s) at startup.`);
  }

  serve({ fetch: app.fetch, hostname, port }, (info) => {
    console.log(`API listening on http://${hostname}:${info.port}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
