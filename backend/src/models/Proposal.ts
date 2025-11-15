import mongoose, { Document, Schema } from 'mongoose';

export interface IProposal extends Document {
  job: mongoose.Types.ObjectId;
  worker: mongoose.Types.ObjectId;
  message?: string;
  proposedRate?: number;
  status: 'pending' | 'accepted' | 'rejected';
  initiatedBy: 'worker' | 'client';
  createdAt: Date;
  updatedAt: Date;
}

const ProposalSchema: Schema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    worker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: {
      type: String,
      required: function required(this: IProposal) {
        return this.initiatedBy === 'worker';
      },
    },
    proposedRate: {
      type: Number,
      required: function required(this: IProposal) {
        return this.initiatedBy === 'worker';
      },
    },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    initiatedBy: { type: String, enum: ['worker', 'client'], default: 'worker' },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IProposal>('Proposal', ProposalSchema);

