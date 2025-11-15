import mongoose, { Document, Schema } from 'mongoose';

export interface IJob extends Document {
  client: mongoose.Types.ObjectId;
  title: string;
  description: string;
  careType: string;
  location: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  schedule: {
    startDate: Date;
    endDate?: Date;
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
  hourlyRate: number;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  selectedWorker?: mongoose.Types.ObjectId;
  selectedProposal?: mongoose.Types.ObjectId;
  requirements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema: Schema = new Schema(
  {
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    careType: { type: String, required: true },
    location: {
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      zipCode: { type: String, required: true },
    },
    schedule: {
      startDate: { type: Date, required: true },
      endDate: { type: Date },
      days: [{ type: String }],
      hours: {
        start: { type: String, required: true },
        end: { type: String, required: true },
      },
    },
    hourlyRate: { type: Number, required: true },
    status: { type: String, enum: ['open', 'in-progress', 'completed', 'cancelled'], default: 'open' },
    selectedWorker: { type: Schema.Types.ObjectId, ref: 'User' },
    selectedProposal: { type: Schema.Types.ObjectId, ref: 'Proposal' },
    requirements: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IJob>('Job', JobSchema);

