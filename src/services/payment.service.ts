import { db, payments, bookings } from '../db';
import { eq } from 'drizzle-orm';

// Razorpay configuration
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';

export class PaymentService {
  /**
   * Create Razorpay order
   */
  async createOrder(bookingId: string, amount: number): Promise<{
    orderId: string;
    amount: number;
    currency: string;
    keyId: string;
  }> {
    try {
      // In production, use Razorpay SDK
      // For now, create a demo order
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create payment record
      await db.insert(payments).values({
        bookingId,
        method: 'razorpay',
        status: 'pending',
        amount: amount.toString(),
        transactionId: orderId,
      });

      return {
        orderId,
        amount: Math.round(amount * 100), // Convert to paise
        currency: 'INR',
        keyId: RAZORPAY_KEY_ID || 'rzp_test_demo',
      };
    } catch (error) {
      console.error('Create order error:', error);
      throw new Error('Failed to create payment order');
    }
  }

  /**
   * Verify Razorpay payment signature
   */
  async verifyPayment(
    orderId: string,
    paymentId: string,
    signature: string
  ): Promise<boolean> {
    try {
      // In production, verify signature using Razorpay SDK
      // For demo, accept all payments
      
      // const crypto = require('crypto');
      // const expectedSignature = crypto
      //   .createHmac('sha256', RAZORPAY_KEY_SECRET)
      //   .update(`${orderId}|${paymentId}`)
      //   .digest('hex');
      
      // return expectedSignature === signature;
      
      return true; // Demo mode
    } catch (error) {
      console.error('Verify payment error:', error);
      return false;
    }
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentId: string,
    status: 'success' | 'failed',
    gatewayResponse?: any
  ): Promise<void> {
    try {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.transactionId, orderId))
        .limit(1);

      if (!payment) {
        throw new Error('Payment not found');
      }

      await db
        .update(payments)
        .set({
          status: status === 'success' ? 'completed' : 'failed',
          transactionId: paymentId,
          gatewayResponse: gatewayResponse || null,
          paidAt: status === 'success' ? new Date() : null,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      // If payment successful, update booking status
      if (status === 'success') {
        await db
          .update(bookings)
          .set({
            status: 'confirmed',
            updatedAt: new Date(),
          })
          .where(eq(bookings.id, payment.bookingId));
      }
    } catch (error) {
      console.error('Update payment status error:', error);
      throw new Error('Failed to update payment status');
    }
  }

  /**
   * Get payment details
   */
  async getPaymentDetails(bookingId: string): Promise<any> {
    try {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.bookingId, bookingId))
        .limit(1);

      if (!payment) {
        return null;
      }

      return {
        id: payment.id,
        bookingId: payment.bookingId,
        method: payment.method,
        status: payment.status,
        amount: Number(payment.amount),
        transactionId: payment.transactionId,
        paidAt: payment.paidAt,
        createdAt: payment.createdAt,
      };
    } catch (error) {
      console.error('Get payment details error:', error);
      throw new Error('Failed to get payment details');
    }
  }

  /**
   * Process refund
   */
  async processRefund(
    bookingId: string,
    amount: number,
    reason: string
  ): Promise<void> {
    try {
      const [payment] = await db
        .select()
        .from(payments)
        .where(eq(payments.bookingId, bookingId))
        .limit(1);

      if (!payment) {
        throw new Error('Payment not found');
      }

      if (payment.status !== 'completed') {
        throw new Error('Cannot refund incomplete payment');
      }

      // In production, use Razorpay refund API
      // For demo, just update status
      await db
        .update(payments)
        .set({
          status: 'refunded',
          gatewayResponse: { refund_reason: reason, refund_amount: amount },
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));
    } catch (error) {
      console.error('Process refund error:', error);
      throw new Error('Failed to process refund');
    }
  }

  /**
   * Get payment methods
   */
  getPaymentMethods(): Array<{
    id: string;
    name: string;
    icon: string;
    enabled: boolean;
  }> {
    return [
      { id: 'upi', name: 'UPI', icon: '📱', enabled: true },
      { id: 'card', name: 'Credit/Debit Card', icon: '💳', enabled: true },
      { id: 'netbanking', name: 'Net Banking', icon: '🏦', enabled: true },
      { id: 'wallet', name: 'Wallet', icon: '👛', enabled: true },
      { id: 'cash', name: 'Cash', icon: '💵', enabled: true },
    ];
  }
}

export const paymentService = new PaymentService();
