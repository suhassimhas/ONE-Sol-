import { Router, Request, Response } from 'express';
import axios from 'axios';
import { asyncHandler } from '../middleware/errorHandler';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { logger } from '../utils/logger';

const router = Router();

interface ContractorJobsRequest {
  category: string;
}

const N8N_WEBHOOK_URL = 'https://uncharitable-unparenthesized-shaunta.ngrok-free.dev/webhook-test/contractor-jobs';

// POST /api/contractor-jobs - Get available jobs by category
router.post(
  '/search',
  authMiddleware,
  requireRole('contractor'),
  asyncHandler(async (req: Request, res: Response) => {
    const { category }: ContractorJobsRequest = req.body;

    if (!category || typeof category !== 'string' || category.trim() === '') {
      return res.status(400).json({
        success: false,
        error: 'Category is required and must be a non-empty string',
      });
    }

    try {
      logger.info(`Fetching contractor jobs for category: ${category}`);

      // Call n8n webhook
      const response = await axios.post<any>(N8N_WEBHOOK_URL, {
        category: category.trim(),
      });

      logger.info(`n8n response received for category ${category}:`, response.data);

      return res.status(200).json({
        success: true,
        jobs: response.data,
      });
    } catch (error: any) {
      logger.error('Error fetching contractor jobs from n8n:', error);

      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch jobs from n8n';

      return res.status(error.response?.status || 500).json({
        success: false,
        error: errorMessage,
      });
    }
  })
);

export default router;
