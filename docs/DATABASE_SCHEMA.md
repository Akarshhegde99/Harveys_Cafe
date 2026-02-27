# Database Schema - Harvey's Cafe

The application uses **Supabase (PostgreSQL)** for data storage. Below are the primary tables and their structures.

## 1. `invoices` Table
Stores detailed information about each order, acting as the primary record for both customers and admins.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `UUID/TEXT` | Primary Key |
| `invoice_number` | `TEXT` | Unique human-readable invoice ID |
| `order_id` | `TEXT` | Razorpay order ID |
| `payment_id` | `TEXT` | Razorpay payment ID |
| `user_id` | `TEXT` | Customer email or ID |
| `user_details` | `JSONB` | Object containing name, email, phone |
| `items` | `JSONB` | Array of ordered items |
| `subtotal` | `NUMERIC` | Sum of all item prices |
| `advance_amount` | `NUMERIC` | 50% of subtotal |
| `remaining_amount` | `NUMERIC` | Remaining 50% to be paid |
| `total_amount` | `NUMERIC` | Total order value |
| `visit_time` | `TIMESTAMP` | Scheduled visit time |
| `status` | `TEXT` | `pending`, `approved`, `confirmed`, `completed`, `cancelled` |
| `payment_status`| `TEXT` | `pending`, `advance_paid`, `fully_paid` |
| `created_at` | `TIMESTAMP` | Record creation time |
| `updated_at` | `TIMESTAMP` | Last update time |
| `restaurant_details`| `JSONB` | Static info about Harvey's Cafe |

## 2. `menu_items` Table
Stores the availability and details of food items.

| Column | Type | Description |
|--------|------|-------------|
| `id` | `UUID/TEXT` | Primary Key |
| `name` | `TEXT` | Item name |
| `description` | `TEXT` | Item description |
| `price` | `NUMERIC` | Current price |
| `category` | `TEXT` | e.g., 'Starters', 'Main Course' |
| `available_count`| `INTEGER` | Current quantity in stock |
| `image_url` | `TEXT` | URL to item image |

## 3. `orders` Table
Used for internal tracking of Razorpay transactions.

| Column | Type | Description |
|--------|------|-------------|
| `orderId` | `TEXT` | Razorpay Order ID |
| `paymentId` | `TEXT` | Razorpay Payment ID |
| `visitTime` | `TEXT` | Visit time string |
| `status` | `TEXT` | Transaction status |
| `advancePaid` | `BOOLEAN` | Whether advance was successful |
| `createdAt` | `TIMESTAMP` | Creation time |

---

## Relationships & Logic
- **Stock Management**: When an order is placed (`/api/create-order-request`), the system decrements the `available_count` in the `menu_items` table.
- **Invoice vs Order**: The `invoices` table is the source of truth for the UI. The `orders` table is primarily for verifying backend payment logs.
- **JSONB Usage**: Complex objects like `user_details` and `items` are stored as JSONB for flexibility, allowing for varying item attributes (like custom sizes).

## Auth & Security
- **Row Level Security (RLS)**: Should be enabled in Supabase to ensure users can only see their own invoices (via `user_id`).
- **Real-time**: Invoices table has real-time enabled so the admin dashboard updates instantly when new orders are placed.
