import { Response, NextFunction } from 'express';
import Proposal from '../models/Proposal';
import Job from '../models/Job';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendEmail } from '../utils/sendEmail';

export const createProposal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId, message, proposedRate } = req.body;

    const requesterId = req.user?._id as string | undefined;
    if (!requesterId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    // Check if job exists and is open
    const job = await Job.findById(jobId).populate('client', 'firstName lastName email');
    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    if (job.status !== 'open') {
      res.status(400).json({ message: 'Job is not open for proposals' });
      return;
    }

    // Check if worker already applied
    const existingProposal = await Proposal.findOne({
      job: jobId,
      worker: requesterId,
    });

    if (existingProposal) {
      res.status(400).json({ message: 'You have already submitted a proposal for this job' });
      return;
    }

    const proposal = await Proposal.create({
      job: jobId,
      worker: requesterId,
      message,
      proposedRate,
      initiatedBy: 'worker',
    });

  const populatedProposal = await Proposal.findById(proposal._id)
      .populate('worker', 'firstName lastName email profilePicture rating totalReviews')
      .populate('job', 'title description');

    const clientUser = job?.client as { firstName?: string; lastName?: string; email?: string } | undefined;

    if (clientUser?.email) {
      const workerProfile = await User.findById(requesterId).select(
        'firstName lastName email'
      );

      const clientName = `${clientUser.firstName || ''} ${clientUser.lastName || ''}`.trim() ||
        clientUser.firstName ||
        'Client';
      const workerName = `${workerProfile?.firstName || ''} ${workerProfile?.lastName || ''}`.trim() ||
        workerProfile?.firstName ||
        'A worker';

      const html = `
        <h2>New Proposal Received</h2>
        <p>Hello ${clientName},</p>
        <p>${workerName} has submitted a proposal for your job "${job.title}".</p>
        <p><strong>Proposed Rate:</strong> $${proposedRate}/hr</p>
        <p><strong>Message:</strong></p>
        <p>${message}</p>
        <p>Please review the proposal in your Care Service dashboard.</p>
      `;

      sendEmail(clientUser.email, 'New proposal for your job', html).catch((error) => {
        console.error('Failed to send proposal notification email:', error);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Proposal submitted successfully',
      data: { proposal: populatedProposal },
    });
  } catch (error) {
    next(error);
  }
};

