import mongoose from 'mongoose';
import User from '../models/User';
import Job from '../models/Job';
import Proposal from '../models/Proposal';

interface ChatAssociationResult {
  clientId: string;
  workerId: string;
}

const isValidObjectId = (id?: string | mongoose.Types.ObjectId | null): id is string => {
  if (!id) {
    return false;
  }
  const value = typeof id === 'string' ? id : id.toString();
  return mongoose.Types.ObjectId.isValid(value);
};

export const getChatAssociation = async (
  firstUserId?: string,
  secondUserId?: string
): Promise<ChatAssociationResult | null> => {
  if (!isValidObjectId(firstUserId) || !isValidObjectId(secondUserId)) {
    return null;
  }

  const [firstUser, secondUser] = await Promise.all([
    User.findById(firstUserId).select('role'),
    User.findById(secondUserId).select('role'),
  ]);

  if (!firstUser || !secondUser) {
    return null;
  }

  if (firstUser.role === secondUser.role) {
    return null;
  }

  const clientId = firstUser.role === 'client' ? firstUser.id : secondUser.id;
  const workerId = firstUser.role === 'worker' ? firstUser.id : secondUser.id;

  if (!clientId || !workerId) {
    return null;
  }

  const acceptedJob = await Job.exists({
    client: clientId,
    selectedWorker: workerId,
  });

  if (acceptedJob) {
    return { clientId, workerId };
  }

  const proposal = await Proposal.findOne({
    worker: workerId,
  })
    .sort({ createdAt: -1 })
    .populate({
      path: 'job',
      select: 'client status',
      match: { client: clientId },
    });

  if (proposal?.job) {
    return { clientId, workerId };
  }

  return null;
};


