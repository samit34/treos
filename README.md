# Care Service Platform - Full Stack MERN Application

A comprehensive care service platform connecting Clients and Support Workers with full authentication, role-based dashboards, job posting, messaging, and payments.

## 🚀 Tech Stack

### Frontend
- **React** with TypeScript
- **Redux Toolkit** for state management
- **Tailwind CSS** for styling
- **React Router DOM** for routing
- **Axios** for API calls
- **Formik + Yup** for form handling and validation
- **React Calendar** for scheduling
- **Socket.IO Client** for real-time chat

### Backend
- **Node.js** + **Express.js**
- **MongoDB** with Mongoose
- **JWT** Authentication
- **bcrypt** for password hashing
- **Nodemailer** for emails
- **Socket.IO** for real-time chat
- **TypeScript** for type safety

## 📁 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # Database and JWT configuration
│   │   ├── controllers/     # Route controllers
│   │   ├── models/          # MongoDB models
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Auth and error handling
│   │   ├── services/        # Business logic
│   │   ├── utils/           # Utilities (email, socket)
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # Server entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── api/             # API calls
    │   ├── app/             # Redux store
    │   ├── components/      # Reusable components
    │   ├── features/        # Feature-based Redux slices
    │   ├── hooks/           # Custom hooks
    │   ├── pages/           # Page components
    │   ├── types/           # TypeScript types
    │   ├── utils/           # Utilities
    │   └── main.tsx         # App entry point
    └── package.json
```

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory:
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

4. Start the backend server:
```bash
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

## 🔑 Features

### Authentication
- User signup with role selection (Client/Worker)
- JWT-based authentication with refresh tokens
- Email verification
- Password reset via email
- Onboarding flow for new users

### Client Features
- Post care job requests
- View and manage job applications
- Select workers for jobs
- Schedule services
- Real-time messaging with workers
- Payment processing
- Rate and review workers

### Worker Features
- Browse available jobs
- Submit proposals for jobs
- Manage accepted jobs
- Real-time messaging with clients
- Track earnings
- Manage profile and availability

### Admin Features
- Dashboard with platform statistics
- User management
- Job management
- Payment monitoring
- Reports and analytics

### Chat System
- Real-time messaging using WebSocket
- Conversation management
- Unread message notifications
- Message persistence

## 📝 API Endpoints

### Authentication
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/verify-email` - Verify email address

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/onboarding` - Complete onboarding
- `POST /api/users/profile-picture` - Upload profile picture
- `POST /api/users/change-password` - Change password

### Jobs
- `POST /api/jobs` - Create a new job
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:id` - Get job by ID
- `PUT /api/jobs/:id` - Update job
- `DELETE /api/jobs/:id` - Delete job
- `POST /api/jobs/:id/select-worker` - Select worker for job
- `POST /api/jobs/:id/complete` - Mark job as completed

### Proposals
- `POST /api/proposals` - Create a proposal
- `GET /api/proposals` - Get all proposals
- `GET /api/proposals/:id` - Get proposal by ID
- `PUT /api/proposals/:id` - Update proposal
- `DELETE /api/proposals/:id` - Delete proposal

### Chat
- `GET /api/chat/conversations` - Get all conversations
- `POST /api/chat/conversations` - Create or get conversation
- `GET /api/chat/conversations/:conversationId/messages` - Get messages
- `POST /api/chat/messages` - Send message
- `GET /api/chat/unread-count` - Get unread message count

### Admin
- `GET /api/admin/dashboard/stats` - Get dashboard statistics
- `PUT /api/admin/users/:userId` - Update user
- `DELETE /api/admin/users/:userId` - Delete user
- `GET /api/admin/jobs` - Get all jobs
- `GET /api/admin/payments` - Get all payments

## 🔒 Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Role-based access control (RBAC)
- Input validation and sanitization
- CORS configuration
- Secure cookie handling

## 📦 Building for Production

### Backend
```bash
cd backend
npm run build
npm start
```

### Frontend
```bash
cd frontend
npm run build
```

The built files will be in the `dist` directory.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👥 Authors

- Your Name

## 🙏 Acknowledgments

- React Team
- Express.js Team
- MongoDB Team
- All open-source contributors

