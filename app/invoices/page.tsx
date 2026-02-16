"use client";
import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Calendar, CreditCard, Eye, Download, ArrowLeft, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Invoice } from '@/types/invoice';
import ProtectedRoute from '@/components/ProtectedRoute';
import { loadRazorpay } from '@/lib/razorpay';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { Skeleton, ListSkeleton } from '@/components/Skeleton';


const InvoicesPage = () => {
  const { user, userDetails } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hasFetchedRef = React.useRef<string | null>(null);

  useEffect(() => {
    const email = userDetails?.email;
    if (user && email && hasFetchedRef.current !== email) {
      hasFetchedRef.current = email;
      fetchInvoices();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetails?.email]);

  const fetchInvoices = async () => {
    if (userDetails?.email) {
      try {
        setIsLoading(true);
        console.log('Fetching invoices from Supabase for user:', userDetails.email);
        console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
        console.log('Supabase Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

        // Check if Supabase is properly configured
        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
          console.error('Supabase environment variables not configured');
          toast.error('Database not configured. Please check environment variables.');
          setInvoices([]);
          return;
        }

        // Fetch from Supabase directly instead of using context
        const { data: invoices, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', userDetails.email)
          .order('created_at', { ascending: false });

        console.log('Supabase response - data:', invoices);
        console.log('Supabase response - error:', error);

        if (error) {
          console.error('Error fetching invoices from Supabase:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));

          // Check if it's a table doesn't exist error
          if (error.message?.includes('relation "invoices" does not exist')) {
            toast.error('Database table not found. Please create the invoices table in Supabase.');
          } else {
            toast.error(`Failed to load invoices: ${error.message || 'Unknown error'}`);
          }
          setInvoices([]);
          return;
        }

        console.log('Fetched invoices from Supabase:', invoices);

        // Convert snake_case to camelCase for frontend
        const convertedInvoices = (invoices || []).map((invoice: any) => ({
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          orderId: invoice.order_id,
          paymentId: invoice.payment_id,
          userId: invoice.user_id,
          userDetails: invoice.user_details,
          items: invoice.items,
          subtotal: invoice.subtotal,
          advanceAmount: invoice.advance_amount,
          remainingAmount: invoice.remaining_amount,
          totalAmount: invoice.total_amount,
          visitTime: invoice.visit_time,
          status: invoice.status,
          paymentStatus: invoice.payment_status,
          createdAt: invoice.created_at,
          updatedAt: invoice.updated_at,
          restaurantDetails: invoice.restaurant_details
        }));

        setInvoices(convertedInvoices);
      } catch (error) {
        console.error('Error fetching invoices:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        toast.error('Failed to load invoices. Please check your internet connection.');
        setInvoices([]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const processPayment = async (invoice: Invoice) => {
    try {
      // Load Razorpay script
      const Razorpay = await loadRazorpay();

      // Create order on backend
      const orderResponse = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: invoice.advanceAmount,
          currency: 'INR',
          items: invoice.items,
          visitTime: invoice.visitTime,
          userDetails: invoice.userDetails,
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok) {
        throw new Error(orderData.error || 'Failed to create payment order');
      }

      // Configure Razorpay options
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_1234567890',
        amount: invoice.advanceAmount * 100, // Convert to paise
        currency: 'INR',
        name: "Harvey's Cafe",
        description: `Payment for Order ${invoice.invoiceNumber}`,
        order_id: orderData.orderId,
        prefill: {
          name: invoice.userDetails.name,
          email: invoice.userDetails.email,
          contact: invoice.userDetails.phone,
        },
        theme: {
          color: '#eb3e04',
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                visitTime: invoice.visitTime,
                items: invoice.items,
                userDetails: invoice.userDetails,
              }),
            });

            if (verifyResponse.ok) {
              const result = await verifyResponse.json();
              toast.success(`Payment successful! Invoice #${result.invoiceNumber} generated.`);

              // Update invoice status in Supabase
              const { error: updateError } = await supabase
                .from('invoices')
                .update({
                  status: 'confirmed',
                  payment_status: 'advance_paid',
                  updated_at: new Date().toISOString()
                })
                .eq('id', invoice.id);

              if (updateError) {
                console.error('Error updating invoice in Supabase:', updateError);
                toast.error('Payment successful but failed to update order status');
                return;
              }

              // Update local state
              const updatedInvoices = invoices.map(inv =>
                inv.id === invoice.id
                  ? { ...inv, status: 'confirmed' as const, paymentStatus: 'advance_paid' as const }
                  : inv
              );
              setInvoices(updatedInvoices);

            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            toast.error('Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            toast.error('Payment cancelled');
          },
        },
      };

      // Open Razorpay payment modal
      const razorpay = new Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Failed to process payment. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'approved': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'confirmed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'completed': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'advance_paid': return 'bg-yellow-100 text-yellow-800';
      case 'fully_paid': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Skeleton className="h-4 w-32 mb-4 bg-gray-200" />
            <Skeleton className="h-10 w-64 mb-2 bg-gray-200" />
            <Skeleton className="h-4 w-48 bg-gray-200" />
          </div>
          <ListSkeleton />
        </div>
      </div>
    );
  }


  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Link href="/menu" className="inline-flex items-center text-[#eb3e04] hover:text-red-600 transition-colors mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Menu
            </Link>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-[#eb3e04]" />
                <h1 className="text-4xl font-grimpt font-bold text-gray-800">My Invoices</h1>
              </div>
              <button
                onClick={fetchInvoices}
                className="flex items-center gap-2 px-4 py-2 bg-[#eb3e04] text-white rounded-lg hover:bg-red-600 transition-colors font-garet"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Orders
              </button>
            </div>
            <p className="text-gray-600 font-garet">View and manage your order invoices</p>
          </motion.div>

          {invoices.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl shadow-lg p-12 text-center"
            >
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-grimpt font-bold text-gray-800 mb-2">No Invoices Found</h2>
              <p className="text-gray-600 font-garet mb-6">You haven&apos;t made any orders yet.</p>
              <Link
                href="/menu"
                className="inline-flex items-center bg-[#eb3e04] text-white px-6 py-3 rounded-xl font-grimpt font-bold hover:bg-red-600 transition-colors"
              >
                Browse Menu
              </Link>
            </motion.div>
          ) : (
            <div className="grid gap-6">
              {invoices.map((invoice, index) => (
                <motion.div
                  key={invoice.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-grimpt font-bold text-gray-800">
                          {invoice.invoiceNumber}
                        </h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(invoice.status)}`}>
                          {invoice.status.toUpperCase()}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                          {invoice.paymentStatus === 'pending' ? 'PENDING PAYMENT' : invoice.paymentStatus.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 font-garet">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(invoice.createdAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4" />
                          <span>₹{invoice.totalAmount.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Items: </span>
                          <span>{invoice.items.reduce((sum, item) => sum + item.quantity, 0)}</span>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="text-sm text-gray-600 font-garet">
                          <span className="font-semibold">Visit Time:</span> {formatDate(invoice.visitTime)}
                        </p>
                        <p className="text-sm text-gray-600 font-garet">
                          {invoice.paymentStatus === 'pending' ? (
                            <>
                              <span className="font-semibold">Advance Required:</span> ₹{invoice.advanceAmount.toFixed(2)}
                              {invoice.remainingAmount > 0 && (
                                <span className="ml-2">
                                  | <span className="font-semibold">Remaining:</span> ₹{invoice.remainingAmount.toFixed(2)}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <span className="font-semibold">Advance Paid:</span> ₹{invoice.advanceAmount.toFixed(2)}
                              {invoice.remainingAmount > 0 && (
                                <span className="ml-2">
                                  | <span className="font-semibold">Remaining:</span> ₹{invoice.remainingAmount.toFixed(2)}
                                </span>
                              )}
                            </>
                          )}
                        </p>
                        {invoice.status === 'pending' && (
                          <p className="text-sm text-gray-600 font-garet mt-1">
                            <span className="font-semibold">Status:</span> Waiting for restaurant approval
                          </p>
                        )}
                        {invoice.status === 'approved' && (
                          <p className="text-sm text-gray-600 font-garet mt-1">
                            <span className="font-semibold">Status:</span> Order approved! Please proceed to payment.
                          </p>
                        )}
                        {invoice.status === 'confirmed' && (
                          <p className="text-sm text-gray-600 font-garet mt-1">
                            <span className="font-semibold">Status:</span> Order confirmed! Please visit at scheduled time.
                          </p>
                        )}
                        {invoice.status === 'cancelled' && (
                          <p className="text-sm text-red-600 font-garet mt-1">
                            <span className="font-semibold">Status:</span> Order cancelled by restaurant
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/invoices/${invoice.id}`}>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="flex items-center gap-2 bg-[#eb3e04] text-white px-4 py-2 rounded-lg font-grimpt font-bold hover:bg-red-600 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </motion.button>
                      </Link>
                      {invoice.status === 'approved' && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => processPayment(invoice)}
                          className="flex items-center gap-2 bg-[#eb3e04] text-white px-4 py-2 rounded-lg font-grimpt font-bold hover:bg-[#d32f02] transition-colors"
                        >
                          <CreditCard className="w-4 h-4" />
                          Pay Now
                        </motion.button>
                      )}

                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSelectedInvoice(invoice)}
                        className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-lg font-grimpt font-bold hover:bg-gray-700 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        Quick View
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Invoice Detail Modal */}
        <AnimatePresence>
          {selectedInvoice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
              onClick={() => setSelectedInvoice(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-grimpt font-bold text-gray-800">Invoice Details</h2>
                    <button
                      onClick={() => setSelectedInvoice(null)}
                      className="text-gray-500 hover:text-gray-700 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  {/* Restaurant Details */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-grimpt font-bold text-lg text-[#eb3e04] mb-2">
                      {selectedInvoice.restaurantDetails.name}
                    </h3>
                    <p className="text-sm text-gray-600 font-garet">{selectedInvoice.restaurantDetails.address}</p>
                    <p className="text-sm text-gray-600 font-garet">Phone: {selectedInvoice.restaurantDetails.phone}</p>
                    <p className="text-sm text-gray-600 font-garet">Email: {selectedInvoice.restaurantDetails.email}</p>
                    {selectedInvoice.restaurantDetails.gst && (
                      <p className="text-sm text-gray-600 font-garet">GST: {selectedInvoice.restaurantDetails.gst}</p>
                    )}
                  </div>

                  {/* Invoice Info */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-500 font-garet">Invoice Number</p>
                      <p className="font-grimpt font-bold">{selectedInvoice.invoiceNumber}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-garet">Date</p>
                      <p className="font-garet">{formatDate(selectedInvoice.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-garet">Order ID</p>
                      <p className="font-garet text-sm">{selectedInvoice.orderId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 font-garet">Payment ID</p>
                      <p className="font-garet text-sm">{selectedInvoice.paymentId}</p>
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-grimpt font-bold text-lg mb-2">Bill To:</h3>
                    <p className="font-garet font-semibold">{selectedInvoice.userDetails.name}</p>
                    <p className="text-sm text-gray-600 font-garet">{selectedInvoice.userDetails.email}</p>
                    <p className="text-sm text-gray-600 font-garet">{selectedInvoice.userDetails.phone}</p>
                  </div>

                  {/* Items */}
                  <div className="mb-6">
                    <h3 className="font-grimpt font-bold text-lg mb-4">Items</h3>
                    <div className="space-y-3">
                      {selectedInvoice.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <p className="font-garet font-semibold">{item.name}</p>
                            <p className="text-sm text-gray-600 font-garet">
                              Qty: {item.quantity} × {item.price}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-garet font-semibold">
                              ₹{(parseFloat(item.price.replace('₹', '')) * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="font-garet">Subtotal:</span>
                      <span className="font-garet">₹{selectedInvoice.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span className="font-garet">Advance Paid:</span>
                      <span className="font-garet">₹{selectedInvoice.advanceAmount.toFixed(2)}</span>
                    </div>
                    {selectedInvoice.remainingAmount > 0 && (
                      <div className="flex justify-between text-orange-600">
                        <span className="font-garet">Remaining Amount:</span>
                        <span className="font-garet">₹{selectedInvoice.remainingAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span className="font-grimpt">Total Amount:</span>
                      <span className="font-grimpt">₹{selectedInvoice.totalAmount.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Visit Time */}
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800 font-garet">
                      <span className="font-semibold">Scheduled Visit:</span> {formatDate(selectedInvoice.visitTime)}
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
};

export default InvoicesPage;
