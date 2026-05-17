// Notification service for SMS and Push notifications

const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY || '';
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID || 'URSCHR';

export class NotificationService {
  /**
   * Send SMS via MSG91
   */
  async sendSMS(mobile: string, message: string): Promise<boolean> {
    try {
      // In production, use MSG91 API
      // For demo, just log the message
      console.log(`📱 SMS to ${mobile}: ${message}`);
      
      // Production implementation:
      // const response = await fetch('https://api.msg91.com/api/v5/flow/', {
      //   method: 'POST',
      //   headers: {
      //     'authkey': MSG91_AUTH_KEY,
      //     'content-type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     sender: MSG91_SENDER_ID,
      //     mobile: mobile,
      //     message: message
      //   })
      // });
      
      return true;
    } catch (error) {
      console.error('SMS send error:', error);
      return false;
    }
  }

  /**
   * Send OTP SMS
   */
  async sendOTP(mobile: string, otp: string): Promise<boolean> {
    const message = `Your UR's Chauffeur OTP is: ${otp}. Valid for 5 minutes. Do not share with anyone.`;
    return this.sendSMS(mobile, message);
  }

  /**
   * Send booking confirmation SMS
   */
  async sendBookingConfirmation(
    mobile: string,
    bookingId: string,
    pickupAddress: string,
    scheduledTime?: Date
  ): Promise<boolean> {
    const timeStr = scheduledTime 
      ? `scheduled for ${scheduledTime.toLocaleString('en-IN')}`
      : 'on-demand';
    
    const message = `Booking confirmed! ID: ${bookingId.slice(0, 8)}. Pickup: ${pickupAddress}. ${timeStr}. Track your ride in the app.`;
    return this.sendSMS(mobile, message);
  }

  /**
   * Send driver assigned notification
   */
  async sendDriverAssigned(
    mobile: string,
    driverName: string,
    driverMobile: string,
    vehicleDetails: string
  ): Promise<boolean> {
    const message = `Driver assigned! ${driverName} (${driverMobile}) will pick you up. Vehicle: ${vehicleDetails}. Track in app.`;
    return this.sendSMS(mobile, message);
  }

  /**
   * Send driver arriving notification
   */
  async sendDriverArriving(mobile: string, eta: string): Promise<boolean> {
    const message = `Your driver is arriving in ${eta}. Please be ready at the pickup location.`;
    return this.sendSMS(mobile, message);
  }

  /**
   * Send trip started notification
   */
  async sendTripStarted(mobile: string, destination: string): Promise<boolean> {
    const message = `Trip started! Heading to ${destination}. Share your live location with family for safety.`;
    return this.sendSMS(mobile, message);
  }

  /**
   * Send trip completed notification
   */
  async sendTripCompleted(
    mobile: string,
    fare: number,
    distance: number
  ): Promise<boolean> {
    const message = `Trip completed! Distance: ${distance.toFixed(1)}km. Fare: ₹${fare.toFixed(2)}. Thank you for choosing UR's Chauffeur!`;
    return this.sendSMS(mobile, message);
  }

  /**
   * Send SOS alert to emergency contacts
   */
  async sendSOSAlert(
    mobile: string,
    customerName: string,
    location: { latitude: number; longitude: number },
    bookingId: string
  ): Promise<boolean> {
    const mapsLink = `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
    const message = `🚨 EMERGENCY ALERT! ${customerName} has triggered SOS. Location: ${mapsLink}. Booking: ${bookingId.slice(0, 8)}. Please check immediately!`;
    return this.sendSMS(mobile, message);
  }

  /**
   * Send payment receipt SMS
   */
  async sendPaymentReceipt(
    mobile: string,
    bookingId: string,
    amount: number,
    paymentMethod: string
  ): Promise<boolean> {
    const message = `Payment received! ₹${amount.toFixed(2)} via ${paymentMethod}. Booking: ${bookingId.slice(0, 8)}. Receipt sent to your email.`;
    return this.sendSMS(mobile, message);
  }

  /**
   * Send driver new ride notification
   */
  async sendNewRideRequest(
    mobile: string,
    pickupAddress: string,
    distance: number,
    fare: number
  ): Promise<boolean> {
    const message = `New ride request! Pickup: ${pickupAddress}. Distance: ${distance.toFixed(1)}km. Earnings: ₹${(fare * 0.8).toFixed(2)}. Accept in app now!`;
    return this.sendSMS(mobile, message);
  }

  /**
   * Send push notification (Web Push API)
   */
  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: any
  ): Promise<boolean> {
    try {
      // In production, use Web Push API or Firebase Cloud Messaging
      console.log(`🔔 Push to ${userId}: ${title} - ${body}`);
      
      // Store notification in database for in-app display
      // await this.storeNotification(userId, title, body, data);
      
      return true;
    } catch (error) {
      console.error('Push notification error:', error);
      return false;
    }
  }

  /**
   * Send booking status update notification
   */
  async notifyBookingStatusChange(
    userId: string,
    mobile: string,
    bookingId: string,
    oldStatus: string,
    newStatus: string
  ): Promise<void> {
    const statusMessages: Record<string, string> = {
      'pending': 'Booking created, searching for driver...',
      'assigned': 'Driver assigned! Check app for details.',
      'driver_en_route': 'Driver is on the way to pickup location.',
      'in_progress': 'Trip started! Have a safe journey.',
      'completed': 'Trip completed! Thank you for riding with us.',
      'cancelled': 'Booking cancelled. Refund will be processed if applicable.',
    };

    const message = statusMessages[newStatus] || `Booking status: ${newStatus}`;
    
    // Send push notification
    await this.sendPushNotification(
      userId,
      'Booking Update',
      message,
      { bookingId, status: newStatus }
    );

    // Send SMS for important status changes
    if (['assigned', 'driver_en_route', 'completed', 'cancelled'].includes(newStatus)) {
      await this.sendSMS(mobile, `Booking ${bookingId.slice(0, 8)}: ${message}`);
    }
  }

  /**
   * Batch send notifications
   */
  async sendBulkNotifications(
    notifications: Array<{
      mobile: string;
      message: string;
    }>
  ): Promise<{ success: number; failed: number }> {
    let success = 0;
    let failed = 0;

    for (const notification of notifications) {
      const result = await this.sendSMS(notification.mobile, notification.message);
      if (result) {
        success++;
      } else {
        failed++;
      }
    }

    return { success, failed };
  }

  /**
   * Get notification preferences
   */
  getNotificationTypes(): Array<{
    id: string;
    name: string;
    description: string;
    channels: string[];
  }> {
    return [
      {
        id: 'booking_updates',
        name: 'Booking Updates',
        description: 'Notifications about your booking status',
        channels: ['push', 'sms'],
      },
      {
        id: 'driver_updates',
        name: 'Driver Updates',
        description: 'Driver assignment and arrival notifications',
        channels: ['push', 'sms'],
      },
      {
        id: 'payment_updates',
        name: 'Payment Updates',
        description: 'Payment confirmations and receipts',
        channels: ['push', 'sms', 'email'],
      },
      {
        id: 'promotional',
        name: 'Promotional Offers',
        description: 'Special offers and discounts',
        channels: ['push', 'email'],
      },
      {
        id: 'safety_alerts',
        name: 'Safety Alerts',
        description: 'SOS and emergency notifications',
        channels: ['push', 'sms'],
      },
    ];
  }
}

export const notificationService = new NotificationService();
