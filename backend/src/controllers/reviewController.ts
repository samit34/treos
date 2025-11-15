import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Review from '../models/Review';
import Job from '../models/Job';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';

const recalculateUserRating = async (userId: string, reviewType: 'worker' | 'client') => {
  const stats = await Review.aggregate([
    { $match: { reviewee: new mongoose.Types.ObjectId(userId), reviewType } },
    {
      $group: {
        _id: '$reviewee',
        totalReviews: { $sum: 1 },
        averageRating: { $avg: '$rating' },
      },
    },
  ]);

  if (stats.length === 0) {
    await User.findByIdAndUpdate(userId, { rating: 0, totalReviews: 0 });
    return;
  }

  const [{ totalReviews, averageRating }] = stats;
  await User.findByIdAndUpdate(userId, {
    rating: Math.round(averageRating * 10) / 10,
    totalReviews,
  });
};

export const createReview = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reviewerId = req.user?._id;
    const reviewerRole = req.user?.role;
    const { jobId, revieweeId, rating, comment } = req.body;

    if (!reviewerId) {
      res.status(401).json({ message: 'Authentication required.' });
      return;
    }

    if (!jobId || !revieweeId || typeof rating === 'undefined' || !comment) {
      res.status(400).json({ message: 'Job, reviewee, rating, and comment are required.' });
      return;
    }

    const numericRating = Number(rating);

    if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
      res.status(400).json({ message: 'Rating must be a number between 1 and 5.' });
      return;
    }

    if (!['client', 'worker'].includes(reviewerRole ?? '')) {
      res.status(403).json({ message: 'Only clients and workers can leave reviews.' });
      return;
    }

    const job = await Job.findById(jobId).select('client selectedWorker status');

    if (!job) {
      res.status(404).json({ message: 'Job not found.' });
      return;
    }

    if (!job.selectedWorker) {
      res.status(400).json({ message: 'Review not allowed: no worker assigned to this job.' });
      return;
    }

    if (job.status !== 'completed') {
      res.status(400).json({ message: 'You can only leave a review after the job is completed.' });
      return;
    }

    const jobClientId = job.client.toString();
    const jobWorkerId = job.selectedWorker.toString();
    const revieweeIdStr = String(revieweeId);

    if (reviewerRole === 'client') {
      if (jobClientId !== reviewerId.toString()) {
        res.status(403).json({ message: 'Not authorized to review this worker for the selected job.' });
        return;
      }

      if (jobWorkerId !== revieweeIdStr) {
        res.status(400).json({ message: 'You can only review the worker assigned to this job.' });
        return;
      }
    } else if (reviewerRole === 'worker') {
      if (jobWorkerId !== reviewerId.toString()) {
        res.status(403).json({ message: 'Not authorized to review this client for the selected job.' });
        return;
      }

      if (jobClientId !== revieweeIdStr) {
        res.status(400).json({ message: 'You can only review the client who posted this job.' });
        return;
      }
    }

    const existingReview = await Review.findOne({
      job: job._id,
      reviewer: reviewerId,
      reviewee: revieweeId,
    });

    if (existingReview) {
      res.status(400).json({ message: 'You have already reviewed this user for this job.' });
      return;
    }

    const reviewType: 'worker' | 'client' = reviewerRole === 'client' ? 'worker' : 'client';

    const review = await Review.create({
      job: job._id,
      reviewer: reviewerId,
      reviewee: revieweeId,
      rating: numericRating,
      comment,
      reviewType,
    });

    await recalculateUserRating(revieweeIdStr, reviewType);

    const populatedReview = await Review.findById(review._id)
      .populate('job', 'title')
      .populate('reviewer', 'firstName lastName role profilePicture rating totalReviews')
      .populate('reviewee', 'firstName lastName role profilePicture rating totalReviews');
    const reviewResponse = populatedReview ?? review;

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully.',
      data: { review: reviewResponse },
    });
  } catch (error) {
    if (error && (error as any).code === 11000) {
      res.status(400).json({ message: 'You have already reviewed this user for this job.' });
      return;
    }
    next(error);
  }
};

export const getReviewsForUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    const filter: Record<string, unknown> = { reviewee: userId };
    if (type && typeof type === 'string') {
      filter.reviewType = type;
    }

    const reviews = await Review.find(filter)
      .populate('job', 'title')
      .populate('reviewer', 'firstName lastName role profilePicture rating totalReviews')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { reviews },
    });
  } catch (error) {
    next(error);
  }
};

export const getReviewsForJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId } = req.params;

    const reviews = await Review.find({ job: jobId })
      .populate('reviewer', 'firstName lastName role profilePicture rating totalReviews')
      .populate('reviewee', 'firstName lastName role profilePicture rating totalReviews')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: { reviews },
    });
  } catch (error) {
    next(error);
  }
};

