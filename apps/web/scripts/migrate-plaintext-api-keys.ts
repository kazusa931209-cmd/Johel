import { migratePlaintextApiKeys } from "../src/server/lib/secrets/api-key";

async function main() {
  const migrated = await migratePlaintextApiKeys();
  console.log(`Encrypted ${migrated} plaintext API key(s).`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
