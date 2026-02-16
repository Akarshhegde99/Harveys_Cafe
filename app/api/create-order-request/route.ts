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
    const orderData: any = {
      id: orderId, // Re-adding manual ID to fix not-null constraint
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
    // 1. Decrement stock for each item using real-time stock levels
    try {
      console.log('Stock management: Processing items for order request...');
      for (const item of items) {
        // Find the item in menu_items by ID if available, otherwise by name
        let query = supabase.from('menu_items').select('id, available_count');

        if (item.menu_item_id && !item.menu_item_id.startsWith('static')) {
          query = query.eq('id', item.menu_item_id);
        } else {
          query = query.ilike('name', item.name.trim());
        }

        const { data: menuItem, error: fetchError } = await query.single();

        if (menuItem && !fetchError) {
          const newCount = Math.max(0, (menuItem.available_count || 0) - (item.quantity || 1));

          const { error: updateError } = await supabase
            .from('menu_items')
            .update({
              available_count: newCount,
              stock: newCount
            })
            .eq('id', menuItem.id);

          if (updateError) {
            console.error(`Failed to update stock for ${item.name}:`, updateError);
          } else {
            console.log(`Successfully updated stock for ${item.name}: ${menuItem.available_count} -> ${newCount}`);
          }
        } else {
          console.warn(`Could not find database record for "${item.name}" (ID: ${item.menu_item_id}) to update stock.`);
        }
      }
    } catch (stockError) {
      console.error('Error during stock management phase:', stockError);
    }

    // 2. Store in Supabase
    const { data, error } = await supabase
      .from('invoices')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error('SUPABASE INSERT ERROR:', error);
      return NextResponse.json({
        error: 'Failed to store order',
        details: error.message,
        code: error.code
      }, { status: 500 });
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
