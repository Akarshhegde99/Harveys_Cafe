"use client";
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Calendar, CreditCard, MapPin, Phone, Mail, FileText } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Invoice } from '@/types/invoice';
import ProtectedRoute from '@/components/ProtectedRoute';
import { supabase } from '@/lib/supabase';

const InvoiceDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchInvoice(params.id as string);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);

  const fetchInvoice = async (invoiceId: string) => {
    try {
      setIsLoading(true);
      console.log('Fetching invoice from Supabase:', invoiceId);

      const { data: invoiceData, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) {
        console.error('Error fetching invoice from Supabase:', error);
        router.push('/invoices');
        return;
      }

      if (invoiceData) {
        console.log('Fetched invoice from Supabase:', invoiceData);

        // Convert snake_case to camelCase for frontend
        const convertedInvoice = {
          id: invoiceData.id,
          invoiceNumber: invoiceData.invoice_number,
          orderId: invoiceData.order_id,
          paymentId: invoiceData.payment_id,
          userId: invoiceData.user_id,
          userDetails: invoiceData.user_details,
          items: invoiceData.items,
          subtotal: invoiceData.subtotal,
          advanceAmount: invoiceData.advance_amount,
          remainingAmount: invoiceData.remaining_amount,
          totalAmount: invoiceData.total_amount,
          visitTime: invoiceData.visit_time,
          status: invoiceData.status,
          paymentStatus: invoiceData.payment_status,
          createdAt: invoiceData.created_at,
          updatedAt: invoiceData.updated_at,
          restaurantDetails: invoiceData.restaurant_details
        };

        setInvoice(convertedInvoice);
      } else {
        router.push('/invoices');
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      router.push('/invoices');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'advance_paid': return 'bg-yellow-100 text-yellow-800';
      case 'fully_paid': return 'bg-green-100 text-green-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-4 border-[#eb3e04] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 print:bg-white">
        <div className="container mx-auto px-4 py-8 print:px-0 print:py-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8 print:hidden"
          >
            <Link href="/invoices" className="inline-flex items-center text-[#eb3e04] hover:text-red-600 transition-colors mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Invoices
            </Link>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <FileText className="w-8 h-8 text-[#eb3e04]" />
                <h1 className="text-4xl font-grimpt font-bold text-gray-800">Invoice Details</h1>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handlePrint}
                className="flex items-center gap-2 bg-[#eb3e04] text-white px-6 py-3 rounded-xl font-grimpt font-bold hover:bg-red-600 transition-colors"
              >
                <Download className="w-5 h-5" />
                Print/Save
              </motion.button>
            </div>
          </motion.div>

          {/* Invoice Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-lg p-8 print:shadow-none print:rounded-none"
          >
            {/* Restaurant Header */}
            <div className="text-center mb-8 border-b pb-6">
              <h1 className="text-3xl font-grimpt font-bold text-[#eb3e04] mb-2">
                {invoice.restaurantDetails.name}
              </h1>
              <div className="space-y-1 text-gray-600 font-garet">
                <p className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {invoice.restaurantDetails.address}
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" />
                  {invoice.restaurantDetails.phone}
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" />
                  {invoice.restaurantDetails.email}
                </p>
                {invoice.restaurantDetails.gst && (
                  <p className="text-sm">GST: {invoice.restaurantDetails.gst}</p>
                )}
              </div>
            </div>

            {/* Invoice Info and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-grimpt font-bold text-gray-800 mb-4">Invoice Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 font-garet">Invoice Number</p>
                    <p className="font-grimpt font-bold text-lg">{invoice.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-garet">Invoice Date</p>
                    <p className="font-garet">{formatDate(invoice.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-garet">Order ID</p>
                    <p className="font-garet text-sm break-all">{invoice.orderId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-garet">Payment ID</p>
                    <p className="font-garet text-sm break-all">{invoice.paymentId}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-grimpt font-bold text-gray-800 mb-4">Status & Schedule</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 font-garet mb-2">Order Status</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(invoice.status)}`}>
                      {invoice.status.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-garet mb-2">Payment Status</p>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${getPaymentStatusColor(invoice.paymentStatus)}`}>
                      {invoice.paymentStatus.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-garet">Scheduled Visit</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <p className="font-garet">{formatDate(invoice.visitTime)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Details */}
            <div className="mb-8 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-grimpt font-bold text-gray-800 mb-4">Bill To:</h3>
              <div className="space-y-2">
                <p className="font-garet font-semibold text-lg">{invoice.userDetails.name}</p>
                <p className="text-gray-600 font-garet flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {invoice.userDetails.email}
                </p>
                <p className="text-gray-600 font-garet flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {invoice.userDetails.phone}
                </p>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-lg font-grimpt font-bold text-gray-800 mb-4">Order Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-3 text-left font-grimpt font-bold">Item</th>
                      <th className="border border-gray-300 p-3 text-center font-grimpt font-bold">Qty</th>
                      <th className="border border-gray-300 p-3 text-right font-grimpt font-bold">Unit Price</th>
                      <th className="border border-gray-300 p-3 text-right font-grimpt font-bold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border border-gray-300 p-3">
                          <div>
                            <p className="font-garet font-semibold">{item.name}</p>
                            {item.selectedSize && (
                              <p className="text-sm text-gray-600 font-garet">Size: {item.selectedSize}</p>
                            )}
                            {item.description && (
                              <p className="text-sm text-gray-600 font-garet">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="border border-gray-300 p-3 text-center font-garet">{item.quantity}</td>
                        <td className="border border-gray-300 p-3 text-right font-garet">{item.price}</td>
                        <td className="border border-gray-300 p-3 text-right font-garet font-semibold">
                          ₹{(parseFloat(item.price.replace('₹', '')) * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-6">
              <div className="max-w-md ml-auto space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-garet text-lg">Subtotal:</span>
                  <span className="font-garet text-lg">₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-green-600">
                  <span className="font-garet text-lg flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Advance Paid:
                  </span>
                  <span className="font-garet text-lg font-semibold">₹{invoice.advanceAmount.toFixed(2)}</span>
                </div>
                {invoice.remainingAmount > 0 && (
                  <div className="flex justify-between items-center text-orange-600">
                    <span className="font-garet text-lg">Remaining Amount:</span>
                    <span className="font-garet text-lg font-semibold">₹{invoice.remainingAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xl font-bold border-t pt-3">
                  <span className="font-grimpt">Total Amount:</span>
                  <span className="font-grimpt">₹{invoice.totalAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Payment Notice */}
            {invoice.remainingAmount > 0 && (
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-grimpt font-bold text-yellow-800 mb-2">Payment Notice</h4>
                <p className="text-yellow-700 font-garet">
                  Please pay the remaining amount of ₹{invoice.remainingAmount.toFixed(2)} at the restaurant when you collect your order.
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t text-center text-gray-500 text-sm font-garet">
              <p>Thank you for choosing {invoice.restaurantDetails.name}!</p>
              <p className="mt-1">This is a computer-generated invoice and does not require a signature.</p>
            </div>
          </motion.div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default InvoiceDetailPage;
