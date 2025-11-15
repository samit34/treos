# Backend API Documentation

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/care-service
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRE=1d
JWT_REFRESH_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@careservice.com
FRONTEND_URL=http://localhost:5173
```

3. Start the development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address

### Users
- `GET /api/users/profile` - Get user profile (Protected)
- `PUT /api/users/profile` - Update user profile (Protected)
- `POST /api/users/onboarding` - Complete onboarding (Protected)
- `POST /api/users/profile-picture` - Upload profile picture (Protected)
- `POST /api/users/change-password` - Change password (Protected)
- `GET /api/users/all` - Get all users (Admin only)

### Jobs
- `POST /api/jobs` - Create a new job (Client/Admin)
- `GET /api/jobs` - Get all jobs (Protected)
- `GET /api/jobs/:id` - Get job by ID (Protected)
- `PUT /api/jobs/:id` - Update job (Protected)
- `DELETE /api/jobs/:id` - Delete job (Protected)
- `POST /api/jobs/:id/select-worker` - Select worker for job (Client/Admin)
- `POST /api/jobs/:id/complete` - Mark job as completed (Protected)

### Proposals
- `POST /api/proposals` - Create a proposal (Worker/Admin)
- `GET /api/proposals` - Get all proposals (Protected)
- `GET /api/proposals/:id` - Get proposal by ID (Protected)
- `PUT /api/proposals/:id` - Update proposal (Protected)
- `DELETE /api/proposals/:id` - Delete proposal (Protected)

### Chat
- `GET /api/chat/conversations` - Get all conversations (Protected)
- `POST /api/chat/conversations` - Create or get conversation (Protected)
- `GET /api/chat/conversations/:conversationId/messages` - Get messages (Protected)
- `POST /api/chat/messages` - Send message (Protected)
- `GET /api/chat/unread-count` - Get unread message count (Protected)

### Payments
- `POST /api/payments` - Create payment (Protected)
- `GET /api/payments` - Get payments (Protected)

### Admin
- `GET /api/admin/dashboard/stats` - Get dashboard statistics (Admin)
- `PUT /api/admin/users/:userId` - Update user (Admin)
- `DELETE /api/admin/users/:userId` - Delete user (Admin)
- `GET /api/admin/jobs` - Get all jobs (Admin)
- `GET /api/admin/payments` - Get all payments (Admin)

## WebSocket Events

### Client to Server
- `join-conversation` - Join a conversation room
- `leave-conversation` - Leave a conversation room
- `send-message` - Send a message
- `typing` - Send typing indicator
- `mark-read` - Mark message as read

### Server to Client
- `new-message` - New message received
- `message-notification` - Message notification
- `user-typing` - User typing indicator
- `message-read` - Message read confirmation

## Models

### User
- firstName, lastName, email, password
- role: 'client' | 'worker' | 'admin'
- phone, dateOfBirth, address
- profilePicture, isEmailVerified
- onboardingCompleted
- qualifications, availability, hourlyRate, bio (worker)
- supportNeeds (client)

### Job
- client, title, description, careType
- location, schedule, hourlyRate
- status: 'open' | 'in-progress' | 'completed' | 'cancelled'
- selectedWorker, requirements

### Proposal
- job, worker, message, proposedRate
- status: 'pending' | 'accepted' | 'rejected'

### Message
- conversation, sender, receiver, content
- isRead

### Payment
- job, client, worker, amount
- status: 'pending' | 'completed' | 'failed' | 'refunded'
- paymentMethod, transactionId, paidAt

