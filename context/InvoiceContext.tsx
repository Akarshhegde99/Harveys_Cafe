"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Invoice, InvoiceContextType } from '@/types/invoice';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';

const InvoiceContext = createContext<InvoiceContextType | undefined>(undefined);

export const useInvoice = () => {
  const context = useContext(InvoiceContext);
  if (!context) {
    throw new Error('useInvoice must be used within an InvoiceProvider');
  }
  return context;
};

export const InvoiceProvider = ({ children }: { children: ReactNode }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const generateInvoiceNumber = (): string => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `INV-${year}${month}${day}-${random}`;
  };

  const addInvoice = async (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => {
    setIsLoading(true);
    try {
      const now = new Date().toISOString();
      const newInvoice: Invoice = {
        ...invoiceData,
        id: `invoice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        invoiceNumber: generateInvoiceNumber(),
        createdAt: now,
        updatedAt: now,
        restaurantDetails: {
          name: "Harvey's Cafe",
          address: "123 Main Street, City, State 12345",
          phone: "+91 9876543210",
          email: "contact@harveyscafe.com",
          gst: "GST123456789"
        }
      };

      // Save to Supabase
      const { error } = await supabase
        .from('invoices')
        .insert([newInvoice]);

      if (error) {
        console.error('Error saving invoice to database:', error);
        // Continue with local storage as fallback
      }

      // Update local state
      setInvoices(prev => [newInvoice, ...prev]);
      
      // Also save to localStorage as backup
      const existingInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      existingInvoices.unshift(newInvoice);
      localStorage.setItem('invoices', JSON.stringify(existingInvoices));

      toast.success('Invoice generated successfully!', {
        icon: '📄',
      });

      return newInvoice;
    } catch (error) {
      console.error('Error creating invoice:', error);
      toast.error('Failed to generate invoice');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getInvoices = async (userId: string): Promise<Invoice[]> => {
    setIsLoading(true);
    try {
      // Try to fetch from Supabase first
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('userId', userId)
        .order('createdAt', { ascending: false });

      if (error) {
        console.error('Error fetching invoices from database:', error);
        // Fallback to localStorage
        const localInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        const userInvoices = localInvoices.filter((invoice: Invoice) => invoice.userId === userId);
        setInvoices(userInvoices);
        return userInvoices;
      }

      const invoicesData = data as Invoice[];
      setInvoices(invoicesData);
      return invoicesData;
    } catch (error) {
      console.error('Error fetching invoices:', error);
      // Fallback to localStorage
      const localInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const userInvoices = localInvoices.filter((invoice: Invoice) => invoice.userId === userId);
      setInvoices(userInvoices);
      return userInvoices;
    } finally {
      setIsLoading(false);
    }
  };

  const getInvoiceById = async (id: string): Promise<Invoice | null> => {
    try {
      // Try Supabase first
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching invoice from database:', error);
        // Fallback to localStorage
        const localInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
        return localInvoices.find((invoice: Invoice) => invoice.id === id) || null;
      }

      return data as Invoice;
    } catch (error) {
      console.error('Error fetching invoice:', error);
      return null;
    }
  };

  const updateInvoiceStatus = async (id: string, status: Invoice['status']) => {
    setIsLoading(true);
    try {
      // Update in Supabase
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status, 
          updatedAt: new Date().toISOString(),
          paymentStatus: status === 'completed' ? 'fully_paid' : 'advance_paid'
        })
        .eq('id', id);

      if (error) {
        console.error('Error updating invoice in database:', error);
      }

      // Update local state
      setInvoices(prev => 
        prev.map(invoice => 
          invoice.id === id 
            ? { 
                ...invoice, 
                status, 
                updatedAt: new Date().toISOString(),
                paymentStatus: status === 'completed' ? 'fully_paid' : 'advance_paid'
              }
            : invoice
        )
      );

      // Update localStorage
      const localInvoices = JSON.parse(localStorage.getItem('invoices') || '[]');
      const updatedInvoices = localInvoices.map((invoice: Invoice) => 
        invoice.id === id 
          ? { 
              ...invoice, 
              status, 
              updatedAt: new Date().toISOString(),
              paymentStatus: status === 'completed' ? 'fully_paid' : 'advance_paid'
            }
          : invoice
      );
      localStorage.setItem('invoices', JSON.stringify(updatedInvoices));

      toast.success('Invoice status updated!', {
        icon: '✅',
      });
    } catch (error) {
      console.error('Error updating invoice status:', error);
      toast.error('Failed to update invoice status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <InvoiceContext.Provider value={{
      invoices,
      addInvoice,
      getInvoices,
      getInvoiceById,
      updateInvoiceStatus,
      isLoading,
    }}>
      {children}
    </InvoiceContext.Provider>
  );
};
