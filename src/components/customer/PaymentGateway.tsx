import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { IndianRupee, CreditCard, Smartphone, Building2, Wallet, Banknote, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import type { Booking } from '../../types';

interface PaymentGatewayProps {
  booking: Booking;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: any;
  enabled: boolean;
}

export function PaymentGateway({ booking, isOpen, onClose, onSuccess }: PaymentGatewayProps) {
  const [selectedMethod, setSelectedMethod] = useState<string>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods();
    }
  }, [isOpen]);

  const fetchPaymentMethods = async () => {
    // In production, fetch from API
    const methods: PaymentMethod[] = [
      { id: 'upi', name: 'UPI', icon: Smartphone, enabled: true },
      { id: 'card', name: 'Credit/Debit Card', icon: CreditCard, enabled: true },
      { id: 'netbanking', name: 'Net Banking', icon: Building2, enabled: true },
      { id: 'wallet', name: 'Wallet', icon: Wallet, enabled: true },
      { id: 'cash', name: 'Cash on Completion', icon: Banknote, enabled: true },
    ];
    setPaymentMethods(methods);
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      const token = localStorage.getItem('auth_token');

      // Create payment order
      const orderResponse = await fetch('/api/customer/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId: booking.id,
          amount: booking.fare?.totalFare || 0,
          method: selectedMethod,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Handle cash payment
      if (selectedMethod === 'cash') {
        toast.success('Booking confirmed! Pay cash to driver on completion');
        onSuccess();
        onClose();
        return;
      }

      // For online payments, integrate with Razorpay
      await processOnlinePayment(orderData);
    } catch (error: any) {
      console.error('Payment error:', error);
      toast.error(error.message || 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const processOnlinePayment = async (orderData: any) => {
    return new Promise((resolve, reject) => {
      // Check if Razorpay is loaded
      if (typeof window.Razorpay === 'undefined') {
        // Demo mode - simulate successful payment
        setTimeout(async () => {
          try {
            await verifyPayment(orderData.orderId, 'demo_payment_id', 'demo_signature');
            resolve(true);
          } catch (error) {
            reject(error);
          }
        }, 2000);
        return;
      }

      // Production Razorpay integration
      const options = {
        key: orderData.keyId,
        amount: orderData.amount,
        currency: orderData.currency,
        name: "UR's Chauffeur",
        description: `Booking #${booking.id.slice(0, 8)}`,
        order_id: orderData.orderId,
        handler: async function (response: any) {
          try {
            await verifyPayment(
              response.razorpay_order_id,
              response.razorpay_payment_id,
              response.razorpay_signature
            );
            resolve(true);
          } catch (error) {
            reject(error);
          }
        },
        prefill: {
          name: booking.customerId,
          contact: '',
          email: '',
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: function () {
            reject(new Error('Payment cancelled'));
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    });
  };

  const verifyPayment = async (orderId: string, paymentId: string, signature: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/customer/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          orderId,
          paymentId,
          signature,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment verification failed');
      }

      toast.success('Payment successful!');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Verify payment error:', error);
      throw error;
    }
  };

  const getMethodIcon = (method: PaymentMethod) => {
    const Icon = method.icon;
    return <Icon className="h-5 w-5" />;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Payment</DialogTitle>
          <DialogDescription>
            Choose your preferred payment method
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Fare Summary */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Base Fare</span>
                <span>₹{booking.fare?.baseFare.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Distance Charge</span>
                <span>₹{booking.fare?.distanceCharge.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Time Charge</span>
                <span>₹{booking.fare?.timeCharge.toFixed(2)}</span>
              </div>
              {booking.fare?.tollCharges > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Toll Charges</span>
                  <span>₹{booking.fare.tollCharges.toFixed(2)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">GST (5%)</span>
                <span>₹{booking.fare?.gst.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between border-t pt-2 font-semibold">
                <span>Total Amount</span>
                <div className="flex items-center gap-1 text-lg">
                  <IndianRupee className="h-4 w-4" />
                  {booking.fare?.totalFare.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Select Payment Method</Label>
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className={`flex items-center space-x-3 rounded-lg border p-4 ${
                    selectedMethod === method.id ? 'border-primary bg-primary/5' : ''
                  } ${!method.enabled ? 'opacity-50' : 'cursor-pointer hover:border-primary/50'}`}
                  onClick={() => method.enabled && setSelectedMethod(method.id)}
                >
                  <RadioGroupItem value={method.id} id={method.id} disabled={!method.enabled} />
                  <Label
                    htmlFor={method.id}
                    className="flex flex-1 cursor-pointer items-center gap-3"
                  >
                    {getMethodIcon(method)}
                    <span className="font-medium">{method.name}</span>
                  </Label>
                  {selectedMethod === method.id && (
                    <CheckCircle className="h-5 w-5 text-primary" />
                  )}
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Info Alert */}
          {selectedMethod === 'cash' && (
            <Alert>
              <AlertDescription>
                You can pay cash to the driver after trip completion. Booking will be confirmed.
              </AlertDescription>
            </Alert>
          )}

          {/* Payment Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePayment}
            disabled={isProcessing || !selectedMethod}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <IndianRupee className="mr-2 h-5 w-5" />
                Pay ₹{booking.fare?.totalFare.toFixed(2)}
              </>
            )}
          </Button>

          {/* Secure Payment Info */}
          <p className="text-center text-xs text-muted-foreground">
            🔒 Secure payment powered by Razorpay
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Declare Razorpay type for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}
