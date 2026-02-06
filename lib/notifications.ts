// Notification utilities for admin order alerts

export class OrderNotifications {
  private static instance: OrderNotifications;
  private isVibrationSupported: boolean = false;

  constructor() {
    // Check if vibration is supported
    this.isVibrationSupported = 'vibrate' in navigator;
  }

  static getInstance(): OrderNotifications {
    if (!OrderNotifications.instance) {
      OrderNotifications.instance = new OrderNotifications();
    }
    return OrderNotifications.instance;
  }

  // Vibrate phone like a call (3 seconds pattern)
  vibrateForNewOrder(): void {
    if (!this.isVibrationSupported) {
      console.log('Vibration not supported on this device');
      return;
    }

    try {
      // Vibration pattern: [vibrate, pause, vibrate, pause, ...]
      // Pattern for 3 seconds: strong vibrations like a phone call
      const callPattern = [
        500, 200, 500, 200, 500, 200, // First burst
        300, 100, 300, 100, 300, 100, // Second burst
        500, 200, 500, 200, 500       // Final burst
      ];

      navigator.vibrate(callPattern);
      console.log('📳 Admin phone vibrating for new order!');
    } catch (error) {
      console.error('Error triggering vibration:', error);
    }
  }

  // Request notification permission
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      console.log('Notifications denied by user');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Show browser notification
  showNotification(title: string, body: string, icon?: string): void {
    if (Notification.permission !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        body,
        icon: icon || '/logo.svg',
        badge: '/logo.svg',
        tag: 'new-order',
        requireInteraction: true, // Keep notification until user interacts
        vibrate: [200, 100, 200], // Additional vibration
      });

      // Auto close after 10 seconds
      setTimeout(() => {
        notification.close();
      }, 10000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  // Combined notification (vibration + browser notification)
  notifyNewOrder(orderDetails: { customerName: string; items: number; total: number }): void {
    console.log('🔔 New order received! Notifying admin...');
    
    // Vibrate phone
    this.vibrateForNewOrder();

    // Show browser notification
    this.showNotification(
      '🍕 New Order Received!',
      `Order from ${orderDetails.customerName} - ${orderDetails.items} items - ₹${orderDetails.total}`,
      '/logo.svg'
    );

    // Play notification sound (optional)
    this.playNotificationSound();
  }

  // Play notification sound
  private playNotificationSound(): void {
    try {
      // Create audio context for notification sound
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Create a simple beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // High pitch beep
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2); // Short beep
      
      // Second beep
      setTimeout(() => {
        const oscillator2 = audioContext.createOscillator();
        const gainNode2 = audioContext.createGain();
        
        oscillator2.connect(gainNode2);
        gainNode2.connect(audioContext.destination);
        
        oscillator2.frequency.setValueAtTime(1000, audioContext.currentTime);
        gainNode2.gain.setValueAtTime(0.3, audioContext.currentTime);
        
        oscillator2.start();
        oscillator2.stop(audioContext.currentTime + 0.2);
      }, 300);
      
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  // Check if device is mobile
  isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  // Initialize notifications for admin
  async initializeAdminNotifications(): Promise<boolean> {
    console.log('🔧 Initializing admin notifications...');
    
    if (!this.isMobileDevice()) {
      console.log('📱 Not a mobile device - vibration may not work');
    }

    // Request notification permission
    const hasPermission = await this.requestNotificationPermission();
    
    if (hasPermission) {
      console.log('✅ Notification permissions granted');
    } else {
      console.log('❌ Notification permissions denied');
    }

    return hasPermission;
  }
}

