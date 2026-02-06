"use client";
import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

interface CategoryCardProps {
  name: string;
  image: string;
  itemCount: number;
  onClick: () => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({ name, image, itemCount, onClick }) => {
  return (
    <motion.div
      className="rounded-xl shadow-lg overflow-hidden cursor-pointer hover:shadow-2xl transition-all duration-300 group relative"
      onClick={onClick}
      whileHover={{ 
        scale: 1.05,
        y: -8,
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)"
      }}
      whileTap={{ scale: 0.95 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Full Background Image */}
      <div className="absolute inset-0">
        <Image
          src={image}
          alt={name}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>

      {/* Dark Overlay for Text Readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
      
      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-end p-6 text-white min-h-[200px]">
        <div className="text-center">
          <h3 className="text-xl font-grimpt font-bold text-white mb-2 group-hover:text-[#eb3e04] transition-colors duration-300">{name}</h3>
          <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full">
            <span className="text-gray-200 font-garet text-sm">{itemCount} items</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default CategoryCard;
