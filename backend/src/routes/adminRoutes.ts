import express from 'express';
import {
  getDashboardStats,
  manageUser,
  getAllJobs,
  getAllPayments,
  deleteJob,
} from '../controllers/adminController';
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getActiveCategories,
} from '../controllers/categoryController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/dashboard/stats', getDashboardStats);
router.put('/users/:userId', manageUser);
router.delete('/users/:userId', manageUser);
router.get('/jobs', getAllJobs);
router.delete('/jobs/:jobId', deleteJob);
router.get('/payments', getAllPayments);

// Category routes
router.get('/categories', listCategories);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

export default router;

