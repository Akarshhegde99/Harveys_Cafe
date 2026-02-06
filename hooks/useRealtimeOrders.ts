'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { OrderNotifications } from '@/lib/notifications';

interface Order {
  id: string;
  invoice_number: string;
  user_details: {
    name: string;
    email: string;
    phone: string;
  };
  items: any[];
  total_amount: number;
  status: string;
  created_at: string;
}

export function useRealtimeOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  useEffect(() => {
    let subscription: any = null;
    const notifications = OrderNotifications.getInstance();

    const startRealtimeSubscription = async () => {
      try {
        console.log('🔄 Starting real-time order subscription...');
        
        // Initialize notifications
        await notifications.initializeAdminNotifications();

        // Get initial order count
        const { data: initialOrders, error: initialError } = await supabase
          .from('invoices')
          .select('*')
          .order('created_at', { ascending: false });

        if (!initialError && initialOrders) {
          setOrders(initialOrders);
          setLastOrderCount(initialOrders.length);
          console.log(`📊 Initial order count: ${initialOrders.length}`);
        }

        // Subscribe to real-time changes
        subscription = supabase
          .channel('orders-channel')
          .on(
            'postgres_changes',
            {
              event: 'INSERT',
              schema: 'public',
              table: 'invoices'
            },
            (payload) => {
              console.log('🆕 New order detected:', payload);
              
              const newOrder = payload.new as Order;
              
              // Update orders list
              setOrders(prevOrders => [newOrder, ...prevOrders]);
              
              // Trigger notification for new order
              if (newOrder.status === 'pending') {
                const orderDetails = {
                  customerName: newOrder.user_details.name,
                  items: newOrder.items.length,
                  total: newOrder.total_amount
                };

                console.log('📳 Triggering admin notification for new order...');
                notifications.notifyNewOrder(orderDetails);
              }
            }
          )
          .on(
            'postgres_changes',
            {
              event: 'UPDATE',
              schema: 'public',
              table: 'invoices'
            },
            (payload) => {
              console.log('📝 Order updated:', payload);
              
              const updatedOrder = payload.new as Order;
              
              // Update orders list
              setOrders(prevOrders => 
                prevOrders.map(order => 
                  order.id === updatedOrder.id ? updatedOrder : order
                )
              );
            }
          )
          .subscribe((status) => {
            console.log('📡 Subscription status:', status);
            setIsListening(status === 'SUBSCRIBED');
          });

      } catch (error) {
        console.error('❌ Error setting up real-time subscription:', error);
      }
    };

    startRealtimeSubscription();

    // Cleanup subscription on unmount
    return () => {
      if (subscription) {
        console.log('🔌 Cleaning up real-time subscription...');
        supabase.removeChannel(subscription);
      }
    };
  }, []);

  // Manual trigger for testing
  const testNotification = () => {
    const notifications = OrderNotifications.getInstance();
    notifications.notifyNewOrder({
      customerName: 'Test Customer',
      items: 2,
      total: 150
    });
  };

  return {
    orders,
    isListening,
    testNotification
  };
}

