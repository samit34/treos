import { Response, NextFunction } from 'express';
import User from '../models/User';
import Job from '../models/Job';
import Proposal from '../models/Proposal';
import Payment from '../models/Payment';
import { AuthRequest } from '../middlewares/authMiddleware';

export const getDashboardStats = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const totalUsers = await User.countDocuments();
    const totalClients = await User.countDocuments({ role: 'client' });
    const totalWorkers = await User.countDocuments({ role: 'worker' });
    const totalJobs = await Job.countDocuments();
    const openJobs = await Job.countDocuments({ status: 'open' });
    const inProgressJobs = await Job.countDocuments({ status: 'in-progress' });
    const completedJobs = await Job.countDocuments({ status: 'completed' });
    const totalProposals = await Proposal.countDocuments();
    const totalPayments = await Payment.countDocuments({ status: 'completed' });

    const totalRevenue = await Payment.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalClients,
          totalWorkers,
          totalJobs,
          openJobs,
          inProgressJobs,
          completedJobs,
          totalProposals,
          totalPayments,
          totalRevenue: totalRevenue[0]?.total || 0,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const manageUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { userId } = req.params;
    const { action, ...updates } = req.body;

    if (action === 'delete') {
      await User.findByIdAndDelete(userId);
      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } else {
      const user = await User.findByIdAndUpdate(userId, updates, {
        new: true,
        runValidators: true,
      }).select('-password');

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user },
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getAllJobs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query: any = {};

    if (status) query.status = status;

    const jobs = await Job.find(query)
      .populate('client', 'firstName lastName email')
      .populate('selectedWorker', 'firstName lastName email')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Job.countDocuments(query);

    res.json({
      success: true,
      data: {
        jobs,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAllPayments = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query: any = {};

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

