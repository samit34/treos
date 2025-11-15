import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  googleId?: string;
  role: 'client' | 'worker' | 'admin';
  phone?: string;
  dateOfBirth?: Date;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  profilePicture?: string;
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  passwordChangeOTP?: string;
  passwordChangeOTPExpires?: Date;
  onboardingCompleted: boolean;
  // Worker specific fields
  qualifications?: string[];
  availability?: {
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
  hourlyRate?: number;
  bio?: string;
  rating?: number;
  totalReviews?: number;
  // Client specific fields
  supportNeeds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['client', 'worker', 'admin'], required: true },
    phone: { type: String, trim: true },
    dateOfBirth: { type: Date },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      zipCode: { type: String },
      country: { type: String },
    },
    profilePicture: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    emailVerificationToken: { type: String },
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },
    passwordChangeOTP: { type: String },
    passwordChangeOTPExpires: { type: Date },
    onboardingCompleted: { type: Boolean, default: false },
    qualifications: [{ type: String }],
    availability: {
      days: [{ type: String }],
      hours: {
        start: { type: String },
        end: { type: String },
      },
    },
    hourlyRate: { type: Number },
    bio: { type: String },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    supportNeeds: [{ type: String }],
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IUser>('User', UserSchema);

