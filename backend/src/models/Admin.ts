import mongoose, { Document, Schema } from 'mongoose';

export interface IAdmin extends Document {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  isSuperAdmin: boolean;
  permissions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AdminSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    isSuperAdmin: { type: Boolean, default: false },
    permissions: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IAdmin>('Admin', AdminSchema);

