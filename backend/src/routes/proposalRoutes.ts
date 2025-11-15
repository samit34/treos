import express from 'express';
import {
  createProposal,
  getProposals,
  getProposalById,
  updateProposal,
  deleteProposal,
  inviteWorkerToJob,
  respondToProposal,
} from '../controllers/proposalController';
import { authenticate, authorize } from '../middlewares/authMiddleware';

const router = express.Router();

router.post('/', authenticate, authorize('worker', 'admin'), createProposal);
router.post('/invite', authenticate, authorize('client', 'admin'), inviteWorkerToJob);
router.get('/', authenticate, getProposals);
router.get('/:id', authenticate, getProposalById);
router.put('/:id', authenticate, updateProposal);
router.delete('/:id', authenticate, deleteProposal);
router.post('/:id/respond', authenticate, respondToProposal);

export default router;

