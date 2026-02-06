"use client";
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Foodcard from './foodcard';
import CategoryCard from './categorycard';
import { menuItems } from '@/data/menu';
import CartAddition from '../modal/cartaddition';

interface MenuItem {
  image: string;
  name: string;
  price: string[]; // Array of prices
  description: string;
  category: string;
  size?: string[]; // Array of sizes
  type?: string;
}

function Menu() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Get unique categories
  const categories = Array.from(new Set(menuItems.map(item => item.category)));
  
  // Category images mapping
  const categoryImages: { [key: string]: string } = {
    'Rolls': '/menuimages/vegroll.png',
    'Pizza': '/menuimages/cheese-pizza.png',
    'Burgers': '/menuimages/chicken-tikka-burger.png',
    'Broasted': '/menuimages/broasted-chicken.png',
    'Fries': '/menuimages/original-salted-fries.png',
    'Pasta': '/menuimages/alfredo.jpg',
    'Sauce': '/menuimages/mayo.png'
  };

  // Filter items by category
  const filteredItems = selectedCategory 
    ? menuItems.filter(item => item.category === selectedCategory)
    : menuItems;

  const handleAddClick = async (item: MenuItem) => {
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedItem(null);
  };

  const handleCategoryClick = (category: string) => {
    setSelectedCategory(category);
  };

  const handleBackToCategories = () => {
    setSelectedCategory(null);
  };

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
  };

  return (
    <motion.div 
      className="min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="container mx-auto px-4 py-6">
        {selectedCategory ? (
          // Show items for selected category
          <div>
            <motion.div 
              className="flex items-center justify-between mb-6"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-grimpt-brush text-white">
                {selectedCategory}
              </h2>
              <button
                onClick={handleBackToCategories}
                className="bg-transparent border border-white/30 text-white font-grimpt px-4 py-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                ← Back to Categories
              </button>
            </motion.div>
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {filteredItems.map((item, index) => (
                <motion.div
                  key={item.name}
                  variants={itemVariants}
                >
                  <Foodcard
                    image={item.image}
                    name={item.name}
                    price={item.price}
                    description={item.description}
                    category={item.category}
                    size={item.size}
                    type={item.type}
                    onAdd={() => handleAddClick(item)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        ) : (
          // Show categories
          <div>
            <motion.h2 
              className="text-3xl font-grimpt-brush text-white text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Choose a Category
            </motion.h2>
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {categories.map((category, index) => (
                <motion.div
                  key={category}
                  variants={itemVariants}
                >
                  <CategoryCard
                    name={category}
                    image={categoryImages[category] || '/menuimages/vegroll.png'}
                    itemCount={menuItems.filter(item => item.category === category).length}
                    onClick={() => handleCategoryClick(category)}
                  />
                </motion.div>
              ))}
            </motion.div>
          </div>
        )}
      </div>
      <CartAddition 
        isOpen={isModalOpen} 
        onClose={closeModal} 
        item={selectedItem} 
      />
    </motion.div>
  );
}

export default Menu;