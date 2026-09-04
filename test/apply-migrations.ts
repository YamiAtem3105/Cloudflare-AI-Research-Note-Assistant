import { applyD1Migrations, env } from "cloudflare:test";



console.log(
  "TEST_MIGRATIONS:",
  (env as any).TEST_MIGRATIONS,
);

await applyD1Migrations(
  env.ai_research_notes_db,
  (env as any).TEST_MIGRATIONS,
);
