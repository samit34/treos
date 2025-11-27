import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin';
import User from '../models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

const seedAdmin = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/care-service';
    await mongoose.connect(mongoURI);
    console.log('MongoDB Connected Successfully');

    const adminEmail = 'samitdhiman0001@gmail.com';
    const adminPassword = 'Admin@123'; // Default password for testing

    // Create/Update Admin in Admin collection
    const adminData = {
      email: adminEmail,
      firstName: 'Samit',
      lastName: 'Admin',
      phone: '+1234567890',
      isSuperAdmin: true,
      permissions: ['all'],
    };

    const admin = await Admin.findOneAndUpdate(
      { email: adminEmail },
      adminData,
      { upsert: true, new: true }
    );

    console.log('Admin document created/updated in Admin collection:', admin.email);

    // Create/Update User with admin role for authentication
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    const userData = {
      email: adminEmail,
      firstName: 'Samit',
      lastName: 'Admin',
      password: hashedPassword,
      role: 'admin' as const,
      phone: '+1234567890',
      isEmailVerified: true,
      onboardingCompleted: true,
      isBlocked: false,
    };

    const user = await User.findOneAndUpdate(
      { email: adminEmail },
      userData,
      { upsert: true, new: true }
    );

    console.log('Admin user created/updated in User collection:', user.email);
    console.log('Default password:', adminPassword);
    console.log('You can now login with email:', adminEmail, 'and password:', adminPassword);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();

