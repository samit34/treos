import express from 'express';
import {
  getProfile,
  updateProfile,
  completeOnboarding,
  uploadProfilePicture,
  changePassword,
  requestPasswordChangeOtp,
  changePasswordWithOtp,
  getAllUsers,
  getWorkers,
  getUserById,
} from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/authMiddleware';
import { upload } from '../middlewares/upload';

const router = express.Router();

router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, updateProfile);
router.post('/onboarding', authenticate, completeOnboarding);
router.post('/profile-picture', authenticate, upload.single('profilePicture'), uploadProfilePicture);
router.post('/change-password', authenticate, changePassword);
router.post('/password-otp', authenticate, requestPasswordChangeOtp);
router.post('/password-otp/verify', authenticate, changePasswordWithOtp);
router.get('/all', authenticate, authorize('admin'), getAllUsers);
router.get('/workers', authenticate, authorize('client', 'admin'), getWorkers);
router.get('/:id', authenticate, getUserById);

export default router;

