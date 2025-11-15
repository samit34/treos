import express from 'express';
import { createReview, getReviewsForUser, getReviewsForJob } from '../controllers/reviewController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', authenticate, createReview);
router.get('/user/:userId', authenticate, getReviewsForUser);
router.get('/job/:jobId', authenticate, getReviewsForJob);

export default router;

