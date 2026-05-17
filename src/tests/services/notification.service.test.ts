import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotificationService } from '../../services/notification.service';

describe('NotificationService', () => {
  let notificationService: NotificationService;

  beforeEach(() => {
    notificationService = new NotificationService();
    vi.clearAllMocks();
    // Mock console.log to avoid cluttering test output
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('sendSMS', () => {
    it('should send SMS successfully in demo mode', async () => {
      const result = await notificationService.sendSMS(
        '9876543210',
        'Test message'
      );

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('📱 SMS to 9876543210')
      );
    });

    it('should handle SMS send errors gracefully', async () => {
      // Mock console.error
      vi.spyOn(console, 'error').mockImplementation(() => {});

      // This should still return true in demo mode
      const result = await notificationService.sendSMS('', '');
      expect(result).toBe(true);
    });
  });

  describe('sendOTP', () => {
    it('should send OTP with correct format', async () => {
      const mobile = '9876543210';
      const otp = '123456';

      const result = await notificationService.sendOTP(mobile, otp);

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining(otp)
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("UR's Chauffeur")
      );
    });
  });

  describe('sendBookingConfirmation', () => {
    it('should send booking confirmation for on-demand booking', async () => {
      const result = await notificationService.sendBookingConfirmation(
        '9876543210',
        'booking-123',
        'Connaught Place, Delhi'
      );

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('booking-1')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Connaught Place')
      );
    });

    it('should include scheduled time when provided', async () => {
      const scheduledTime = new Date('2026-05-20T10:00:00');

      const result = await notificationService.sendBookingConfirmation(
        '9876543210',
        'booking-123',
        'Connaught Place, Delhi',
        scheduledTime
      );

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('scheduled for')
      );
    });
  });

  describe('sendDriverAssigned', () => {
    it('should send driver assignment notification', async () => {
      const result = await notificationService.sendDriverAssigned(
        '9876543210',
        'John Doe',
        '9876543211',
        'Honda City - DL01AB1234'
      );

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('John Doe')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Honda City')
      );
    });
  });

  describe('sendSOSAlert', () => {
    it('should send SOS alert with location', async () => {
      const location = {
        latitude: 28.6139,
        longitude: 77.2090,
      };

      const result = await notificationService.sendSOSAlert(
        '9876543210',
        'Jane Doe',
        location,
        'booking-123'
      );

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🚨 EMERGENCY ALERT')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Jane Doe')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('maps.google.com')
      );
    });

    it('should include Google Maps link in SOS alert', async () => {
      const location = {
        latitude: 28.6139,
        longitude: 77.2090,
      };

      const consoleSpy = vi.spyOn(console, 'log');

      await notificationService.sendSOSAlert(
        '9876543210',
        'Jane Doe',
        location,
        'booking-123'
      );

      const calls = consoleSpy.mock.calls;
      const sosCall = calls.find((call) =>
        call[0].includes('EMERGENCY ALERT')
      );

      expect(sosCall).toBeDefined();
      expect(sosCall![0]).toContain('28.6139,77.2090');
    });
  });

  describe('sendTripCompleted', () => {
    it('should send trip completion with fare details', async () => {
      const result = await notificationService.sendTripCompleted(
        '9876543210',
        250.5,
        15.3
      );

      expect(result).toBe(true);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Trip completed')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('15.3km')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('₹250.50')
      );
    });
  });

  describe('sendBulkNotifications', () => {
    it('should send multiple notifications', async () => {
      const notifications = [
        { mobile: '9876543210', message: 'Message 1' },
        { mobile: '9876543211', message: 'Message 2' },
        { mobile: '9876543212', message: 'Message 3' },
      ];

      const result = await notificationService.sendBulkNotifications(
        notifications
      );

      expect(result.success).toBe(3);
      expect(result.failed).toBe(0);
    });

    it('should handle empty notification list', async () => {
      const result = await notificationService.sendBulkNotifications([]);

      expect(result.success).toBe(0);
      expect(result.failed).toBe(0);
    });
  });

  describe('getNotificationTypes', () => {
    it('should return all notification types', () => {
      const types = notificationService.getNotificationTypes();

      expect(types).toHaveLength(5);
      expect(types.map((t) => t.id)).toContain('booking_updates');
      expect(types.map((t) => t.id)).toContain('driver_updates');
      expect(types.map((t) => t.id)).toContain('payment_updates');
      expect(types.map((t) => t.id)).toContain('promotional');
      expect(types.map((t) => t.id)).toContain('safety_alerts');
    });

    it('should have correct channels for each type', () => {
      const types = notificationService.getNotificationTypes();

      const safetyAlerts = types.find((t) => t.id === 'safety_alerts');
      expect(safetyAlerts?.channels).toContain('push');
      expect(safetyAlerts?.channels).toContain('sms');

      const promotional = types.find((t) => t.id === 'promotional');
      expect(promotional?.channels).toContain('push');
      expect(promotional?.channels).toContain('email');
    });
  });

  describe('notifyBookingStatusChange', () => {
    it('should send notification for status change', async () => {
      await notificationService.notifyBookingStatusChange(
        'user-123',
        '9876543210',
        'booking-123',
        'pending',
        'assigned'
      );

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🔔 Push to user-123')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('📱 SMS to 9876543210')
      );
    });

    it('should send SMS only for important status changes', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      consoleSpy.mockClear();

      await notificationService.notifyBookingStatusChange(
        'user-123',
        '9876543210',
        'booking-123',
        'pending',
        'searching'
      );

      const smsCalls = consoleSpy.mock.calls.filter((call) =>
        call[0].includes('📱 SMS')
      );

      // Should not send SMS for non-important status
      expect(smsCalls.length).toBe(0);
    });
  });
});
