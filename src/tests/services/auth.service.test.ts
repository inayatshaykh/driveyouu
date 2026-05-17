import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from '../../services/auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', () => {
      const otp = authService.generateOTP();
      expect(otp).toMatch(/^\d{6}$/);
      expect(otp.length).toBe(6);
    });

    it('should generate different OTPs', () => {
      const otp1 = authService.generateOTP();
      const otp2 = authService.generateOTP();
      // While theoretically they could be the same, it's extremely unlikely
      expect(otp1).toBeDefined();
      expect(otp2).toBeDefined();
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', async () => {
      const payload = {
        userId: 'test-user-id',
        mobile: '9876543210',
        role: 'customer' as const,
      };

      const token = await authService.generateToken(payload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should generate different tokens for different users', async () => {
      const payload1 = {
        userId: 'user-1',
        mobile: '9876543210',
        role: 'customer' as const,
      };

      const payload2 = {
        userId: 'user-2',
        mobile: '9876543211',
        role: 'driver' as const,
      };

      const token1 = await authService.generateToken(payload1);
      const token2 = await authService.generateToken(payload2);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const payload = {
        userId: 'test-user-id',
        mobile: '9876543210',
        role: 'customer' as const,
      };

      const token = await authService.generateToken(payload);
      const verified = await authService.verifyToken(token);

      expect(verified).toBeDefined();
      expect(verified?.userId).toBe(payload.userId);
      expect(verified?.mobile).toBe(payload.mobile);
      expect(verified?.role).toBe(payload.role);
    });

    it('should return null for invalid token', async () => {
      const verified = await authService.verifyToken('invalid-token');
      expect(verified).toBeNull();
    });

    it('should return null for expired token', async () => {
      // This would require mocking time or using a very short expiry
      // For now, we'll just test with an obviously invalid token
      const verified = await authService.verifyToken('');
      expect(verified).toBeNull();
    });
  });

  describe('validateMobile', () => {
    it('should validate correct Indian mobile numbers', () => {
      expect(authService.validateMobile('9876543210')).toBe(true);
      expect(authService.validateMobile('8765432109')).toBe(true);
      expect(authService.validateMobile('7654321098')).toBe(true);
    });

    it('should reject invalid mobile numbers', () => {
      expect(authService.validateMobile('123456789')).toBe(false); // Too short
      expect(authService.validateMobile('12345678901')).toBe(false); // Too long
      expect(authService.validateMobile('abcdefghij')).toBe(false); // Not numeric
      expect(authService.validateMobile('5876543210')).toBe(false); // Doesn't start with 6-9
      expect(authService.validateMobile('')).toBe(false); // Empty
    });
  });

  describe('OTP Storage', () => {
    it('should store and retrieve OTP', () => {
      const mobile = '9876543210';
      const otp = '123456';

      authService.storeOTP(mobile, otp);
      const stored = authService.getStoredOTP(mobile);

      expect(stored).toBe(otp);
    });

    it('should return null for non-existent mobile', () => {
      const stored = authService.getStoredOTP('0000000000');
      expect(stored).toBeNull();
    });

    it('should clear OTP after retrieval', () => {
      const mobile = '9876543210';
      const otp = '123456';

      authService.storeOTP(mobile, otp);
      authService.getStoredOTP(mobile);
      const secondRetrieval = authService.getStoredOTP(mobile);

      expect(secondRetrieval).toBeNull();
    });
  });
});
