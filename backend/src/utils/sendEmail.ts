import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER ||'samitdhiman0001@gmail.com' ,
    pass: process.env.EMAIL_PASS || 'Kftefqfujabvmjjr',
  },
});

export const sendEmail = async (to: string, subject: string, html: string): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@careservice.com',
      to,
      subject,
      html,
    });
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendVerificationEmail = async (email: string, token: string): Promise<void> => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
  const html = `
    <h2>Verify Your Email</h2>
    <p>Please click the link below to verify your email address:</p>
    <a href="${verificationUrl}">Verify Email</a>
    <p>If you didn't create an account, please ignore this email.</p>
  `;
  await sendEmail(email, 'Verify Your Email', html);
};

export const sendPasswordResetEmail = async (email: string, token: string): Promise<void> => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const html = `
    <h2>Reset Your Password</h2>
    <p>Please click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>This link will expire in 1 hour.</p>
    <p>If you didn't request a password reset, please ignore this email.</p>
  `;
  await sendEmail(email, 'Reset Your Password', html);
};

