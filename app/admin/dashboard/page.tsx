'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  LogOut, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Phone, 
  Mail, 
  Calendar,
  Package,
  IndianRupee,
  Filter,
  Search,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders'

interface Order {
  id: string
  invoiceNumber: string
  orderId: string
  paymentId: string
  userId: string
  userDetails: {
    name: string
    email: string
    phone: string
  }
  items: Array<{
    id: string
    name: string
    price: string
    quantity: number
    category: string
    selectedSize?: string
  }>
  subtotal: number
  advanceAmount: number
  remainingAmount: number
  totalAmount: number
  visitTime: string
  status: 'pending' | 'approved' | 'confirmed' | 'completed' | 'cancelled'
  paymentStatus: 'pending' | 'advance_paid' | 'fully_paid' | 'refunded'
  createdAt: string
  updatedAt: string
}

function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const router = useRouter()
  
  // Real-time order notifications
  const { orders: realtimeOrders, isListening, testNotification } = useRealtimeOrders()

  useEffect(() => {
    console.log('Admin dashboard useEffect running')
    // Check admin authentication
    const adminToken = localStorage.getItem('adminToken')
    console.log('Admin token found:', !!adminToken)
    if (!adminToken) {
      console.log('No admin token, redirecting to login')
      router.push('/admin/login')
      return
    }

    console.log('Loading orders...')
    // Load orders from localStorage (in a real app, this would be from your backend)
    loadOrders()
  }, [router])

  useEffect(() => {
    // Filter orders based on search term and status
    let filtered = orders

    if (searchTerm) {
      filtered = filtered.filter(order => 
        order.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userDetails.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.userDetails.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    setFilteredOrders(filtered)
  }, [orders, searchTerm, statusFilter])

  const loadOrders = async () => {
    try {
      console.log('Loading orders from Supabase...')
      
      // Fetch all orders from Supabase
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching orders from Supabase:', error)
        toast.error('Failed to load orders')
        setOrders([])
        setLoading(false)
        return
      }

      console.log('Admin dashboard - Raw invoices from Supabase:', invoices)
      console.log('Admin dashboard - Number of invoices:', invoices?.length || 0)
      
      // Convert invoices to orders format
      const ordersData = (invoices || []).map((invoice: any) => ({
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
        status: invoice.status || 'pending',
        paymentStatus: invoice.payment_status || 'pending',
        createdAt: invoice.created_at,
        updatedAt: invoice.updated_at,
        restaurantDetails: invoice.restaurant_details
      }))
      
      console.log('Admin dashboard - Processed orders data:', ordersData)
      setOrders(ordersData)
      setLoading(false)
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
      setOrders([])
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('adminToken')
    localStorage.removeItem('adminEmail')
    toast.success('Logged out successfully')
    router.push('/admin/login')
  }

  const updateOrderStatus = async (orderId: string, newStatus: 'approved' | 'cancelled') => {
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status: newStatus, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', orderId)

      if (error) {
        console.error('Error updating order in Supabase:', error)
        toast.error('Failed to update order status')
        return
      }

      // Update in local state
      const updatedOrders = orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order
      )
      setOrders(updatedOrders)

      const statusText = newStatus === 'approved' ? 'approved' : 'rejected'
      toast.success(`Order ${statusText} successfully`)
      
      setSelectedOrder(null)
    } catch (error) {
      console.error('Error updating order status:', error)
      toast.error('Failed to update order status')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'approved': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'confirmed': return 'bg-green-100 text-green-800 border-green-200'
      case 'completed': return 'bg-green-100 text-green-800 border-green-200'
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'approved': return <CheckCircle className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <XCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#eb3e04] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-garet">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Image
                src="/logo.svg"
                alt="Harvey's Logo"
                width={40}
                height={40}
                className="mr-3"
              />
              <div>
                <h1 className="text-xl font-grimpt font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-500 font-garet">Harvey's Cafe Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Real-time Status Indicator */}
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-sm font-garet text-gray-600">
                  {isListening ? 'Live Notifications' : 'Offline'}
                </span>
              </div>

              {/* Test Notification Button */}
              <button
                onClick={testNotification}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-garet text-sm"
              >
                Test Vibration
              </button>

              <button
                onClick={() => {
                  console.log('Manual refresh clicked')
                  setLoading(true)
                  loadOrders()
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#eb3e04] text-white rounded-lg hover:bg-red-600 transition-colors font-garet"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Orders
              </button>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 transition-colors font-garet"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
          <h3 className="font-bold text-yellow-800 mb-2">Debug Info:</h3>
          <p className="text-sm text-yellow-700">
            Orders loaded from Supabase: {orders.length} | 
            Filtered: {filteredOrders.length}
          </p>
          <button
            onClick={async () => {
              try {
                // Create a test order
                const testOrder = {
                  id: `TEST_${Date.now()}`,
                  invoiceNumber: `TEST_INV_${Date.now()}`,
                  orderId: `TEST_ORD_${Date.now()}`,
                  paymentId: '',
                  userId: 'test@example.com',
                  userDetails: {
                    name: 'Test User',
                    email: 'test@example.com',
                    phone: '1234567890'
                  },
                  items: [{
                    id: 'test-item',
                    name: 'Test Food',
                    price: '₹0',
                    quantity: 1,
                    category: 'Test',
                    image: '/menuimages/cheese-pizza.png',
                    description: 'Test item'
                  }],
                  subtotal: 0,
                  advanceAmount: 0,
                  remainingAmount: 0,
                  totalAmount: 0,
                  visitTime: new Date().toISOString(),
                  status: 'pending',
                  paymentStatus: 'pending',
                  createdAt: new Date().toISOString(),
                  updatedAt: new Date().toISOString(),
                  restaurantDetails: {
                    name: "Harvey's Cafe",
                    address: "123 Main Street, City, State 12345",
                    phone: "+91 9876543210",
                    email: "info@harveyscafe.com",
                    gst: "29ABCDE1234F1Z5"
                  }
                }
                
                // Store in Supabase
                const { error } = await supabase
                  .from('invoices')
                  .insert([testOrder])

                if (error) {
                  console.error('Error creating test order:', error)
                  toast.error('Failed to create test order')
                  return
                }

                console.log('Test order created and stored in Supabase')
                toast.success('Test order created!')
                loadOrders()
              } catch (error) {
                console.error('Error creating test order:', error)
                toast.error('Failed to create test order')
              }
            }}
            className="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
          >
            Create Test Order
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <motion.div 
            className="bg-white rounded-lg shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-garet text-gray-600">Pending Orders</p>
                <p className="text-2xl font-grimpt font-bold text-gray-900">
                  {orders.filter(o => o.status === 'pending').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-garet text-gray-600">Approved</p>
                <p className="text-2xl font-grimpt font-bold text-gray-900">
                  {orders.filter(o => o.status === 'approved').length}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-garet text-gray-600">Total Orders</p>
                <p className="text-2xl font-grimpt font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            className="bg-white rounded-lg shadow p-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-center">
              <div className="p-2 bg-[#eb3e04]/10 rounded-lg">
                <IndianRupee className="w-6 h-6 text-[#eb3e04]" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-garet text-gray-600">Total Revenue</p>
                <p className="text-2xl font-grimpt font-bold text-gray-900">
                  ₹{orders.reduce((sum, order) => sum + order.advanceAmount, 0).toFixed(0)}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div 
          className="bg-white rounded-lg shadow p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by invoice, name, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#eb3e04] focus:border-transparent font-garet"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#eb3e04] focus:border-transparent font-garet"
              >
                <option value="all">All Orders</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <motion.div 
          className="bg-white rounded-lg shadow overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-grimpt font-bold text-gray-900">Recent Orders</h2>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-garet">No orders found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredOrders.map((order, index) => (
                <motion.div
                  key={order.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  whileHover={{ x: 5 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="font-grimpt font-bold text-gray-900">{order.invoiceNumber}</h3>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.toUpperCase()}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold border ${
                          order.paymentStatus === 'pending' 
                            ? 'bg-gray-100 text-gray-800 border-gray-200' 
                            : 'bg-green-100 text-green-800 border-green-200'
                        }`}>
                          {order.paymentStatus === 'pending' ? 'PENDING PAYMENT' : 'PAID'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 font-garet">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          <span>{order.userDetails.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(order.visitTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <IndianRupee className="w-4 h-4" />
                          <span>₹{order.totalAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                    {order.status === 'pending' && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateOrderStatus(order.id, 'approved')
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateOrderStatus(order.id, 'cancelled')
                          }}
                          className="px-3 py-1 bg-red-600 text-white text-sm font-bold rounded hover:bg-red-700 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-grimpt font-bold text-gray-900">Order Details</h2>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="text-gray-500 hover:text-gray-700 text-2xl"
                  >
                    ×
                  </button>
                </div>

                {/* Customer Info */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-grimpt font-bold text-lg mb-3">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="font-garet">{selectedOrder.userDetails.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-gray-600" />
                      <span className="font-garet">{selectedOrder.userDetails.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-gray-600" />
                      <span className="font-garet">{selectedOrder.userDetails.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <span className="font-garet">{formatDate(selectedOrder.visitTime)}</span>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mb-6">
                  <h3 className="font-grimpt font-bold text-lg mb-3">Order Items</h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-garet font-semibold">{item.name}</p>
                          <p className="text-sm text-gray-600 font-garet">
                            Qty: {item.quantity} × {item.price}
                            {item.selectedSize && ` (${item.selectedSize})`}
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

                {/* Payment Summary */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="font-garet">Subtotal:</span>
                    <span className="font-garet">₹{selectedOrder.subtotal.toFixed(2)}</span>
                  </div>
                  <div className={`flex justify-between ${selectedOrder.paymentStatus === 'pending' ? 'text-gray-600' : 'text-green-600'}`}>
                    <span className="font-garet">
                      {selectedOrder.paymentStatus === 'pending' ? 'Advance Required:' : 'Advance Paid:'}
                    </span>
                    <span className="font-garet">₹{selectedOrder.advanceAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-orange-600">
                    <span className="font-garet">Remaining:</span>
                    <span className="font-garet">₹{selectedOrder.remainingAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold border-t pt-2">
                    <span className="font-grimpt">Total:</span>
                    <span className="font-grimpt">₹{selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                {selectedOrder.status === 'pending' && (
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'approved')}
                      className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-grimpt font-bold hover:bg-green-700 transition-colors"
                    >
                      Approve Order
                    </button>
                    <button
                      onClick={() => updateOrderStatus(selectedOrder.id, 'cancelled')}
                      className="flex-1 bg-red-600 text-white py-3 px-4 rounded-lg font-grimpt font-bold hover:bg-red-700 transition-colors"
                    >
                      Reject Order
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboard />
    </ProtectedRoute>
  )
}
