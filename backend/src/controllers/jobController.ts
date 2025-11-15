import { Response, NextFunction } from 'express';
import Job from '../models/Job';
import Proposal from '../models/Proposal';
import type { IProposal } from '../models/Proposal';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendEmail } from '../utils/sendEmail';

export const createJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const jobData = {
      ...req.body,
      client: req.user?._id,
    };

    const job = await Job.create(jobData);

    res.status(201).json({
      success: true,
      message: 'Job created successfully',
      data: { job },
    });
  } catch (error) {
    next(error);
  }
};

export const getJobs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, page = 1, limit = 10, search, careType } = req.query;
    const query: any = {};

    if (req.user?.role === 'client') {
      query.client = req.user._id;
    } else if (req.user?.role === 'worker') {
      query.status = 'open';
    }

    if (status) query.status = status;
    if (careType) query.careType = careType;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const jobs = await Job.find(query)
      .populate('client', 'firstName lastName email profilePicture')
      .populate('selectedWorker', 'firstName lastName email profilePicture rating totalReviews')
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

export const getJobById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('client', 'firstName lastName email profilePicture address')
      .populate(
        'selectedWorker',
        'firstName lastName email profilePicture rating totalReviews bio qualifications'
      );

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    // Get proposals if user is client or worker
    let proposals: IProposal[] = [];
    const requesterId = req.user?._id as string | undefined;

    if (req.user?.role === 'client' && requesterId && job.client.toString() === requesterId) {
      proposals = await Proposal.find({ job: job._id })
        .populate(
          'worker',
          'firstName lastName email profilePicture rating totalReviews bio qualifications hourlyRate'
        );
    } else if (req.user?.role === 'worker' && requesterId) {
      const workerProposal = await Proposal.findOne({
        job: job._id,
        worker: requesterId,
      });
      if (workerProposal) {
        proposals = [workerProposal];
      }
    }

    res.json({
      success: true,
      data: { job, proposals },
    });
  } catch (error) {
    next(error);
  }
};

export const updateJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    const requesterId = req.user?._id as string | undefined;

    if (!requesterId || job.client.toString() !== requesterId) {
      res.status(403).json({ message: 'Not authorized to update this job' });
      return;
    }

    const updatedJob = await Job.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('client', 'firstName lastName email');

    res.json({
      success: true,
      message: 'Job updated successfully',
      data: { job: updatedJob },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    const requesterId = req.user?._id as string | undefined;

    if ((!requesterId || job.client.toString() != requesterId) ) {
      res.status(403).json({ message: 'Not authorized to delete this job' });
      return;
    }

    await Job.findByIdAndDelete(req.params.id);
    await Proposal.deleteMany({ job: req.params.id });

    res.json({
      success: true,
      message: 'Job deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const selectWorker = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { workerId, proposalId } = req.body;
    const job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    const requesterId = req.user?._id as string | undefined;

    if (!requesterId || job.client.toString() != requesterId) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    // Update job
    job.selectedWorker = workerId;
    job.status = 'in-progress';
    if (proposalId) {
      job.selectedProposal = proposalId;
    } else {
      job.selectedProposal = undefined;
    }
    await job.save();

    // Update proposal
    if (proposalId) {
      await Proposal.findByIdAndUpdate(proposalId, { status: 'accepted' });
      await Proposal.updateMany(
        { job: job._id, _id: { $ne: proposalId } },
        { status: 'rejected' }
      );
    }

    const [worker, client] = await Promise.all([
      User.findById(workerId).select('firstName lastName email'),
      User.findById(job.client).select('firstName lastName'),
    ]);

    if (worker?.email) {
      const clientName = `${client?.firstName || ''} ${client?.lastName || ''}`.trim() ||
        client?.firstName ||
        'The client';
      const html = `
        <h2>Your Proposal Was Accepted</h2>
        <p>Hello ${worker.firstName || 'there'},</p>
        <p>${clientName} has accepted your proposal for the job "${job.title}".</p>
        <p><strong>Job Details:</strong></p>
        <ul>
          <li>Start Date: ${new Date(job.schedule.startDate).toLocaleDateString()}</li>
          <li>Time: ${job.schedule.hours.start} - ${job.schedule.hours.end}</li>
          <li>Location: ${job.location.city}, ${job.location.state}</li>
        </ul>
        <p>Please reach out via the Care Service platform to coordinate next steps.</p>
      `;

      sendEmail(worker.email, 'Your proposal has been accepted', html).catch((error) => {
        console.error('Failed to send proposal acceptance email:', error);
      });
    }

    res.json({
      success: true,
      message: 'Worker selected successfully',
      data: { job },
    });
  } catch (error) {
    next(error);
  }
};

export const completeJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    const requesterId = req.user?._id as string | undefined;

    if (job.client.toString() != requesterId ) {
      res.status(403).json({ message: 'Not authorized' });
      return;
    }

    // if(req.user?.role !=='worker') {
    //   res.status(403).json({ message: 'Not authorized' });
    //   return;
    // }

    job.status = 'completed';
    await job.save();

    res.json({
      success: true,
      message: 'Job marked as completed',
      data: { job },
    });
  } catch (error) {
    next(error);
  }
};

