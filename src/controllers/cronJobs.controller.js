import cronJobsService from '../services/cronJobs.service.js';
import { successResponse, errorResponse } from '../utils/responses.js';

class CronJobsController {
  /**
   * POST /api/cron/snapshot-rates
   * Manually trigger monthly exchange rates snapshot
   * Admin only - for testing or emergency use
   */
  async triggerRatesSnapshot(req, res) {
    try {
      console.log('📍 Manual snapshot triggered by admin');
      
      const result = await cronJobsService.triggerManualSnapshot();

      return successResponse(res, {
        message: 'Monthly exchange rates snapshot completed',
        ...result
      });
    } catch (error) {
      console.error('Error in manual snapshot:', error);
      return errorResponse(res, 'Failed to create exchange rates snapshot', 500);
    }
  }

  /**
   * GET /api/cron/status
   * Get cron jobs status
   */
  async getCronStatus(req, res) {
    try {
      return successResponse(res, {
        message: 'Cron jobs are active',
        jobs: [
          {
            name: 'Monthly Exchange Rates Snapshot',
            schedule: 'Last day of month at 23:59',
            status: 'active'
          }
        ]
      });
    } catch (error) {
      console.error('Error getting cron status:', error);
      return errorResponse(res, 'Failed to get cron status', 500);
    }
  }
}

export default new CronJobsController();