export const getProposals = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId, status, page = 1, limit = 10, initiatedBy } = req.query;
    const query: any = {};
    const requesterId = req.user?._id as string | undefined;

    if (req.user?.role === 'worker' && requesterId) {
      query.worker = requesterId;
    } else if (req.user?.role === 'client' && jobId) {
      query.job = jobId;
    }

    if (status) query.status = status;
    if (initiatedBy) query.initiatedBy = initiatedBy;

    const proposals = await Proposal.find(query)
      .populate(
        'worker',
        'firstName lastName email profilePicture rating totalReviews bio qualifications phone'
      )
      .populate({
        path: 'job',
        select:
          'title description status hourlyRate schedule location requirements careType client createdAt updatedAt',
        populate: {
          path: 'client',
          select:
            'firstName lastName email phone profilePicture address rating totalReviews bio',
        },
      })
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await Proposal.countDocuments(query);

    res.json({
      success: true,
      data: {
        proposals,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getProposalById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const proposal = await Proposal.findById(req.params.id)
      .populate(
        'worker',
        'firstName lastName email profilePicture rating totalReviews bio qualifications hourlyRate phone'
      )
      .populate({
        path: 'job',
        select:
          'title description status hourlyRate schedule location requirements careType client createdAt updatedAt',
        populate: {
          path: 'client',
          select:
            'firstName lastName email phone profilePicture address rating totalReviews bio',
        },
      });

    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    res.json({
      success: true,
      data: { proposal },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProposal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    const requesterId = req.user?._id as string | undefined;

    if (!requesterId || proposal.worker.toString() !== requesterId) {
      res.status(403).json({ message: 'Not authorized to update this proposal' });
      return;
    }

    if (proposal.initiatedBy !== 'worker') {
      res.status(400).json({ message: 'Cannot update an invitation from a client' });
      return;
    }

    if (proposal.status !== 'pending') {
      res.status(400).json({ message: 'Cannot update a proposal that has been accepted or rejected' });
      return;
    }

    const updatedProposal = await Proposal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('worker', 'firstName lastName email profilePicture')
      .populate('job', 'title description');

    res.json({
      success: true,
      message: 'Proposal updated successfully',
      data: { proposal: updatedProposal },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProposal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const proposal = await Proposal.findById(req.params.id);

    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    const requesterId = req.user?._id as string | undefined;

    if (proposal.initiatedBy !== 'worker') {
      res.status(400).json({ message: 'Cannot delete an invitation from a client' });
      return;
    }

    if ((!requesterId || proposal.worker.toString() !== requesterId) && req.user?.role !== 'admin') {
      res.status(403).json({ message: 'Not authorized to delete this proposal' });
      return;
    }

    await Proposal.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Proposal deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const inviteWorkerToJob = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { jobId, workerId, message, proposedRate } = req.body;

    const requesterId = req.user?._id as string | undefined;

    if (!requesterId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    if (req.user?.role !== 'client') {
      res.status(403).json({ message: 'Only clients can invite workers to jobs' });
      return;
    }

    const job = await Job.findById(jobId).populate('client', 'firstName lastName email');

    if (!job) {
      res.status(404).json({ message: 'Job not found' });
      return;
    }

    const jobClientId = job.client?._id?.toString() || job.client?.toString();

      console.log(jobClientId, requesterId);

    if (jobClientId != requesterId) {
      res.status(403).json({ message: 'You are not authorized to invite workers to this job' });
      return;
    }

    if (job.status !== 'open') {
      res.status(400).json({ message: 'Only open jobs can be sent as invitations' });
      return;
    }

    const worker = await User.findById(workerId).select('firstName lastName email qualifications hourlyRate');

    if (!worker) {
      res.status(404).json({ message: 'Worker not found' });
      return;
    }

    const existingPending = await Proposal.findOne({
      job: jobId,
      worker: workerId,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingPending) {
      res.status(400).json({ message: 'This worker already has an active proposal for this job' });
      return;
    }

    const invitation = await Proposal.create({
      job: jobId,
      worker: workerId,
      message,
      proposedRate,
      initiatedBy: 'client',
    });

    const populatedInvitation = await Proposal.findById(invitation._id)
      .populate('worker', 'firstName lastName email profilePicture rating')
      .populate('job', 'title description schedule location client');

    if (worker.email) {
      const clientUser = job.client as { firstName?: string; lastName?: string } | undefined;
      const clientName = `${clientUser?.firstName || ''} ${clientUser?.lastName || ''}`.trim() ||
        clientUser?.firstName ||
        'A client';

      const jobLocation = job.location
        ? `${job.location.city}, ${job.location.state}`
        : 'Location provided upon acceptance';

      const html = `
        <h2>New Job Invitation</h2>
        <p>Hello ${worker.firstName || 'there'},</p>
        <p>${clientName} has invited you to take on the job "${job.title}".</p>
        ${message ? `<p><strong>Message from client:</strong></p><p>${message}</p>` : ''}
        <p><strong>Details:</strong></p>
        <ul>
          <li>Start Date: ${job.schedule?.startDate ? new Date(job.schedule.startDate).toLocaleDateString() : 'TBD'}</li>
          <li>Hours: ${job.schedule?.hours?.start ?? 'TBD'} - ${job.schedule?.hours?.end ?? 'TBD'}</li>
          <li>Location: ${jobLocation}</li>
        </ul>
        <p>Please log in to your Care Service dashboard to review and respond.</p>
      `;

      sendEmail(worker.email, 'New job invitation', html).catch((error) => {
        console.error('Failed to send job invitation email:', error);
      });
    }

    res.status(201).json({
      success: true,
      message: 'Invitation sent to worker',
      data: { proposal: populatedInvitation },
    });
  } catch (error) {
    next(error);
  }
};

export const respondToProposal = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { action } = req.body as { action?: 'accept' | 'reject' };

    if (!action || !['accept', 'reject'].includes(action)) {
      res.status(400).json({ message: 'A valid action (accept or reject) is required' });
      return;
    }

    const proposal = await Proposal.findById(req.params.id).populate([
      { path: 'job', populate: { path: 'client', select: 'firstName lastName email' } },
      { path: 'worker', select: 'firstName lastName email' },
    ]);

    if (!proposal) {
      res.status(404).json({ message: 'Proposal not found' });
      return;
    }

    const requesterId = req.user?._id as string | undefined;

    if (!requesterId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const workerId =
      (proposal.worker as any)?._id?.toString?.() ?? proposal.worker?.toString?.();

    if (proposal.initiatedBy === 'client') {
      if ( workerId != requesterId) {
        res.status(403).json({ message: 'You are not allowed to respond to this proposal' });
        return;
      }
    } else if (proposal.initiatedBy === 'worker') {
      if (req.user?.role !== 'client') {
        res.status(403).json({ message: 'Only clients can respond to worker proposals' });
        return;
      }

      const jobClient = (proposal.job as unknown as { client?: any })?.client;
      const jobClientId =
        jobClient?._id?.toString?.() ?? jobClient?.toString?.() ?? proposal.job?.toString?.();

      if (!jobClientId || jobClientId !== requesterId) {
        res.status(403).json({ message: 'You are not allowed to respond to this proposal' });
        return;
      }
    }

    if (proposal.status !== 'pending') {
      res.status(400).json({ message: 'This proposal has already been responded to' });
      return;
    }

    if (action === 'accept') {
      proposal.status = 'accepted';
      await proposal.save();

      const jobDoc = await Job.findById(proposal.job).populate('client', 'firstName lastName email');

      if (!jobDoc) {
        res.status(404).json({ message: 'Associated job not found' });
        return;
      }

      if (jobDoc.status === 'open') {
        jobDoc.status = 'in-progress';
      }
      jobDoc.selectedWorker = proposal.worker;
      await jobDoc.save();

      await Proposal.updateMany(
        { job: proposal.job, _id: { $ne: proposal._id } },
        { status: 'rejected' }
      );

      const clientUser = jobDoc.client as unknown as { email?: string; firstName?: string; lastName?: string };

      if (proposal.initiatedBy === 'client' && clientUser?.email) {
        const workerUser = proposal.worker as unknown as { firstName?: string; lastName?: string };
        const workerName = `${workerUser?.firstName || ''} ${workerUser?.lastName || ''}`.trim() ||
          workerUser?.firstName ||
          'The worker';

        const html = `
          <h2>Your invitation was accepted</h2>
          <p>Hello ${clientUser.firstName || 'Client'},</p>
          <p>${workerName} has accepted your invitation for the job "${jobDoc.title}".</p>
          <p>You can now coordinate within the Care Service platform to start the engagement.</p>
        `;

        sendEmail(clientUser.email, 'Worker accepted your job invitation', html).catch((error) => {
          console.error('Failed to send job invitation acceptance email:', error);
        });
      }

      if (proposal.initiatedBy === 'worker' && clientUser?.email) {
        const workerUser = proposal.worker as unknown as { firstName?: string; lastName?: string };
        const workerName = `${workerUser?.firstName || ''} ${workerUser?.lastName || ''}`.trim() ||
          workerUser?.firstName ||
          'The worker';

        const html = `
          <h2>Proposal accepted</h2>
          <p>Hello ${clientUser.firstName || 'Client'},</p>
          <p>You have accepted ${workerName}'s proposal for the job "${jobDoc.title}".</p>
        `;

        sendEmail(clientUser.email, 'You accepted a worker proposal', html).catch((error) => {
          console.error('Failed to send proposal acceptance email to client:', error);
        });
      }

      res.json({
        success: true,
        message: 'Proposal accepted',
        data: { proposal },
      });
      return;
    }

    proposal.status = 'rejected';
    await proposal.save();

    res.json({
      success: true,
      message: 'Proposal rejected',
      data: { proposal },
    });
  } catch (error) {
    next(error);
  }
};

