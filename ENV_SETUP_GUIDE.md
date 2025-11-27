# Environment Variables Setup Guide

This guide will help you set up the `.env` files for production deployment.

## 📁 Backend Environment Variables

Create a `.env` file in the `backend/` directory with the following variables:

### Step 1: Create Backend .env File

1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```

2. Create a `.env` file:
   ```bash
   # On Windows PowerShell
   New-Item .env -ItemType File
   
   # On Windows CMD
   type nul > .env
   
   # On Linux/Mac
   touch .env
   ```

3. Copy the following content into your `.env` file:

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/care-service?retryWrites=true&w=majority
# OR for local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/care-service

# JWT Configuration (IMPORTANT: Generate strong random secrets!)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-this-in-production
JWT_EXPIRE=1d
JWT_REFRESH_EXPIRE=7d

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@careservice.com

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://dashboard.tros.com.au

# Admin Email (optional)
ADMIN_EMAIL=admin@careservice.com

# Google OAuth Configuration (optional)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### ⚠️ Important Backend Variables to Update:

1. **MONGODB_URI**: 
   - For production, use MongoDB Atlas or your production database
   - Format: `mongodb+srv://username:password@cluster.mongodb.net/database-name`

2. **JWT_SECRET & JWT_REFRESH_SECRET**: 
   - Generate strong random strings (at least 32 characters)
   - You can generate secrets using:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```

3. **EMAIL_USER & EMAIL_PASS**: 
   - Your Gmail address and App Password
   - To create an App Password in Gmail:
     1. Go to Google Account Settings
     2. Security → 2-Step Verification → App passwords
     3. Generate a new app password
     4. Use this password in EMAIL_PASS

4. **FRONTEND_URL**: 
   - Set to: `http://dashboard.tros.com.au`

5. **GOOGLE_CLIENT_ID** (if using Google login):
   - Get from Google Cloud Console
   - Create OAuth 2.0 credentials

---

## 📁 Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

### Step 2: Create Frontend .env File

1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```

2. Create a `.env` file:
   ```bash
   # On Windows PowerShell
   New-Item .env -ItemType File
   
   # On Windows CMD
   type nul > .env
   
   # On Linux/Mac
   touch .env
   ```

3. Copy the following content into your `.env` file:

```env
# API Base URL
VITE_API_BASE_URL=http://dashboard.tros.com.au/api

# Google OAuth Client ID (optional, if using Google login)
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### ⚠️ Important Frontend Variables:

1. **VITE_API_BASE_URL**: 
   - Set to: `http://dashboard.tros.com.au/api`
   - This should match your backend API URL

2. **VITE_GOOGLE_CLIENT_ID**:
   - Same as backend GOOGLE_CLIENT_ID (if using Google login)

---

## 🔒 Security Checklist

- [ ] **Never commit `.env` files to Git** (they should be in `.gitignore`)
- [ ] Use strong, random secrets for JWT tokens
- [ ] Use environment-specific database connections
- [ ] Never share your `.env` files publicly
- [ ] Use App Passwords for email (not your regular password)
- [ ] Regularly rotate secrets in production

---

## 🚀 Production Deployment Notes

### Backend:
1. Make sure your MongoDB database is accessible from your production server
2. Ensure your email service (Gmail SMTP) is configured correctly
3. Set `NODE_ENV=production` for optimized performance
4. Configure your server's firewall to allow connections on your PORT

### Frontend:
1. Rebuild the frontend after changing `.env` variables:
   ```bash
   npm run build
   ```
2. The `.env` variables are baked into the build at build time
3. Make sure `VITE_API_BASE_URL` points to your production backend

---

## 📝 Example Complete Setup

### Backend `.env` (Production):
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://produser:securepass@cluster0.mongodb.net/care-service?retryWrites=true&w=majority
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
JWT_REFRESH_SECRET=z9y8x7w6v5u4t3s2r1q0p9o8n7m6l5k4j3i2h1g0f9e8d7c6b5a4
JWT_EXPIRE=1d
JWT_REFRESH_EXPIRE=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=contact@tros.com.au
EMAIL_PASS=abcd efgh ijkl mnop
EMAIL_FROM=noreply@tros.com.au
FRONTEND_URL=http://dashboard.tros.com.au
ADMIN_EMAIL=admin@tros.com.au
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

### Frontend `.env` (Production):
```env
VITE_API_BASE_URL=http://dashboard.tros.com.au/api
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

---

## ❓ Troubleshooting

### Backend won't start:
- Check that MongoDB connection string is correct
- Verify all required environment variables are set
- Check file permissions on `.env` file

### Frontend can't connect to API:
- Verify `VITE_API_BASE_URL` matches your backend URL
- Check CORS settings in backend (`FRONTEND_URL`)
- Ensure backend is running and accessible

### Email not sending:
- Verify Gmail App Password is correct
- Check Gmail security settings allow "Less secure app access" or use App Password
- Verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS are correct

---

## 📞 Need Help?

If you encounter issues:
1. Check the console logs for specific error messages
2. Verify all environment variables are correctly set
3. Ensure all services (MongoDB, Email) are properly configured
4. Check network connectivity between frontend and backend

