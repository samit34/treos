import express from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  selectWorker,
  completeJob,
} from '../controllers/jobController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', authenticate, authorize('client', 'admin'), createJob);
router.get('/', authenticate, getJobs);
router.get('/:id', authenticate, getJobById);
router.put('/:id', authenticate, updateJob);
router.delete('/:id', authenticate, deleteJob);
router.post('/:id/select-worker', authenticate, authorize('client', 'admin'), selectWorker);
router.post('/:id/complete', authenticate, completeJob);

export default router;

