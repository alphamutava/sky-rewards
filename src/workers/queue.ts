import { Queue, Worker, QueueEvents } from "bullmq";
import { redis } from "../lib/redis";
import { logger } from "../lib/logger";

// Only create queues if Redis is available
export const payoutQueue = redis ? new Queue("payouts", { connection: redis }) : null;
export const payoutQueueEvents = redis ? new QueueEvents("payouts", { connection: redis }) : null;

export const cleanupQueue = redis ? new Queue("cleanup", { connection: redis }) : null;
export const cleanupQueueEvents = redis ? new QueueEvents("cleanup", { connection: redis }) : null;

export const campaignQueue = redis ? new Queue("campaigns", { connection: redis }) : null;
export const campaignQueueEvents = redis ? new QueueEvents("campaigns", { connection: redis }) : null;

export const eliteQueue = redis ? new Queue("elite", { connection: redis }) : null;
export const eliteQueueEvents = redis ? new QueueEvents("elite", { connection: redis }) : null;

export const reportQueue = redis ? new Queue("report", { connection: redis }) : null;
export const reportQueueEvents = redis ? new QueueEvents("report", { connection: redis }) : null;

export function createWorker(name: string, processor: any) {
  if (!redis) {
    logger.warn(`Cannot create worker ${name} - Redis not available`);
    return null;
  }
  const worker = new Worker(name, processor, { connection: redis });

  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} from queue ${name} completed successfully`);
  });

  worker.on("failed", (job, err) => {
    logger.error(`Job ${job?.id} from queue ${name} failed: ${err.message}`, { error: err.stack });
  });

  return worker;
}
