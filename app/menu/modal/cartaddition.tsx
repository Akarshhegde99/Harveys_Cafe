"use client";
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import { X, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface CartAdditionProps {
  isOpen: boolean;
  onClose: () => void;
  item: {
    id: string;
    image: string;
    name: string;
    price: string[]; // Array of prices for different sizes
    description: string;
    category: string;
    size?: string[]; // Array of sizes
    type?: string;
    available_count?: number;
  } | null;
}

function CartAddition({ isOpen, onClose, item }: CartAdditionProps) {
  const { addToCart, isLoading, getCartItemsCount, maxTotalItems } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedSizeIndex, setSelectedSizeIndex] = useState(0); // Track selected size index

  const handleAddToCart = async () => {
    if (item) {
      const cartItem = {
        image: item.image,
        name: item.name,
        price: item.price[selectedSizeIndex], // Use selected price
        description: item.description,
        category: item.category,
        selectedSize: item.size ? item.size[selectedSizeIndex] : undefined,
        type: item.type,
        menu_item_id: item.id,
      };
      await addToCart(cartItem, quantity, item.available_count);
      setQuantity(1);
      setSelectedSizeIndex(0);
      onClose();
    }
  };

  const incrementQuantity = () => {
    const totalInCart = getCartItemsCount();

    // Check total limit
    if (totalInCart + quantity >= maxTotalItems) {
      toast.error(`Order limit is ${maxTotalItems} items total.`, { icon: '🚫' });
      return;
    }

    // Check stock limit
    if (item?.available_count !== undefined && quantity >= item.available_count) {
      toast.error(`Only ${item.available_count} items left in stock.`, { icon: '⚠️' });
      return;
    }

    // Check per-item convenience limit (optional but good)
    if (quantity >= 3) {
      toast.error('Maximum 3 of the same item allowed.', { icon: '🚫' });
      return;
    }

    setQuantity(prev => prev + 1);
  };
  const decrementQuantity = () => setQuantity(prev => Math.max(1, prev - 1));

  if (!item) return null;

  const currentPrice = parseFloat(item.price[selectedSizeIndex].replace(/[^0-9.]/g, '')) || 0;
  const totalPrice = (currentPrice * quantity).toFixed(2);

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const modalVariants = {
    hidden: {
      y: "100%",
      opacity: 0
    },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 400
      }
    },
    exit: {
      y: "100%",
      opacity: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  const contentVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.2,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black bg-opacity-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Modal - slides from bottom */}
          <motion.div
            className="fixed bottom-0 left-0 right-0 text-white bg-[url(/modalbg.svg)] rounded-t-3xl z-50"
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <motion.div
              className="p-6"
              variants={contentVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Close button */}
              <motion.button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-white"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                variants={itemVariants}
              >
                <X className="w-5 h-5 text-black" />
              </motion.button>

              {/* Item image */}
              <motion.div
                className="w-full h-48 bg-gray-200 rounded-lg mb-4 overflow-hidden"
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
              >
                <div className="relative w-full h-full">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 500px"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              </motion.div>

              {/* Item details */}
              <motion.div className="mb-6" variants={itemVariants}>
                <motion.h2
                  className="text-2xl font-bold font-grimpt mb-2"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {item.name}
                </motion.h2>
                <motion.p
                  className="text-lg font-semibold text-[#eb3e04] font-garet mb-3"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  key={`price-${selectedSizeIndex}`}
                >
                  {item.price[selectedSizeIndex]}
                </motion.p>
                {item.type && (
                  <motion.span
                    className={`inline-block px-2 py-1 rounded text-xs font-bold mb-3 ${item.type === 'Veg'
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                      }`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.45 }}
                  >
                    {item.type}
                  </motion.span>
                )}
                <motion.p
                  className="text-white font-garet leading-relaxed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  {item.description}
                </motion.p>
              </motion.div>

              {/* Size selector (if multiple sizes available) */}
              {item.size && item.size.length > 1 && (
                <motion.div
                  className="mb-6"
                  variants={itemVariants}
                >
                  <span className="text-lg font-semibold mb-3 block">Size</span>
                  <div className="flex flex-wrap gap-2">
                    {item.size.map((size, index) => (
                      <motion.button
                        key={size}
                        onClick={() => setSelectedSizeIndex(index)}
                        className={`px-4 py-2 rounded-lg font-semibold transition-all ${selectedSizeIndex === index
                          ? 'bg-white text-black'
                          : 'bg-gray-500 text-white hover:bg-gray-400'
                          }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                      >
                        <div className="text-center">
                          <div className="text-sm">{size}</div>
                          <div className="text-xs font-bold">{item.price[index]}</div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Quantity selector */}
              <motion.div
                className="flex items-center justify-between mb-6"
                variants={itemVariants}
              >
                <span className="text-lg font-semibold">Quantity</span>
                <div className="flex items-center space-x-4">
                  <motion.button
                    onClick={decrementQuantity}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 text-black h-4" />
                  </motion.button>

                  <motion.span
                    className="text-xl font-bold w-8 text-center"
                    key={quantity}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    {quantity}
                  </motion.span>

                  <motion.button
                    onClick={incrementQuantity}
                    className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-100"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <Plus className="w-4 text-black h-4" />
                  </motion.button>
                </div>
              </motion.div>

              {/* Add to cart button */}
              <motion.button
                onClick={handleAddToCart}
                disabled={isLoading}
                className="inline-block rounded bg-transparent border-2 border-white px-8 py-4 text-white font-grimpt text-2xl font-bold shadow-lg transition-transform w-full disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden"
                variants={itemVariants}
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
              >
                {isLoading ? (
                  <motion.div
                    className="flex items-center justify-center"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <motion.div
                      className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" as const }}
                    />
                    Adding to Cart...
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    Add to Cart - ₹{totalPrice}
                  </motion.div>
                )}
              </motion.button>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default CartAddition;