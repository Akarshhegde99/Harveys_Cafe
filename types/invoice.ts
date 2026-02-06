export interface InvoiceItem {
  id: string;
  name: string;
  price: string;
  quantity: number;
  category: string;
  image: string;
  description: string;
  selectedSize?: string;
  type?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  paymentId: string;
  userId: string;
  userDetails: {
    name: string;
    email: string;
    phone: string;
  };
  items: InvoiceItem[];
  subtotal: number;
  advanceAmount: number;
  remainingAmount: number;
  totalAmount: number;
  visitTime: string;
  status: 'pending' | 'approved' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'pending' | 'advance_paid' | 'fully_paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
  restaurantDetails: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gst?: string;
  };
}

export interface InvoiceContextType {
  invoices: Invoice[];
  addInvoice: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  getInvoices: (userId: string) => Promise<Invoice[]>;
  getInvoiceById: (id: string) => Promise<Invoice | null>;
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>;
  isLoading: boolean;
}
