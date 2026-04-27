import { processPayouts } from "../cron/process-payouts";
import { cleanupPendingTransactions } from "../cron/cleanup-pending";
import { expireCampaigns } from "../cron/expire-campaigns";
import { updateEliteRankings } from "../cron/elite-rankings";
import { generateDailyReport } from "../cron/daily-report";
import { createWorker, payoutQueue, cleanupQueue, campaignQueue, eliteQueue, reportQueue } from "./workers/queue";
import { logger } from "./lib/logger";

logger.info("Starting background worker process...");

// Define Workers
createWorker("payouts", async () => {
  logger.info("Processing payouts...");
  await processPayouts();
});

createWorker("cleanup", async () => {
  logger.info("Cleaning up pending transactions...");
  await cleanupPendingTransactions();
});

createWorker("campaigns", async () => {
  logger.info("Expiring campaigns...");
  await expireCampaigns();
});

createWorker("elite", async () => {
  logger.info("Updating elite rankings...");
  await updateEliteRankings();
});

createWorker("report", async () => {
  logger.info("Generating daily report...");
  await generateDailyReport();
});

// Schedule Repeatable Jobs
async function scheduleJobs() {
  await payoutQueue.add("payout-job", {}, { repeat: { pattern: "*/5 * * * *" } });
  await cleanupQueue.add("cleanup-job", {}, { repeat: { pattern: "0 */6 * * *" } });
  await campaignQueue.add("campaign-job", {}, { repeat: { pattern: "0 * * * *" } });
  await eliteQueue.add("elite-job", {}, { repeat: { pattern: "0 0 * * *" } }); // Daily midnight
  await reportQueue.add("report-job", {}, { repeat: { pattern: "0 6 * * *" } }); // Daily 6 AM
  logger.info("Scheduled all recurring jobs.");
}

scheduleJobs().catch((err) => {
  logger.error("Failed to schedule jobs", { error: err.message });
});
