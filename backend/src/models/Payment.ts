import mongoose, { Document, Schema } from 'mongoose';

export interface IPayment extends Document {
  job: mongoose.Types.ObjectId;
  client: mongoose.Types.ObjectId;
  worker: mongoose.Types.ObjectId;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema: Schema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    client: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    worker: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
    paymentMethod: { type: String, required: true },
    transactionId: { type: String },
    paidAt: { type: Date },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IPayment>('Payment', PaymentSchema);

