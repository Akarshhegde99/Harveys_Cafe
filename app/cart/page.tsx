"use client";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { usePayment } from '@/context/PaymentContext';
import Link from 'next/link';
import { Plus, Minus, Trash2, ShoppingBag, Clock, CreditCard, ArrowLeft } from 'lucide-react';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Skeleton, ListSkeleton } from '@/components/Skeleton';
import Image from 'next/image';

function Cart() {
  const { cartItems, updateQuantity, removeFromCart, getCartTotal, getCartItemsCount, maxTotalItems, isLoading } = useCart();
  const { isProcessing, visitTime, setVisitTime, processPayment, createOrderRequest } = usePayment();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent">
        <div className="px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6 bg-white/20" />
          <ListSkeleton />
        </div>
      </div>
    );
  }


  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut" as const,
      },
    },
    exit: {
      x: -100,
      opacity: 0,
      transition: {
        duration: 0.3,
      },
    },
  };

  const CartContent = () => {
    if (cartItems.length === 0) {
      return (
        <motion.div
          className="px-4 py-8 min-h-screen flex flex-col items-center justify-center text-white"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <ShoppingBag className="w-24 h-24 mx-auto mb-6 text-gray-400" />
            </motion.div>
            <motion.h1
              className="text-2xl sm:text-3xl font-bold mb-4 text-white font-grimpt"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Your Cart is Empty
            </motion.h1>
            <motion.p
              className="text-gray-200 font-garet mb-6"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Add some delicious items to get started!
            </motion.p>
            <motion.a
              href="/menu"
              className="inline-block bg-[#eb3e04] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#d32f02] transition-colors font-grimpt"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Browse Menu
            </motion.a>
          </div>
        </motion.div>
      );
    }

    return (
      <motion.div
        className="px-4 py-6 min-h-screen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Link href="/menu" className="inline-flex items-center text-white hover:text-gray-200 transition-colors mb-4 font-garet">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Menu
        </Link>
        <motion.h1
          className="text-2xl sm:text-3xl font-bold mb-6 text-white font-grimpt"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Your Cart
        </motion.h1>

        <motion.div
          className="space-y-3 sm:space-y-4"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence>
            {cartItems.map((item, index) => (
              <motion.div
                key={item.id}
                className="bg-white p-4 rounded-xl shadow-lg border border-gray-200"
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                layout
                whileHover={{ y: -2 }}
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  {/* Item Image */}
                  <motion.div
                    className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0"
                    whileHover={{ scale: 1.05 }}
                  >
                    <div className="relative w-full h-full">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 64px, 80px"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-500 text-xs" style={{ display: 'none' }}>
                      IMAGE
                    </div>
                  </motion.div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <motion.h2
                      className="text-base sm:text-lg font-bold font-grimpt text-gray-800 truncate"
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                    >
                      {item.name}
                      {item.selectedSize && (
                        <span className="text-sm font-normal text-gray-600 ml-2">
                          ({item.selectedSize})
                        </span>
                      )}
                    </motion.h2>
                    <motion.p
                      className="text-base sm:text-lg font-semibold text-[#eb3e04] font-garet"
                      initial={{ x: -10, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      {item.price}
                    </motion.p>
                    {item.type && (
                      <motion.span
                        className={`inline-block px-2 py-1 rounded text-xs font-bold mt-1 ${item.type === 'Veg' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                          }`}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.25 }}
                      >
                        {item.type}
                      </motion.span>
                    )}
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <motion.button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      disabled={isLoading}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
                      whileHover={{ scale: isLoading ? 1 : 1.1 }}
                      whileTap={{ scale: isLoading ? 1 : 0.9 }}
                    >
                      <Minus className="w-4 h-4" />
                    </motion.button>

                    <motion.span
                      className="text-base sm:text-lg font-bold w-6 sm:w-8 text-center"
                      key={`${item.id}-${item.quantity}`}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {item.quantity}
                    </motion.span>

                    <motion.button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={isLoading || getCartItemsCount() >= maxTotalItems}
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: isLoading ? 1 : 1.1 }}
                      whileTap={{ scale: isLoading ? 1 : 0.9 }}
                    >
                      <Plus className="w-4 h-4" />
                    </motion.button>
                  </div>

                  {/* Remove Button */}
                  <motion.button
                    onClick={() => removeFromCart(item.id)}
                    disabled={isLoading}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg active:scale-95 transition-all disabled:opacity-50"
                    whileHover={{ scale: isLoading ? 1 : 1.1, rotate: isLoading ? 0 : 10 }}
                    whileTap={{ scale: isLoading ? 1 : 0.9 }}
                  >
                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </motion.button>
                </div>

                {/* Total Price for this item - Mobile responsive */}
                <motion.div
                  className="mt-3 pt-3 border-t border-gray-100"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600 font-garet">Item Total:</span>
                    <motion.p
                      className="text-lg font-bold text-gray-800 font-garet"
                      key={`${item.id}-total-${item.quantity}`}
                      initial={{ scale: 1.2, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      ₹{(parseFloat(item.price.replace('₹', '')) * item.quantity).toFixed(2)}
                    </motion.p>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Visit Time Selection */}
        <motion.div
          className="mt-6 sm:mt-8 bg-white/10 backdrop-blur-md p-4 sm:p-6 rounded-xl border border-white/20"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          <motion.div
            className="flex items-center gap-3 mb-4"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Clock className="w-6 h-6 text-white" />
            <h3 className="text-lg sm:text-xl font-bold font-grimpt text-white">When will you visit?</h3>
          </motion.div>

          <motion.div
            className="relative"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <select
              value={visitTime}
              onChange={(e) => setVisitTime(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white font-garet focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="" className="bg-gray-800 text-white">Select your visit time</option>
              <option value="10" className="bg-gray-800 text-white">10 minutes</option>
              <option value="15" className="bg-gray-800 text-white">15 minutes</option>
              <option value="30" className="bg-gray-800 text-white">30 minutes</option>
              <option value="45" className="bg-gray-800 text-white">45 minutes</option>
              <option value="60" className="bg-gray-800 text-white">1 hour</option>
              <option value="90" className="bg-gray-800 text-white">1.5 hours</option>
              <option value="120" className="bg-gray-800 text-white">2 hours</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </motion.div>
        </motion.div>

        {/* Payment Summary */}
        <motion.div
          className="mt-6 sm:mt-8 bg-white p-4 sm:p-6 rounded-xl shadow-lg border border-gray-200"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <motion.div
            className="space-y-3 mb-6"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.7 }}
          >
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-garet">Total Order Value:</span>
              <span className="text-lg font-bold text-gray-800 font-garet">₹{getCartTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 font-garet">Advance Payment (50%):</span>
              <span className="text-lg font-bold text-[#eb3e04] font-garet">₹{(getCartTotal() * 0.5).toFixed(2)}</span>
            </div>
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 font-garet">Remaining (50%):</span>
                <span className="text-lg font-bold text-gray-800 font-garet">₹{(getCartTotal() * 0.5).toFixed(2)}</span>
              </div>
              <p className="text-sm text-gray-500 font-garet mt-1">To be paid at the restaurant</p>
            </div>
          </motion.div>

          <motion.button
            onClick={createOrderRequest}
            disabled={isLoading || isProcessing || !visitTime}
            className="w-full bg-[#eb3e04] text-white py-3 sm:py-4 rounded-lg font-bold text-base sm:text-lg hover:bg-[#d32f02] active:scale-95 transition-all font-grimpt disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: (isLoading || isProcessing || !visitTime) ? 1 : 1.02 }}
            whileTap={{ scale: (isLoading || isProcessing || !visitTime) ? 1 : 0.98 }}
          >
            {isLoading || isProcessing ? (
              <motion.div
                className="flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" as const }}
                />
                Submitting Order...
              </motion.div>
            ) : (
              <>
                <ShoppingBag className="w-5 h-5" />
                Submit Order Request
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Restaurant Payment Notice */}
        <motion.div
          className="mt-4 bg-yellow-50 border border-yellow-200 p-4 rounded-xl"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-bold text-yellow-800 font-grimpt mb-1">Restaurant Payment Required</h4>
              <p className="text-sm text-yellow-700 font-garet">
                The remaining 50% (₹{(getCartTotal() * 0.5).toFixed(2)}) must be paid at the restaurant when you collect your order.
                This ensures food quality and reduces waste.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <ProtectedRoute>
      <CartContent />
    </ProtectedRoute>
  );
}

export default Cart;