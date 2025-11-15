import { Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { AuthRequest } from '../middlewares/authMiddleware';
import { sendEmail } from '../utils/sendEmail';

export const getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const updates = req.body;
    const userId = req.user?._id;

    // Remove fields that shouldn't be updated directly (role can only be set during onboarding)
    delete updates.password;
    delete updates.email;
    // Only allow role update if user hasn't completed onboarding
    if (req.user?.onboardingCompleted) {
      delete updates.role;
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const completeOnboarding = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, dateOfBirth, phone, address, qualifications, availability, hourlyRate, bio, supportNeeds } = req.body;
    const userId = req.user?._id;

    // Validate role if provided
    if (role && !['client', 'worker'].includes(role)) {
      res.status(400).json({ message: 'Invalid role. Must be client or worker.' });
      return;
    }

    const updates: any = {
      onboardingCompleted: true,
      dateOfBirth,
      phone,
    };

    // Set role if provided (during onboarding)
    if (role) {
      updates.role = role;
    }

    const finalRole = role || req.user?.role;

    if (address) updates.address = address;
    if (finalRole === 'worker') {
      if (qualifications) updates.qualifications = qualifications;
      if (availability) updates.availability = availability;
      if (hourlyRate) updates.hourlyRate = hourlyRate;
      if (bio) updates.bio = bio;
    }
    if (finalRole === 'client' && supportNeeds) {
      updates.supportNeeds = supportNeeds;
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const uploadProfilePicture = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?._id;

    if (!req.file) {
      res.status(400).json({ message: 'No profile picture uploaded' });
      return;
    }

    const profilePicturePath = `/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      userId,
      { profilePicture: profilePicturePath },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      message: 'Profile picture updated successfully',
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user?._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!user.password) {
      res.status(400).json({ message: 'This account does not have a password. Please use Google sign-in or set a password first.' });
      return;
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ message: 'Current password is incorrect' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordChangeOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.passwordChangeOTP = await bcrypt.hash(otp, 10);
    user.passwordChangeOTPExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    const emailBody = `
      <h2>Password Change Verification</h2>
      <p>Hello ${user.firstName || 'there'},</p>
      <p>Your one-time passcode (OTP) to change your password is:</p>
      <p style="font-size: 24px; font-weight: bold; letter-spacing: 4px;">${otp}</p>
      <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
    `;

    await sendEmail(user.email, 'Your password change OTP', emailBody);

    res.json({
      success: true,
      message: 'An OTP has been sent to your email address.',
    });
  } catch (error) {
    next(error);
  }
};

export const changePasswordWithOtp = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { otp, newPassword } = req.body;
    const user = await User.findById(req.user?._id);

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    if (!otp || !newPassword) {
      res.status(400).json({ message: 'OTP and new password are required.' });
      return;
    }

    if (!user.passwordChangeOTP || !user.passwordChangeOTPExpires) {
      res.status(400).json({ message: 'Please request an OTP before changing your password.' });
      return;
    }

    if (user.passwordChangeOTPExpires.getTime() < Date.now()) {
      user.passwordChangeOTP = undefined;
      user.passwordChangeOTPExpires = undefined;
      await user.save();
      res.status(400).json({ message: 'OTP has expired. Please request a new one.' });
      return;
    }

    const isOtpValid = await bcrypt.compare(otp, user.passwordChangeOTP);

    if (!isOtpValid) {
      res.status(400).json({ message: 'Invalid OTP. Please try again.' });
      return;
    }

    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordChangeOTP = undefined;
    user.passwordChangeOTPExpires = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error) {
    next(error);
  }
};

export const getAllUsers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { role, page = 1, limit = 10, search } = req.query;
    const query: any = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(query)
      .select('-password')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        users,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getWorkers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      search,
      minRate,
      maxRate,
      minRating,
    } = req.query as Record<string, string>;

    const query: any = { role: 'worker' };

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { bio: { $regex: search, $options: 'i' } },
        { qualifications: { $elemMatch: { $regex: search, $options: 'i' } } },
      ];
    }

    if (minRate || maxRate) {
      query.hourlyRate = {};
      if (minRate) {
        query.hourlyRate.$gte = Number(minRate);
      }
      if (maxRate) {
        query.hourlyRate.$lte = Number(maxRate);
      }
    }

    if (minRating) {
      query.rating = { $gte: Number(minRating) };
    }

    const workers = await User.find(query)
      .select('-password')
      .limit(Number(limit) * 1)
      .skip((Number(page) - 1) * Number(limit))
      .sort({ rating: -1, createdAt: -1 });

    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        workers,
        totalPages: Math.ceil(total / Number(limit)),
        currentPage: Number(page),
        total,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({ message: 'User id is required' });
      return;
    }

    const user = await User.findById(id).select(
      '-password -emailVerificationToken -passwordResetToken -passwordResetExpires'
    );

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

