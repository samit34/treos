# Quick Start Guide

## Prerequisites
- Node.js (v18+)
- MongoDB (running locally or MongoDB Atlas account)
- npm or yarn

## Step 1: Clone and Setup Backend

```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/care-service
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_EXPIRE=1d
JWT_REFRESH_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@careservice.com
FRONTEND_URL=http://localhost:5173
```

Start backend:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

## Step 2: Setup Frontend

```bash
cd frontend
npm install
```

Start frontend:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## Step 3: Test the Application

1. Open `http://localhost:5173` in your browser
2. Sign up as a Client or Worker
3. Complete the onboarding process
4. Start using the platform!

## Default User Roles

- **Client**: Can post jobs, view proposals, select workers
- **Worker**: Can browse jobs, submit proposals, manage accepted jobs
- **Admin**: Can manage users, jobs, and view platform statistics

## Features to Test

### As a Client:
1. Post a new job
2. View proposals from workers
3. Select a worker for your job
4. Chat with the selected worker
5. Complete the job and process payment

### As a Worker:
1. Browse available jobs
2. Submit a proposal for a job
3. View your accepted jobs
4. Chat with clients
5. Track your earnings

### Chat System:
1. Navigate to `/chat` route
2. Start a conversation with another user
3. Send real-time messages
4. See typing indicators

## Troubleshooting

### MongoDB Connection Error
- Make sure MongoDB is running locally, or
- Update `MONGODB_URI` in `.env` to your MongoDB Atlas connection string

### Email Not Sending
- Update email credentials in `.env`
- For Gmail, use an App Password instead of your regular password
- Check that `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, and `EMAIL_PASS` are correct

### CORS Errors
- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Default is `http://localhost:5173`

### Socket.IO Connection Issues
- Make sure backend is running on port 5000
- Check that `FRONTEND_URL` is correctly set in backend `.env`
- Verify WebSocket is enabled in your browser

## Next Steps

1. Configure email service for production
2. Set up payment gateway integration (Stripe, PayPal, etc.)
3. Add image upload functionality (Cloudinary integration)
4. Deploy to production (Heroku, AWS, etc.)
5. Set up CI/CD pipeline
6. Add unit and integration tests

## Production Checklist

- [ ] Change JWT secrets to strong, random values
- [ ] Set `NODE_ENV=production`
- [ ] Configure production MongoDB database
- [ ] Set up proper email service
- [ ] Configure CORS for production domain
- [ ] Set up SSL/HTTPS
- [ ] Configure environment variables securely
- [ ] Set up error logging and monitoring
- [ ] Configure rate limiting
- [ ] Set up backup strategy for database

