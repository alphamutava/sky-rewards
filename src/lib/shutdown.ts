import { prisma } from "./prisma";
import { logger } from "./logger";
// We will import redis connections here once defined

let isShuttingDown = false;

export async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    logger.info("Closing Prisma connection...");
    await prisma.$disconnect();
    logger.info("Prisma disconnected.");

    logger.info("Graceful shutdown complete. Exiting process.");
    process.exit(0);
  } catch (error) {
    logger.error("Error during graceful shutdown", error);
    process.exit(1);
  }
}

// Attach listeners safely
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));
