export interface User {
  id: string;
  _id?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'client' | 'worker' | 'admin';
  phone?: string;
  dateOfBirth?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  profilePicture?: string;
  isEmailVerified: boolean;
  onboardingCompleted: boolean;
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
  supportNeeds?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Job {
  _id: string;
  client: User;
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
    startDate: string;
    endDate?: string;
    days: string[];
    hours: {
      start: string;
      end: string;
    };
  };
  hourlyRate: number;
  status: 'open' | 'in-progress' | 'completed' | 'cancelled';
  selectedWorker?: User;
  selectedProposal?: Proposal | string;
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Proposal {
  _id: string;
  job: Job;
  worker: User;
  message?: string;
  proposedRate?: number;
  status: 'pending' | 'accepted' | 'rejected';
  initiatedBy: 'worker' | 'client';
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  job: {
    _id: string;
    title?: string;
  };
  reviewer: User;
  reviewee: User;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  _id: string;
  participants: User[];
  lastMessage?: Message;
  lastMessageAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: User;
  receiver: User;
  content: string;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id: string;
  job: Job;
  client: User;
  worker: User;
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  transactionId?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

