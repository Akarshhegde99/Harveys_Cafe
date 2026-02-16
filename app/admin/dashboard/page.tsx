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
import { menuItems as staticMenuItems } from '@/data/menu'

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

interface MenuItem {
  id: string;
  name: string;
  category: string;
  available_count: number;
  stock: number;
}

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [updatingStock, setUpdatingStock] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [isEditingModalOpen, setIsEditingModalOpen] = useState(false)
  const router = useRouter()

  // Real-time order notifications
  const { orders: realtimeOrders, isListening, testNotification } = useRealtimeOrders()

  useEffect(() => {
    loadData()

    // Auto-check for 12 AM reset while dashboard is open
    const resetInterval = setInterval(() => {
      checkDailyReset()
    }, 60000) // Check every minute

    return () => clearInterval(resetInterval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadOrders(), loadInventory()])
    checkDailyReset()
    setLoading(false)
  }

  const checkDailyReset = async () => {
    const today = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
    const lastReset = localStorage.getItem('lastInventoryReset');

    if (lastReset !== today) {
      try {
        console.log('New day detected. Resetting daily stock to 12...');
        const { error: updateError } = await supabase
          .from('menu_items')
          .update({
            available_count: 12,
            stock: 12
          })
          .neq('id', 'placeholder')

        if (updateError) {
          console.error('Supabase update error detail:', updateError);
          throw updateError;
        }

        localStorage.setItem('lastInventoryReset', today);
        toast.success('Daily stock has been reset to 12!');
        loadInventory();
      } catch (err: any) {
        console.error('Failed to reset daily stock:', err);
        // Fallback: log stringified error if it's an empty object
        if (typeof err === 'object' && Object.keys(err).length === 0) {
          console.error('Empty error object detected. Detail:', JSON.stringify(err));
        }
      }
    }
  }


  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('category', { ascending: true })

      if (error) throw error
      setMenuItems(data || [])
    } catch (error: any) {
      console.error('Error loading inventory:', error)
      toast.error('Failed to load inventory: ' + (error.message || 'Check database connection'))
    }

  }

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
      // Fetch all orders from Supabase
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

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

      setOrders(ordersData)
    } catch (error) {
      console.error('Error loading orders:', error)
      toast.error('Failed to load orders')
    }
  }

  const handleStockUpdate = async (itemId: string, newCount: number) => {
    try {
      setUpdatingStock(itemId)
      const { error } = await supabase
        .from('menu_items')
        .update({ available_count: newCount })
        .eq('id', itemId)

      if (error) throw error

      setMenuItems(prev => prev.map(item =>
        item.id === itemId ? { ...item, available_count: newCount } : item
      ))
      toast.success('Stock updated')
    } catch (error) {
      console.error('Error updating stock:', error)
      toast.error('Failed to update stock')
    } finally {
      setUpdatingStock(null)
    }
  }

  const handleImportMenu = async () => {
    try {
      setLoading(true)
      const itemsToInsert = staticMenuItems.map((item, index) => ({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        size: item.size || [],
        type: item.type || '',
        stock: 12,
        available_count: 12
      }))

      const { error } = await supabase
        .from('menu_items')
        .insert(itemsToInsert)

      if (error) throw error

      toast.success('Menu imported successfully!')
      loadInventory()
    } catch (error: any) {
      console.error('Error importing menu:', error)
      toast.error('Failed to import menu: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      setUpdatingStock(editingItem.id)
      const { error } = await supabase
        .from('menu_items')
        .update({
          name: editingItem.name,
          category: editingItem.category,
          price: (editingItem as any).price,
          description: (editingItem as any).description,
          available_count: editingItem.available_count
        })
        .eq('id', editingItem.id)

      if (error) throw error

      setMenuItems(prev => prev.map(item =>
        item.id === editingItem.id ? editingItem : item
      ))
      toast.success('Item updated successfully')
      setIsEditingModalOpen(false)
    } catch (error: any) {
      console.error('Error saving item:', error)
      toast.error('Failed to save item: ' + error.message)
    } finally {
      setUpdatingStock(null)
    }
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('menu_items')
        .insert([{
          name: editingItem.name,
          category: editingItem.category,
          price: (editingItem as any).price,
          description: (editingItem as any).description,
          available_count: editingItem.available_count || 12,
          stock: editingItem.available_count || 12,
          image: '/menuimages/vegroll.png' // Default image
        }])
        .select()

      if (error) throw error

      if (data) {
        setMenuItems(prev => [...prev, data[0]])
      }
      toast.success('New item added to menu!')
      setIsEditingModalOpen(false)
    } catch (error: any) {
      console.error('Error adding item:', error)
      toast.error('Failed to add item: ' + error.message)
    } finally {
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

      if (error) throw error

      setOrders(prev => prev.map(order =>
        order.id === orderId
          ? { ...order, status: newStatus, updatedAt: new Date().toISOString() }
          : order
      ))

      const statusText = newStatus === 'approved' ? 'approved' : 'rejected'

      // If cancelled, add back stock
      if (newStatus === 'cancelled') {
        const order = orders.find(o => o.id === orderId);
        if (order && order.items) {
          for (const item of order.items) {
            const { data: menuItem } = await supabase
              .from('menu_items')
              .select('id, available_count')
              .eq('name', item.name)
              .single();

            if (menuItem) {
              await supabase
                .from('menu_items')
                .update({ available_count: (menuItem.available_count || 0) + (item.quantity || 1) })
                .eq('id', menuItem.id);
            }
          }
          // Reload inventory to show updated stock
          loadInventory();
        }
      }

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 font-garet">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center">
              <Image src="/logo.svg" alt="Harvey's Logo" width={44} height={44} className="mr-4" />
              <div>
                <h1 className="text-2xl font-grimpt font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-500">Live Management System</p>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-200">
                <div className={`w-2.5 h-2.5 rounded-full ${isListening ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-xs font-semibold text-gray-600">{isListening ? 'LIVE' : 'OFFLINE'}</span>
              </div>

              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-[#eb3e04] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Orders
                </button>
                <button
                  onClick={() => setActiveTab('inventory')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'inventory' ? 'bg-[#eb3e04] text-white shadow-lg' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Inventory
                </button>
              </div>

              <button onClick={handleLogout} className="text-gray-500 hover:text-red-600 transition-colors p-2">
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'orders' ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {[
                { label: 'Pending', val: orders.filter(o => o.status === 'pending').length, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
                { label: 'Approved', val: orders.filter(o => o.status === 'approved').length, icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-100' },
                { label: 'Total Sales', val: orders.filter(o => o.status !== 'cancelled' && o.status !== 'pending').length, icon: Package, color: 'text-green-600', bg: 'bg-green-100' },
                { label: 'Revenue', val: `₹${orders.filter(o => ['approved', 'confirmed', 'completed'].includes(o.status)).reduce((sum, o) => sum + (o.advanceAmount || 0), 0).toFixed(0)}`, icon: IndianRupee, color: 'text-[#eb3e04]', bg: 'bg-orange-100' }
              ].map((stat, i) => (
                <motion.div key={i} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}>
                  <div className="flex items-center">
                    <div className={`p-3 ${stat.bg} rounded-xl`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm text-gray-500 font-semibold">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.val}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Orders Content */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition-all"
                  />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="flex-1 md:w-40 border border-gray-200 rounded-xl px-4 py-2.5 outline-none bg-white font-semibold"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <button onClick={loadOrders} className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all">
                    <RefreshCw className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-20 text-center">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 font-bold text-lg">No orders found matching your filters</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredOrders.map((order, i) => (
                    <motion.div
                      key={order.id}
                      className="p-6 hover:bg-gray-50/50 cursor-pointer transition-colors"
                      onClick={() => setSelectedOrder(order)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.05 * i }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-bold text-gray-900 font-mono tracking-tight">{order.invoiceNumber}</span>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest border ${getStatusColor(order.status)} uppercase`}>
                              {order.status}
                            </span>
                            {order.paymentStatus !== 'pending' && (
                              <span className="bg-green-500 text-white px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">PAID</span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-y-2 gap-x-6 text-sm">
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <User className="w-4 h-4" />
                              <span className="truncate font-medium">{order.userDetails.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Calendar className="w-4 h-4" />
                              <span className="font-medium whitespace-nowrap">{formatDate(order.visitTime).split(',')[0]}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-600">
                              <Clock className="w-4 h-4" />
                              <span className="font-medium whitespace-nowrap">{formatDate(order.visitTime).split(',')[1]}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[#eb3e04] font-bold">
                              <IndianRupee className="w-4 h-4" />
                              <span>{order.totalAmount.toFixed(0)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {order.status === 'pending' && (
                            <>
                              <button
                                onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'approved') }}
                                className="w-10 h-10 flex items-center justify-center bg-green-500 text-white rounded-full hover:shadow-lg transition-all"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); updateOrderStatus(order.id, 'cancelled') }}
                                className="w-10 h-10 flex items-center justify-center bg-red-500 text-white rounded-full hover:shadow-lg transition-all"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Inventory Tab */
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Live Item Inventory</h2>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    if (confirm('Reset all items to 12 units for today?')) {
                      try {
                        const { error } = await supabase
                          .from('menu_items')
                          .update({ available_count: 12, stock: 12 })
                          .neq('id', 'placeholder');
                        if (error) throw error;
                        toast.success('All inventory reset to 12!');
                        localStorage.setItem('lastInventoryReset', new Date().toLocaleDateString('en-GB'));
                        loadInventory();
                      } catch (e) {
                        toast.error('Reset failed');
                      }
                    }
                  }}
                  className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Reset All to 12
                </button>
                <button
                  onClick={() => {
                    setEditingItem({
                      id: '',
                      name: '',
                      category: '',
                      available_count: 12,
                      stock: 12
                    } as any);
                    setIsEditingModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all font-bold text-sm shadow-lg shadow-green-200"
                >
                  + New Item
                </button>
                {menuItems.length === 0 && (
                  <button
                    onClick={handleImportMenu}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all font-bold text-sm shadow-lg shadow-purple-200"
                  >
                    Import Static Menu
                  </button>
                )}
                <button
                  onClick={loadInventory}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-all font-bold text-sm text-gray-600"
                >
                  <RefreshCw className="w-4 h-4" /> Sync Menu
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-gray-500 text-xs font-black uppercase tracking-widest border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Item Name</th>
                    <th className="px-6 py-4">Category</th>
                    <th className="px-6 py-4 text-center">Remaining Stock</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-900">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{item.category}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col items-center">
                          <input
                            type="number"
                            value={item.available_count}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 0;
                              setMenuItems(prev => prev.map(i => i.id === item.id ? { ...i, available_count: val } : i))
                            }}
                            className="w-20 text-center py-1.5 border border-gray-200 rounded-lg font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
                          />
                          <span className={`text-[10px] mt-1 font-black ${item.available_count <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
                            {item.available_count <= 0 ? 'SOLD OUT' : item.available_count <= 5 ? 'LOW STOCK' : 'IN STOCK'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center gap-2">
                          <button
                            onClick={() => {
                              setEditingItem({ ...item });
                              setIsEditingModalOpen(true);
                            }}
                            className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-black hover:bg-blue-700 transition-all"
                          >
                            EDIT
                          </button>
                          <button
                            onClick={() => handleStockUpdate(item.id, item.available_count)}
                            disabled={updatingStock === item.id}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${updatingStock === item.id ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:bg-gray-800 active:scale-95'}`}
                          >
                            {updatingStock === item.id ? 'UPDATING...' : 'SAVE STOCK'}
                          </button>
                          <button
                            onClick={() => handleStockUpdate(item.id, 0)}
                            className="px-4 py-1.5 bg-red-100 text-red-600 rounded-lg text-xs font-black hover:bg-red-200 transition-all"
                          >
                            SET ZERO
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

      {/* Item Editing Modal */}
      <AnimatePresence>
        {isEditingModalOpen && editingItem && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsEditingModalOpen(false)}
          >
            <motion.div
              className="bg-white rounded-2xl max-w-lg w-full p-8"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                {editingItem.id ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
              <form onSubmit={editingItem.id ? handleSaveItem : handleCreateItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1">Item Name</label>
                  <input
                    type="text"
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#eb3e04] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1">Category</label>
                  <input
                    type="text"
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#eb3e04] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1">Price (comma separated for sizes)</label>
                  <input
                    type="text"
                    value={Array.isArray((editingItem as any).price) ? (editingItem as any).price.join(', ') : (editingItem as any).price}
                    onChange={(e) => {
                      const val = e.target.value.includes(',') ? e.target.value.split(',').map(p => p.trim()) : [e.target.value.trim()];
                      setEditingItem({ ...editingItem, price: val } as any);
                    }}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#eb3e04] outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase text-gray-400 mb-1">Description</label>
                  <textarea
                    value={(editingItem as any).description}
                    onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value } as any)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#eb3e04] outline-none h-24"
                    required
                  />
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditingModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-200 rounded-xl font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStock === editingItem.id}
                    className="flex-1 px-6 py-3 bg-[#eb3e04] text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-orange-100 disabled:opacity-50"
                  >
                    {updatingStock === editingItem.id ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
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
