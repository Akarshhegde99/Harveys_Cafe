import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('API received request body:', body);
    const { 
      items, 
      userDetails, 
      visitTime, 
      subtotal, 
      advanceAmount, 
      remainingAmount, 
      totalAmount 
    } = body;

    // Generate order ID and invoice number
    const orderId = `ORD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const invoiceNumber = `INV_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Create order request (without payment)
    const orderData = {
      id: orderId,
      invoice_number: invoiceNumber,
      order_id: orderId,
      payment_id: '', // No payment ID yet
      user_id: userDetails.email, // Using email as user ID for now
      user_details: userDetails,
      items,
      subtotal,
      advance_amount: advanceAmount,
      remaining_amount: remainingAmount,
      total_amount: totalAmount,
      visit_time: visitTime,
      status: 'pending',
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      restaurant_details: {
        name: "Harvey's Cafe",
        address: "123 Main Street, City, State 12345",
        phone: "+91 9876543210",
        email: "info@harveyscafe.com",
        gst: "29ABCDE1234F1Z5"
      }
    };

    // Store in Supabase
    const { data, error } = await supabase
      .from('invoices')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error('Error storing order in Supabase:', error);
      return NextResponse.json({ error: 'Failed to store order' }, { status: 500 });
    }

    console.log('Order stored in Supabase:', data);
    
    // Convert snake_case to camelCase for frontend
    const convertedOrder = {
      id: data.id,
      invoiceNumber: data.invoice_number,
      orderId: data.order_id,
      paymentId: data.payment_id,
      userId: data.user_id,
      userDetails: data.user_details,
      items: data.items,
      subtotal: data.subtotal,
      advanceAmount: data.advance_amount,
      remainingAmount: data.remaining_amount,
      totalAmount: data.total_amount,
      visitTime: data.visit_time,
      status: data.status,
      paymentStatus: data.payment_status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      restaurantDetails: data.restaurant_details
    };
    
    return NextResponse.json({ 
      success: true, 
      order: convertedOrder,
      message: 'Order request created successfully. Waiting for admin approval.' 
    });

  } catch (error) {
    console.error('Error in create-order-request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
