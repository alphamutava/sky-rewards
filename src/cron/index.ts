import cron from 'node-cron'
import { EliteService } from '@/services/elite.service'
import { CampaignService } from '@/services/campaign.service'
import { processPayouts } from './process-payouts'
import { cleanupPendingTransactions } from './cleanup-pending'
import { generateDailyReport } from './daily-reports'

// Track job execution to prevent overlapping runs
const jobLocks: Record<string, boolean> = {}

function withLock(jobName: string, fn: () => Promise<void>) {
  return async () => {
    if (jobLocks[jobName]) {
      console.log(`[Cron] ${jobName} is already running, skipping...`)
      return
    }

    jobLocks[jobName] = true
    const startTime = Date.now()

    try {
      console.log(`[Cron] Starting ${jobName} at ${new Date().toISOString()}`)
      await fn()
      const duration = Date.now() - startTime
      console.log(`[Cron] ${jobName} completed in ${duration}ms`)
    } catch (error) {
      console.error(`[Cron] ${jobName} failed:`, error)
    } finally {
      jobLocks[jobName] = false
    }
  }
}

// Initialize all cron jobs
export function initCronJobs(): void {
  console.log('[Cron] Initializing cron jobs...')

  // Process pending payouts - every 5 minutes
  cron.schedule('*/5 * * * *', withLock('processPayouts', processPayouts))

  // Expire campaigns past end date - every hour
  cron.schedule('0 * * * *', withLock('expireCampaigns', async () => {
    const expired = await CampaignService.expireCampaigns()
    if (expired > 0) {
      console.log(`[Cron] Expired ${expired} campaigns`)
    }
  }))

  // Update Elite 100 rankings - daily at midnight EAT (21:00 UTC)
  cron.schedule('0 21 * * *', withLock('updateEliteRankings', async () => {
    const result = await EliteService.updateRankings()
    console.log(`[Cron] Elite rankings updated:`, result)
  }))

  // Cleanup stale pending transactions - every 6 hours
  cron.schedule('0 */6 * * *', withLock('cleanupTransactions', cleanupPendingTransactions))

  // Generate daily report - daily at 6 AM EAT (03:00 UTC)
  cron.schedule('0 3 * * *', withLock('dailyReport', generateDailyReport))

  console.log('[Cron] All cron jobs scheduled successfully')
}

// Export individual jobs for testing
export { processPayouts, cleanupPendingTransactions, generateDailyReport }
