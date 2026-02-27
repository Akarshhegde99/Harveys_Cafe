# Harvey's Pre-ordering System

A complete restaurant pre-ordering system with admin panel, built with Next.js, Supabase, and Razorpay.

## 🚀 Features

### Customer Features
- **User Authentication**: OTP-based login with Supabase Auth
- **Menu Browsing**: Interactive menu with categories and food items
- **Cart Management**: Add/remove items, quantity selection
- **Order Placement**: Create orders with visit time selection
- **Invoice Management**: View order history and payment status
- **Payment Integration**: Razorpay payment gateway for advance payments
- **Real-time Status**: See order approval status from admin

### Admin Features
- **Admin Dashboard**: Secure admin panel with order management
- **Order Review**: View all incoming orders with customer details
- **Order Management**: Approve or reject orders
- **Payment Tracking**: Monitor payment status and amounts
- **Real-time Updates**: Status changes reflect immediately on customer side

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Customer), LocalStorage (Admin)
- **Payments**: Razorpay
- **Animations**: Framer Motion
- **Styling**: Tailwind CSS with custom fonts

## 📋 Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 2. Database Setup

Run the SQL commands from `SETUP.md` in your Supabase SQL Editor to create the required tables.

### 3. Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 🔄 Order Flow

1. **Customer Login**: User logs in with email OTP
2. **Browse Menu**: Customer browses and adds items to cart
3. **Place Order**: Customer selects visit time and submits order
4. **Admin Review**: Order appears in admin dashboard with "pending" status
5. **Admin Decision**: Admin approves or rejects the order
6. **Payment**: If approved, customer can pay 50% advance amount
7. **Confirmation**: Payment updates order status to "confirmed"
8. **Visit**: Customer visits restaurant at scheduled time

## 👥 User Roles

### Customer Access
- **Login**: `/login` - OTP-based authentication
- **Menu**: `/menu` - Browse and order food
- **Cart**: `/cart` - Review and submit orders
- **Invoices**: `/invoices` - View order history and pay

### Admin Access
- **Login**: `/admin/login` - Email/password (admin@harveys.com / admin@123)
- **Dashboard**: `/admin/dashboard` - Manage all orders

## 💰 Payment System

- **50/50 Split**: 50% advance payment, 50% at restaurant
- **Razorpay Integration**: Secure payment processing
- **Status Tracking**: Real-time payment status updates
- **Invoice Generation**: Automatic invoice creation

## 🗂️ Project Structure

```
├── app/
│   ├── admin/           # Admin panel pages
│   ├── api/             # API routes
│   ├── cart/            # Shopping cart
│   ├── invoices/        # Order history
│   ├── login/           # Customer login
│   └── menu/            # Menu browsing
├── components/          # Reusable components
├── context/             # React contexts
├── lib/                 # Utility libraries
├── types/               # TypeScript types
└── data/                # Static data (menu items)
```

## 🔧 Key Components

- **AuthContext**: Manages customer authentication
- **CartContext**: Handles shopping cart state
- **PaymentContext**: Processes orders and payments
- **ProtectedRoute**: Route protection for customer/admin
- **Supabase Integration**: Database operations
- **Razorpay Integration**: Payment processing

## 📱 Responsive Design

- Mobile-first approach
- Optimized for all screen sizes
- Touch-friendly interface
- Fast loading with Next.js optimization

## 📚 Documentation

For more detailed information, please refer to the following guides:

- [Technical Guide](docs/TECHNICAL_GUIDE.md) - Architecture, Tech Stack, and Core Logic
- [API Usage Guide](docs/API_USAGE.md) - Detailed API Endpoints and Examples
- [Database Schema](docs/DATABASE_SCHEMA.md) - Table structures and relationships

## 🚀 Deployment

The app is ready for deployment on Vercel:

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

## 📞 Support

For setup assistance or issues, refer to `SETUP.md` for detailed configuration instructions.
