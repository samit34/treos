import { Response, NextFunction } from 'express';
import Payment from '../models/Payment';
import Job from '../models/Job';
import { AuthRequest } from '../middlewares/authMiddleware';

export const createPayment = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId, paymentMethod } = req.body;

    const job = await Job.findById(jobId).populate('client selectedWorker');

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    if (job.status !== 'completed') {
      res.status(400).json({ message: 'Job must be completed before payment' });
      return;
    }

    // Calculate payment amount (simplified - you might want to calculate based on hours worked)
    const amount = job.hourlyRate * 8; // Example: 8 hours

    const payment = await Payment.create({
      job: jobId,
      client: job.client,
      worker: job.selectedWorker,
      amount,
      paymentMethod,
      status: 'pending',
    });

    // In a real application, you would integrate with a payment gateway here
    // For now, we'll mark it as completed
    payment.status = 'completed';
    payment.paidAt = new Date();
    payment.transactionId = `TXN-${Date.now()}`;
    await payment.save();

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully',
      data: { payment },
    });
  } catch (error) {
    next(error);
  }
};

export const getPayments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query: any = {};

    if (req.user?.role === 'client') {
      query.client = req.user._id;
    } else if (req.user?.role === 'worker') {
      query.worker = req.user._id;
    }

    if (status) query.status = status;

    const payments = await Payment.find(query)
      .populate('client', 'firstName lastName email')
      .populate('worker', 'firstName lastName email')
      .populate('job', 'title')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Payment.countDocuments(query);

    res.json({
      success: true,
      data: {
        payments,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

