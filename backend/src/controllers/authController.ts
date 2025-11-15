import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import { jwtConfig } from '../config/jwt';
import { sendVerificationEmail, sendPasswordResetEmail } from '../utils/sendEmail';
import { AuthRequest } from '../middlewares/authMiddleware';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const signup = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists with this email' });
      return;
    }

    // Password is required for regular signup
    if (!password) {
      res.status(400).json({ message: 'Password is required' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user (role will be set during onboarding)
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      role: 'client', // Default role, will be updated during onboarding
      emailVerificationToken: verificationToken,
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    // Generate tokens
    const accessToken = jwt.sign({ userId: user._id }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    const refreshToken = jwt.sign({ userId: user._id }, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    });

    res.status(201).json({
      success: true,
      message: 'User created successfully. Please verify your email.',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check if user is a Google OAuth user (no password)
    if (!user.password) {
      res.status(401).json({ message: 'This account uses Google sign-in. Please use Google to login.' });
      return;
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Generate tokens
    const accessToken = jwt.sign({ userId: user._id }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    const refreshToken = jwt.sign({ userId: user._id }, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
          profilePicture: user.profilePicture,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({ message: 'Refresh token required' });
      return;
    }

    const decoded = jwt.verify(refreshToken, jwtConfig.refreshSecret) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user) {
      res.status(401).json({ message: 'Invalid refresh token' });
      return;
    }

    const accessToken = jwt.sign({ userId: user._id }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    res.json({
      success: true,
      data: { accessToken },
    });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired refresh token' });
  }
};

export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    await sendPasswordResetEmail(email, resetToken);

    res.json({
      success: true,
      message: 'Password reset email sent',
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({ message: 'Invalid or expired reset token' });
      return;
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      res.status(400).json({ message: 'Invalid verification token' });
      return;
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('accessToken');
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const googleAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ message: 'Google token is required' });
      return;
    }

    // Verify the Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      res.status(400).json({ message: 'Invalid Google token' });
      return;
    }

    const { sub: googleId, email, given_name: firstName, family_name: lastName, picture } = payload;

    if (!email) {
      res.status(400).json({ message: 'Email not provided by Google' });
      return;
    }

    // Check if user exists by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // If user exists but doesn't have googleId, add it
      if (!user.googleId) {
        user.googleId = googleId;
        if (picture && !user.profilePicture) {
          user.profilePicture = picture;
        }
        await user.save();
      }
    } else {
      // Create new user (role will be set during onboarding)
      const [first, ...lastParts] = (firstName || '').split(' ') || ['User'];
      const last = lastName || lastParts.join(' ') || '';

      user = await User.create({
        firstName: first || 'User',
        lastName: last,
        email,
        googleId,
        role: 'client', // Default role, will be updated during onboarding
        profilePicture: picture,
        isEmailVerified: true, // Google emails are verified
      });
    }

    // Generate tokens
    const accessToken = jwt.sign({ userId: user._id }, jwtConfig.secret, {
      expiresIn: jwtConfig.expiresIn,
    });

    const refreshToken = jwt.sign({ userId: user._id }, jwtConfig.refreshSecret, {
      expiresIn: jwtConfig.refreshExpiresIn,
    });

    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          onboardingCompleted: user.onboardingCompleted,
          profilePicture: user.profilePicture,
        },
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    next(error);
  }
};

