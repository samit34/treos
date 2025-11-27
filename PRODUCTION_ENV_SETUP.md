# Production Environment Variables Setup Guide

Your `.env` files already exist! Here's what you need to set for production at `http://dashboard.tros.com.au`.

---

## 🔧 Backend `.env` File

**Location:** `backend/.env`

Copy and paste this into your `backend/.env` file (update the values marked with `REPLACE_THIS`):

```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
# REPLACE_THIS: Use your production MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/care-service?retryWrites=true&w=majority
# OR if using local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/care-service

# JWT Configuration (IMPORTANT: Generate strong secrets!)
# REPLACE_THIS: Generate random secrets using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=REPLACE_WITH_STRONG_RANDOM_SECRET_32_CHARS_MIN
JWT_REFRESH_SECRET=REPLACE_WITH_STRONG_RANDOM_SECRET_32_CHARS_MIN
JWT_EXPIRE=1d
JWT_REFRESH_EXPIRE=7d

# Email Configuration (SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
# REPLACE_THIS: Your Gmail address
EMAIL_USER=your-email@gmail.com
# REPLACE_THIS: Gmail App Password (not your regular password!)
EMAIL_PASS=your-gmail-app-password
# REPLACE_THIS: The "from" email address
EMAIL_FROM=noreply@tros.com.au

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://dashboard.tros.com.au

# Admin Email (optional - admin will receive copies of emails)
ADMIN_EMAIL=admin@tros.com.au

# Google OAuth Configuration (optional - if using Google login)
# REPLACE_THIS: Your Google OAuth Client ID from Google Cloud Console
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 🔑 Quick Steps to Update Backend `.env`:

1. **Open** `backend/.env` in your text editor

2. **Set these values:**
   - `MONGODB_URI` → Your production MongoDB connection string
   - `JWT_SECRET` → Generate a random secret (see command below)
   - `JWT_REFRESH_SECRET` → Generate a random secret (see command below)
   - `EMAIL_USER` → Your Gmail address
   - `EMAIL_PASS` → Gmail App Password ([How to create](https://support.google.com/accounts/answer/185833))
   - `EMAIL_FROM` → Your "from" email address
   - `FRONTEND_URL` → `http://dashboard.tros.com.au`
   - `GOOGLE_CLIENT_ID` → (Optional) Your Google OAuth Client ID

3. **Generate JWT Secrets:**
   ```powershell
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Run this command twice - once for `JWT_SECRET` and once for `JWT_REFRESH_SECRET`

---

## ⚛️ Frontend `.env` File

**Location:** `frontend/.env`

Copy and paste this into your `frontend/.env` file:

```env
# API Base URL - Points to your production backend
VITE_API_BASE_URL=http://dashboard.tros.com.au/api

# Google OAuth Client ID (optional - if using Google login)
# Should match the GOOGLE_CLIENT_ID in backend/.env
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
```

### 🔑 Quick Steps to Update Frontend `.env`:

1. **Open** `frontend/.env` in your text editor

2. **Set these values:**
   - `VITE_API_BASE_URL` → `http://dashboard.tros.com.au/api`
   - `VITE_GOOGLE_CLIENT_ID` → (Optional) Same as backend `GOOGLE_CLIENT_ID`

3. **After updating:** Rebuild your frontend:
   ```powershell
   cd frontend
   npm run build
   ```

---

## ✅ Complete Example (Production Ready)

### Backend `.env` (Example):
```env
PORT=5000
NODE_ENV=production
MONGODB_URI=mongodb+srv://produser:SecurePass123@cluster0.abc123.mongodb.net/care-service?retryWrites=true&w=majority
JWT_SECRET=a7f3d8e2c9b1f5a8d3e7c2b9f6a4d8e1c5b7a3d9e2f6c4b8a1d5e7c3b9f2a6d8e4
JWT_REFRESH_SECRET=f2e9d8c7b6a5f4e3d2c1b9a8f7e6d5c4b3a2f9e8d7c6b5a4f3e2d1c9b8a7f6
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

### Frontend `.env` (Example):
```env
VITE_API_BASE_URL=http://dashboard.tros.com.au/api
VITE_GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
```

---

## 🔒 Security Checklist

- ✅ **JWT Secrets**: Use strong, random strings (32+ characters)
- ✅ **Database**: Use production MongoDB connection string
- ✅ **Email Password**: Use Gmail App Password, NOT your regular password
- ✅ **Never commit** `.env` files to Git (should be in `.gitignore`)
- ✅ **FRONTEND_URL**: Must be `http://dashboard.tros.com.au` for production

---

## 📧 Gmail App Password Setup

If you need to set up Gmail App Password:

1. Go to your [Google Account](https://myaccount.google.com/)
2. Click **Security** → **2-Step Verification** (enable if not enabled)
3. Scroll down to **App passwords**
4. Select app: **Mail**, device: **Other (Custom name)**
5. Enter name: "Care Service Production"
6. Click **Generate**
7. Copy the 16-character password (looks like: `abcd efgh ijkl mnop`)
8. Use this password in `EMAIL_PASS` (include spaces or not, both work)

---

## 🚀 After Setup

1. **Backend**: Restart your backend server
   ```powershell
   cd backend
   npm run dev
   ```

2. **Frontend**: Rebuild your frontend
   ```powershell
   cd frontend
   npm run build
   ```

3. **Verify**: Check that:
   - Backend connects to MongoDB ✅
   - Frontend can call backend API ✅
   - Email service works (test signup) ✅

---

## ❓ Troubleshooting

**Backend won't start?**
- Check MongoDB connection string
- Verify all required variables are set
- Check for typos in `.env` file

**Frontend can't connect to API?**
- Verify `VITE_API_BASE_URL=http://dashboard.tros.com.au/api`
- Check backend CORS settings (`FRONTEND_URL` in backend `.env`)
- Ensure backend is running

**Email not sending?**
- Verify Gmail App Password is correct
- Check Gmail security settings
- Verify EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS

---

**Need help?** Check the main `ENV_SETUP_GUIDE.md` for more detailed information.

