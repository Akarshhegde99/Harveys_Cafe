"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import toast from 'react-hot-toast';

export interface CartItem {
  id: string;
  image: string;
  name: string;
  price: string; // Keep as single string for cart items
  description: string;
  category: string;
  quantity: number;
  selectedSize?: string; // Add selected size for cart items
  type?: string; 
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, 'id' | 'quantity'>, quantity?: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getCartTotal: () => number;
  getCartItemsCount: () => number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addToCart = async (item: Omit<CartItem, 'id' | 'quantity'>, quantity: number = 1) => {
    setIsLoading(true);
    
    // Simulate API delay for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const existingItem = cartItems.find(cartItem => 
        cartItem.name === item.name && 
        cartItem.price === item.price && 
        cartItem.category === item.category
      );
      
      if (existingItem) {
        setCartItems(prev =>
          prev.map(cartItem =>
            cartItem.id === existingItem.id 
              ? { ...cartItem, quantity: cartItem.quantity + quantity }
              : cartItem
          )
        );
        toast.success(`Updated ${item.name} quantity in cart!`, {
          icon: '🔄',
        });
      } else {
        const newItem: CartItem = {
          ...item,
          id: `${item.name}-${item.price}-${item.category}-${Date.now()}-${Math.random()}`,
          quantity: quantity,
        };
        setCartItems(prev => [...prev, newItem]);
        toast.success(`${item.name} added to cart!`, {
          icon: '🛒',
        });
      }
    } catch (error) {
      toast.error('Failed to add item to cart');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromCart = async (id: string) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      const item = cartItems.find(item => item.id === id);
      setCartItems(prev => prev.filter(item => item.id !== id));
      
      if (item) {
        toast.success(`${item.name} removed from cart`, {
          icon: '🗑️',
        });
      }
    } catch (error) {
      toast.error('Failed to remove item from cart');
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (id: string, quantity: number) => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 150));
    
    try {
      if (quantity <= 0) {
        await removeFromCart(id);
        return;
      }
      
      const item = cartItems.find(item => item.id === id);
      setCartItems(prev =>
        prev.map(item =>
          item.id === id ? { ...item, quantity } : item
        )
      );
      
      if (item) {
        toast.success(`${item.name} quantity updated!`, {
          icon: '📝',
        });
      }
    } catch (error) {
      toast.error('Failed to update quantity');
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    try {
      setCartItems([]);
      toast.success('Cart cleared!', {
        icon: '🗑️',
      });
    } catch (error) {
      toast.error('Failed to clear cart');
    } finally {
      setIsLoading(false);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = parseFloat(item.price.replace('₹', ''));
      return total + (price * item.quantity);
    }, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
      getCartItemsCount,
      isLoading,
    }}>
      {children}
    </CartContext.Provider>
  );
};
