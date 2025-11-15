import express from 'express';
import { createPayment, getPayments } from '../controllers/paymentController';
import { authenticate } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', authenticate, createPayment);
router.get('/', authenticate, getPayments);

export default router;

