import { Response, NextFunction } from 'express';
import User from '../models/User';
import Job from '../models/Job';
import Proposal from '../models/Proposal';
import Payment from '../models/Payment';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendEmail } from '../utils/sendEmail';

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
    const { action, isBlocked, blockReason, ...updates } = req.body;

    if (action === 'delete') {
      await User.findByIdAndDelete(userId);
      res.json({
        success: true,
        message: 'User deleted successfully',
      });
    } else {
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      const wasBlocked = user.isBlocked;
      const willBeBlocked = isBlocked !== undefined ? isBlocked : user.isBlocked;

      // Update user
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { ...updates, isBlocked: willBeBlocked },
        { new: true, runValidators: true }
      ).select('-password');

      // Send email notification if block status changed
      if (wasBlocked !== willBeBlocked) {
        const emailSubject = willBeBlocked ? 'Account Blocked' : 'Account Unblocked';
        const emailHtml = willBeBlocked
          ? `
            <h2>Account Blocked</h2>
            <p>Hello ${user.firstName},</p>
            <p>Your account has been blocked by an administrator.</p>
            ${blockReason ? `<p><strong>Reason:</strong> ${blockReason}</p>` : ''}
            <p>If you believe this is an error, please contact support.</p>
          `
          : `
            <h2>Account Unblocked</h2>
            <p>Hello ${user.firstName},</p>
            <p>Your account has been unblocked and you can now access the platform again.</p>
            <p>Thank you for your patience.</p>
          `;

        try {
          await sendEmail(user.email, emailSubject, emailHtml);
        } catch (emailError) {
          console.error('Failed to send block/unblock email:', emailError);
          // Don't fail the request if email fails
        }
      }

      res.json({
        success: true,
        message: 'User updated successfully',
        data: { user: updatedUser },
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

export const deleteJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId } = req.params;
    
    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    // Delete associated proposals
    await Proposal.deleteMany({ job: jobId });
    
    // Delete associated payments
    await Payment.deleteMany({ job: jobId });
    
    // Delete the job
    await Job.findByIdAndDelete(jobId);

    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

