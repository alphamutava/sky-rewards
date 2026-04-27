import { Queue, Worker, QueueEvents } from "bullmq";
import { redis } from "../lib/redis";
import { logger } from "../lib/logger";

export const payoutQueue = new Queue("payouts", { connection: redis });
export const payoutQueueEvents = new QueueEvents("payouts", { connection: redis });

export const cleanupQueue = new Queue("cleanup", { connection: redis });
export const cleanupQueueEvents = new QueueEvents("cleanup", { connection: redis });

export const campaignQueue = new Queue("campaigns", { connection: redis });
export const campaignQueueEvents = new QueueEvents("campaigns", { connection: redis });

export const eliteQueue = new Queue("elite", { connection: redis });
export const eliteQueueEvents = new QueueEvents("elite", { connection: redis });

export const reportQueue = new Queue("report", { connection: redis });
export const reportQueueEvents = new QueueEvents("report", { connection: redis });

export function createWorker(name: string, processor: any) {
  const worker = new Worker(name, processor, { connection: redis });

  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} from queue ${name} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} from queue ${name} failed: ${err.message}`, { error: err.stack });
  });

  return worker;
}
