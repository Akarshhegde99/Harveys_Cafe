# Technical Guide - Harvey's Cafe Pre-ordering System

## Overview
Harvey's Cafe Pre-ordering System is a full-stack web application designed to streamline the food ordering process. It allows customers to browse the menu, place orders with a scheduled visit time, and pay an advance. Admins can manage these orders through a secure dashboard.

## Architecture
The application is built using the **Next.js App Router** architecture, providing a seamless transition between server-side and client-side rendering.

### Frontend
- **Framework**: Next.js 15 (React)
- **State Management**: React Context API (`AuthContext`, `CartContext`, `PaymentContext`)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Form Handling**: React Hooks

### Backend
- **API Routes**: Next.js Serverless Functions (`app/api/*`)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: 
  - **Customers**: Supabase Auth (OTP-based)
  - **Admins**: Session-based/LocalStorage (via `app/admin/login`)

### Third-Party Integrations
- **Payments**: Razorpay (50% advance payment model)
- **Database/Auth**: Supabase

## Project Structure
```text
├── app/                  # Next.js App Router pages and API routes
│   ├── admin/            # Admin Panel (Dashboard, Login, Orders)
│   ├── api/              # Backend API endpoints
│   ├── cart/             # Shopping cart and checkout flow
│   ├── invoices/         # User order history and invoice viewing
│   ├── login/            # Customer authentication (OTP)
│   └── menu/             # Menu browsing and item selection
├── components/           # Reusable UI components (Navbar, Footer, etc.)
├── context/              # React Contexts for global state management
├── lib/                  # Utility functions and shared clients (Supabase, etc.)
├── types/                # TypeScript interfaces and types
├── data/                 # Static data (e.g., initial menu items)
└── public/               # Static assets (images, icons)
```

## Core Business Logic

### Order Lifecycle
1. **Creation**: Customer selects items and visit time.
2. **Pending Approval**: Order is stored in Supabase with `status: 'pending'`.
3. **Admin Review**: Admin reviews the order on the dashboard and decides to Approve or Reject.
4. **Advance Payment**: If approved, the customer is prompted to pay a 50% advance via Razorpay.
5. **Confirmation**: Upon successful payment, order status updates to `confirmed`.
6. **Completion**: Customer visits the cafe at the scheduled time.

### Payment Model (50/50)
- **Advance**: 50% of the subtotal is paid online via Razorpay.
- **Balance**: Reamining 50% is paid at the restaurant upon visit.
- **Invoicing**: Detailed invoices are generated showing the breakup.

## Development Setup

### Environment Variables
Required variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`

### Deployment
Recommended to deploy on **Vercel** for optimal Next.js performance. Ensure all environment variables are configured in the Vercel dashboard.
