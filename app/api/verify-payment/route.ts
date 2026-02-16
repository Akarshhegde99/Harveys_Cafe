import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderId, paymentId, signature, visitTime, items, userDetails } = await request.json()

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing payment verification data' },
        { status: 400 }
      )
    }

    // Verify the payment signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${orderId}|${paymentId}`)
      .digest('hex')

    if (expectedSignature !== signature) {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }

    // Calculate amounts
    const subtotal = items.reduce((total: number, item: any) => {
      const price = parseFloat(item.price.replace('₹', ''))
      return total + (price * item.quantity)
    }, 0)

    const advanceAmount = subtotal * 0.5 // 50% advance
    const remainingAmount = subtotal - advanceAmount

    // Create order data
    const orderData = {
      orderId,
      paymentId,
      visitTime,
      items,
      userdetails: userDetails,
      status: 'pending',
      advancePaid: true,
      subtotal,
      advanceAmount,
      remainingAmount,
      createdAt: new Date().toISOString(),
    }

    // Generate invoice data
    const generateInvoiceNumber = (): string => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      return `INV-${year}${month}${day}-${random}`;
    };

    const invoiceData = {
      id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      invoice_number: generateInvoiceNumber(),
      order_id: orderId,
      payment_id: paymentId,
      user_id: userDetails.email, // Using email as user identifier
      user_details: userDetails,
      items: items.map((item: any) => ({
        id: item.id || `${item.name}-${Date.now()}`,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        category: item.category,
        image: item.image,
        description: item.description,
        selectedSize: item.selectedSize,
        type: item.type
      })),
      subtotal,
      advance_amount: advanceAmount,
      remaining_amount: remainingAmount,
      total_amount: subtotal,
      visit_time: visitTime,
      status: 'pending' as const,
      payment_status: 'advance_paid' as const,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      restaurant_details: {
        name: "Harvey's Cafe",
        address: "123 Main Street, City, State 12345",
        phone: "+91 9876543210",
        email: "contact@harveyscafe.com",
        gst: "GST123456789"
      }
    };

    // Save invoice to database
    // 1. Decrement stock for each item FIRST
    try {
      console.log('Stock management: Processing items...');
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
          console.warn(`Could not find database record for "${item.name}" to update stock.`);
        }
      }
    } catch (stockError) {
      console.error('Error during stock management phase:', stockError);
    }

    // 2. Save invoice to Supabase
    try {
      const { error: invoiceError } = await supabase
        .from('invoices')
        .insert([invoiceData]);

      if (invoiceError) {
        console.error('Error saving invoice to database:', invoiceError);
      }
    } catch (error) {
      console.error('Error in invoice storage phase:', error);
    }



    // Save order to database
    try {
      const { error: orderError } = await supabase
        .from('orders')
        .insert([orderData]);

      if (orderError) {
        console.error('Error saving order to database:', orderError);
      }
    } catch (error) {
      console.error('Error saving order:', error);
    }

    console.log('Order confirmed:', orderData)
    console.log('Invoice generated:', invoiceData)

    return NextResponse.json({
      success: true,
      orderId,
      paymentId,
      invoiceId: invoiceData.id,
      invoiceNumber: invoiceData.invoice_number,
      message: 'Payment verified successfully',
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    )
  }
}
