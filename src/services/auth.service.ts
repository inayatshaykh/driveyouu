import jwt from 'jsonwebtoken';
import { db, users, otps } from '../db';
import { eq, and, gt } from 'drizzle-orm';
import type { User } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 3;

export class AuthService {
  /**
   * Generate a 6-digit OTP
   */
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP to mobile number via MSG91
   */
  async sendOTP(mobile: string): Promise<{ otpId: string; message: string }> {
    // Validate mobile number format
    const mobileRegex = /^[6-9]\d{9}$/;
    if (!mobileRegex.test(mobile)) {
      throw new Error('Invalid mobile number format');
    }

    // Generate OTP
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    // Store OTP in database
    const [otpRecord] = await db
      .insert(otps)
      .values({
        mobile: `+91${mobile}`,
        otp,
        expiresAt,
        verified: false,
        attempts: 0,
      })
      .returning();

    // Send OTP via MSG91 (implement actual SMS sending)
    await this.sendSMS(mobile, otp);

    return {
      otpId: otpRecord.id,
      message: 'OTP sent successfully',
    };
  }

  /**
   * Send SMS via MSG91
   */
  private async sendSMS(mobile: string, otp: string): Promise<void> {
    const MSG91_API_KEY = process.env.MSG91_API_KEY;
    const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'URSCHR';

    if (!MSG91_API_KEY) {
      console.warn('MSG91_API_KEY not configured. OTP:', otp);
      return;
    }

    try {
      const response = await fetch('https://api.msg91.com/api/v5/otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'authkey': MSG91_API_KEY,
        },
        body: JSON.stringify({
          sender: MSG91_SENDER_ID,
          mobile: `91${mobile}`,
          otp,
          template_id: 'your-template-id', // Configure in MSG91 dashboard
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send OTP via MSG91');
      }
    } catch (error) {
      console.error('SMS sending error:', error);
      throw new Error('Failed to send OTP');
    }
  }

  /**
   * Verify OTP and authenticate user
   */
  async verifyOTP(
    otpId: string,
    otpCode: string
  ): Promise<{ token: string; user: User }> {
    // Find OTP record
    const [otpRecord] = await db
      .select()
      .from(otps)
      .where(eq(otps.id, otpId))
      .limit(1);

    if (!otpRecord) {
      throw new Error('Invalid OTP ID');
    }

    // Check if OTP is already verified
    if (otpRecord.verified) {
      throw new Error('OTP already used');
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expiresAt) {
      throw new Error('OTP expired');
    }

    // Check max attempts
    if (otpRecord.attempts >= MAX_OTP_ATTEMPTS) {
      throw new Error('Maximum OTP attempts exceeded');
    }

    // Verify OTP
    if (otpRecord.otp !== otpCode) {
      // Increment attempts
      await db
        .update(otps)
        .set({ attempts: otpRecord.attempts + 1 })
        .where(eq(otps.id, otpId));

      throw new Error('Invalid OTP');
    }

    // Mark OTP as verified
    await db.update(otps).set({ verified: true }).where(eq(otps.id, otpId));

    // Find or create user
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.mobile, otpRecord.mobile))
      .limit(1);

    if (!user) {
      // Create new user (default role: customer)
      [user] = await db
        .insert(users)
        .values({
          mobile: otpRecord.mobile,
          role: 'customer',
          name: '', // Will be updated in profile
        })
        .returning();
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        mobile: user.mobile,
        role: user.role,
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return {
      token,
      user: {
        id: user.id,
        mobile: user.mobile,
        role: user.role as any,
        name: user.name,
        email: user.email || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  /**
   * Validate JWT token
   */
  async validateToken(token: string): Promise<User> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as {
        userId: string;
        mobile: string;
        role: string;
      };

      // Fetch user from database
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, decoded.userId))
        .limit(1);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        id: user.id,
        mobile: user.mobile,
        role: user.role as any,
        name: user.name,
        email: user.email || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  /**
   * Extract user from authorization header
   */
  async getUserFromHeader(authHeader?: string): Promise<User> {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new Error('No authorization token provided');
    }

    const token = authHeader.substring(7);
    return this.validateToken(token);
  }
}

export const authService = new AuthService();
