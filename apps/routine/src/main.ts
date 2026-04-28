import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, "..", "..", "..", ".env"), override: true });

import { runDailyCardGeneration } from "./agent.ts";
import { logger } from "./utils/logger.ts";

async function main(): Promise<void> {
  const userId = process.env.COACH_USER_ID;
  if (!userId) throw new Error("COACH_USER_ID env required");
  const result = await runDailyCardGeneration({ userId });
  logger.info({ stage: "done", result });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("[routine] fatal:", err);
  process.exit(1);
});
