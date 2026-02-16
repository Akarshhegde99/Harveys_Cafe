import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useCart } from '@/context/CartContext';
import Image from 'next/image';

interface FoodcardProps {
  image: string;
  name: string;
  price: string[]; // Array of prices
  category: string;
  description: string;
  size?: string[]; // Array of sizes
  type?: string;
  availableCount?: number;
  onAdd: () => void;
}

const Foodcard: React.FC<FoodcardProps> = React.memo(({ image, name, price, category, description, size, type, availableCount, onAdd }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { isLoading } = useCart();

  const isSoldOut = availableCount !== undefined && availableCount <= 0;

  const handleAddClick = async () => {
    if (isSoldOut) return;
    setIsAdding(true);
    await onAdd();
    setIsAdding(false);
  };

  // Display starting price or single price
  const displayPrice = price.length > 1
    ? `Starts at ${price[0]}`
    : price[0];

  return (
    <motion.div
      className={`w-full max-w-sm mx-auto rounded-xl shadow-lg overflow-hidden transition-all duration-300 group relative ${isSoldOut ? 'grayscale cursor-not-allowed opacity-80' : 'hover:shadow-2xl'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={!isSoldOut ? {
        y: -8,
        transition: { duration: 0.2 }
      } : {}}
    >
      {/* Full Background Image */}
      <div className="absolute inset-0">
        {!imageLoaded && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 animate-pulse"
            initial={{ opacity: 1 }}
            animate={{ opacity: imageLoaded ? 0 : 1 }}
            transition={{ duration: 0.3 }}
          />
        )}

        <Image
          src={image}
          alt={name}
          fill
          className={`object-cover ${!isSoldOut && 'group-hover:scale-110'} transition-transform duration-500`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            target.style.display = 'none';
            const sibling = target.nextElementSibling as HTMLElement;
            if (sibling) sibling.style.display = 'flex';
            setImageLoaded(true);
          }}
        />
      </div>

      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>

      {/* Content Overlay */}
      <motion.div
        className="relative z-10 h-full flex flex-col justify-end p-6 text-white min-h-[320px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {/* Availability Badge */}
        {isSoldOut && (
          <motion.span
            className="absolute top-4 left-4 inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white shadow-lg"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            SOLD OUT
          </motion.span>
        )}

        {/* Type Badge - Positioned at top right */}
        {type && (
          <motion.span
            className={`absolute top-4 right-4 inline-block px-3 py-1 rounded-full text-xs font-bold ${type === 'Veg' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.3 }}
          >
            {type}
          </motion.span>
        )}

        <div className="mb-4">
          <motion.h3
            className={`text-xl sm:text-2xl font-bold font-grimpt text-white mb-2 line-clamp-2 transition-colors duration-300 ${!isSoldOut && 'group-hover:text-[#eb3e04]'}`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {name}
          </motion.h3>

          <motion.p
            className="text-xl sm:text-2xl font-bold text-[#eb3e04] font-garet mb-2"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            {displayPrice}
          </motion.p>

          {size && size.length > 1 && (
            <motion.p
              className="text-sm text-gray-200 font-garet"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.4 }}
            >
              Available in: {size.join(', ')}
            </motion.p>
          )}
        </div>

        <motion.button
          onClick={handleAddClick}
          disabled={isAdding || isLoading || isSoldOut}
          className={`w-full ${isSoldOut ? 'bg-gray-600' : 'bg-[#eb3e04] hover:bg-[#d32f02]'} text-white py-4 px-6 rounded-xl font-grimpt font-bold text-lg transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed relative overflow-hidden group/btn`}
          whileHover={!isSoldOut && !isAdding && !isLoading ? { scale: 1.02 } : {}}
          whileTap={!isSoldOut && !isAdding && !isLoading ? { scale: 0.98 } : {}}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.4 }}
        >
          {isAdding || isLoading ? (
            <div className="flex items-center justify-center">
              <motion.div
                className="w-6 h-6 border-2 border-white border-t-transparent rounded-full mr-3"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" as const }}
              />
              Adding...
            </div>
          ) : isSoldOut ? (
            'OUT OF STOCK'
          ) : (
            <span className="flex items-center justify-center gap-2">
              ADD TO CART
              <motion.span className="group-hover/btn:translate-x-1 transition-transform duration-300">
                →
              </motion.span>
            </span>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
});

Foodcard.displayName = 'Foodcard';

export default Foodcard;