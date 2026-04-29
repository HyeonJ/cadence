import { config as loadEnv } from "dotenv";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: join(__dirname, "..", "..", "..", ".env"), override: true });

import { runDailyCardGeneration } from "./agent.ts";
import { logger } from "./utils/logger.ts";
import { sendAdminAlert } from "./utils/admin-alert.ts";

async function main(): Promise<void> {
  const userId = process.env.COACH_USER_ID;
  if (!userId) throw new Error("COACH_USER_ID env required");
  const result = await runDailyCardGeneration({ userId });
  logger.info({ stage: "done", result });
}

main().catch(async (err) => {
  // eslint-disable-next-line no-console
  console.error("[routine] fatal:", err);
  await sendAdminAlert({
    severity: "error",
    message: (err as Error).message ?? "unknown fatal",
    context: {
      stack: ((err as Error).stack ?? "").slice(0, 1500),
      user_id: process.env.COACH_USER_ID,
      ts: new Date().toISOString(),
    },
  });
  process.exit(1);
});
