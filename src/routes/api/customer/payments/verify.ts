import { json } from '@tanstack/start';
import type { APIEvent } from '@tanstack/start';
import { paymentService } from '../../../../services/payment.service';
import { verifyToken } from '../../../../services/auth.service';

export async function POST({ request }: APIEvent) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const payload = await verifyToken(token);

    if (!payload || payload.role !== 'customer') {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { orderId, paymentId, signature } = body;

    if (!orderId || !paymentId || !signature) {
      return json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify payment signature
    const isValid = await paymentService.verifyPayment(orderId, paymentId, signature);

    if (!isValid) {
      await paymentService.updatePaymentStatus(orderId, paymentId, 'failed');
      return json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    // Update payment status to success
    await paymentService.updatePaymentStatus(orderId, paymentId, 'success', {
      razorpay_order_id: orderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    });

    return json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return json({ error: error.message || 'Failed to verify payment' }, { status: 500 });
  }
}
