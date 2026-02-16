"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Foodcard from './foodcard';
import CategoryCard from './categorycard';
import { supabase } from '@/lib/supabase';
import CartAddition from '../modal/cartaddition';
import { menuItems as staticMenuItems } from '@/data/menu';
import { CardSkeleton, CategorySkeleton } from '@/components/Skeleton';


interface MenuItem {
  id: string;
  image: string;
  name: string;
  price: string[];
  description: string;
  category: string;
  size?: string[];
  type?: string;
  available_count?: number;
}

function Menu() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(staticMenuItems.map((item, index) => ({
    ...item,
    id: `static-${index}`,
    available_count: 12 // Default
  })));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();

    // Set up real-time subscription for stock updates
    const subscription = supabase
      .channel('menu_items_stock')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'menu_items'
      }, (payload) => {
        const updatedItem = payload.new as MenuItem;
        setMenuItems(prev => prev.map(item =>
          (item.id === updatedItem.id || item.name.toLowerCase() === updatedItem.name.toLowerCase())
            ? { ...item, ...updatedItem }
            : item
        ));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchMenuItems = async () => {
    try {
      setLoading(true);
      const { data: dbItems, error } = await supabase
        .from('menu_items')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching menu items:', error);
        // Fallback to static items is already handled by state initialization
        return;
      }

      if (dbItems && dbItems.length > 0) {
        // Create a map of DB items by name for easy lookup
        const dbItemsMap = new Map();
        dbItems.forEach(item => dbItemsMap.set(item.name.toLowerCase().trim(), item));

        // Merge DB data with static data or use DB data directly
        const missingItems: any[] = [];
        const mergedItems = staticMenuItems.map((staticItem, index) => {
          const dbItem = dbItemsMap.get(staticItem.name.toLowerCase().trim());

          let processedPrice = staticItem.price;
          if (dbItem?.price) {
            if (typeof dbItem.price === 'string') {
              try {
                const cleanStr = dbItem.price.replace(/{/g, '[').replace(/}/g, ']');
                processedPrice = cleanStr.startsWith('[') ? JSON.parse(cleanStr) : dbItem.price.split(',').map((p: string) => p.trim());
              } catch (e) {
                processedPrice = [dbItem.price];
              }
            } else if (Array.isArray(dbItem.price)) {
              processedPrice = dbItem.price;
            }
          }

          if (dbItem) {
            return {
              ...staticItem,
              ...dbItem,
              available_count: Math.min(dbItem.available_count ?? 12, 12),
              price: Array.isArray(processedPrice) ? processedPrice : [processedPrice]
            };
          }

          // If item is missing from DB, collect it for insertion
          missingItems.push({
            name: staticItem.name,
            description: staticItem.description,
            price: staticItem.price,
            category: staticItem.category,
            image: staticItem.image,
            size: (staticItem as any).size || [],
            type: (staticItem as any).type || '',
            stock: 12,
            available_count: 12
          });

          return {
            ...staticItem,
            id: `static-${index}`,
            available_count: 12,
            price: processedPrice
          };
        });

        // Automatically sync missing items to DB
        if (missingItems.length > 0 && (window as any)._syncCount < 3) {
          (window as any)._syncCount = ((window as any)._syncCount || 0) + 1;
          console.log('Syncing missing items to Supabase (Attempt ' + (window as any)._syncCount + '):', missingItems);
          const { error } = await supabase.from('menu_items').insert(missingItems);
          if (error) console.error('Auto-sync error:', error);
          else {
            await fetchMenuItems(); // Re-fetch and return to avoid setting old state
            return;
          }
        }

        // Also add any items that are ONLY in DB
        const dbOnlyItems = dbItems.filter(dbItem =>
          !staticMenuItems.some(si => si.name.toLowerCase().trim() === dbItem.name.toLowerCase().trim())
        ).map(item => {
          let processedPrice = item.price;
          if (typeof item.price === 'string') {
            try {
              const cleanStr = item.price.replace(/{/g, '[').replace(/}/g, ']');
              processedPrice = cleanStr.startsWith('[') ? JSON.parse(cleanStr) : item.price.split(',').map((p: string) => p.trim());
            } catch (e) {
              processedPrice = [item.price];
            }
          }
          return {
            ...item,
            available_count: Math.min(item.available_count ?? 12, 12),
            price: Array.isArray(processedPrice) ? processedPrice : [processedPrice]
          };
        });

        setMenuItems([...mergedItems, ...dbOnlyItems]);
      } else if (staticMenuItems.length > 0) {
        // DB is empty, sync all static items
        const allItems = staticMenuItems.map(item => ({
          name: item.name,
          description: item.description,
          price: item.price,
          category: item.category,
          image: item.image,
          size: (item as any).size || [],
          type: (item as any).type || '',
          stock: 12,
          available_count: 12
        }));

        console.log('DB empty. Syncing all static items to Supabase...');
        const { error } = await supabase.from('menu_items').insert(allItems);
        if (error) console.error('Initial sync error:', error);
        else fetchMenuItems();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };


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
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              selectedCategory ? <CardSkeleton key={i} /> : <CategorySkeleton key={i} />
            ))}
          </div>
        ) : selectedCategory ? (
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
                  key={item.id || item.name}
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
                    availableCount={item.available_count}
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
        item={selectedItem as any}
      />
    </motion.div>
  );
}

export default Menu;