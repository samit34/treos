import express from 'express';
import {
  getDashboardStats,
  manageUser,
  getAllJobs,
  getAllPayments,
} from '../controllers/adminController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard/stats', getDashboardStats);
router.put('/users/:userId', manageUser);
router.delete('/users/:userId', manageUser);
router.get('/jobs', getAllJobs);
router.get('/payments', getAllPayments);

export default router;

