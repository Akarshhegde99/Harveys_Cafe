import Razorpay from 'razorpay';

// Razorpay configuration
export const razorpayConfig = {
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
};

// Load Razorpay script dynamically
export const loadRazorpay = (): Promise<any> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      resolve((window as any).Razorpay);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve((window as any).Razorpay);
    };
    script.onerror = () => {
      console.error('Failed to load Razorpay script');
      resolve(null);
    };
    document.body.appendChild(script);
  });
};

// Initialize Razorpay instance
export const razorpay = new Razorpay({
  key_id: razorpayConfig.key_id,
  key_secret: razorpayConfig.key_secret,
});

// Razorpay options for frontend
export const getRazorpayOptions = (amount: number, orderId: string, userDetails: any) => ({
  key: razorpayConfig.key_id,
  amount: amount * 100, // Convert to paise
  currency: 'INR',
  name: "Harvey's Cafe",
  description: 'Advance Payment for Pre-Order',
  order_id: orderId,
  prefill: {
    name: userDetails.name,
    email: userDetails.email,
    contact: userDetails.phone,
  },
  theme: {
    color: '#eb3e04',
  },
  handler: function (response: any) {
    console.log('Payment successful:', response);
    return response;
  },
  modal: {
    ondismiss: function() {
      console.log('Payment modal dismissed');
    }
  }
});
