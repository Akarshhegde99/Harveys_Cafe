# API Usage Guide - Harvey's Cafe

This document outlines the API endpoints available in the Harvey's Cafe Pre-ordering System.

## Base URL
All API routes are relative to the application's root URL: `/api/...`

---

## 1. Create Razorpay Order
Starts the payment process by creating an order in Razorpay's system.

- **URL**: `/api/create-order`
- **Method**: `POST`
- **Auth Required**: No

### Request Body
```json
{
  "amount": 500.50,
  "currency": "INR", // Optional, defaults to INR
  "items": [...],
  "visitTime": "2024-05-20T18:00:00Z",
  "userDetails": {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+919876543210"
  }
}
```

### Success Response
- **Code**: `200 OK`
- **Content**:
  ```json
  {
    "orderId": "order_NXyz123",
    "amount": 50050,
    "currency": "INR"
  }
  ```

---

## 2. Submit Order Request (Pending Admin Approval)
Creates a database entry for a new order that requires admin approval before payment.

- **URL**: `/api/create-order-request`
- **Method**: `POST`
- **Auth Required**: Recommended (Customer)

### Request Body
```json
{
  "items": [...],
  "userDetails": { "name": "...", "email": "...", "phone": "..." },
  "visitTime": "...",
  "subtotal": 1000,
  "advanceAmount": 500,
  "remainingAmount": 500,
  "totalAmount": 1000
}
```

### Success Response
- **Code**: `200 OK`
- **Content**:
  ```json
  {
    "success": true,
    "order": { ... },
    "message": "Order request created successfully. Waiting for admin approval."
  }
  ```

---

## 3. Verify Razorpay Payment
Verifies the signature from Razorpay after a successful transaction and updates the order status.

- **URL**: `/api/verify-payment`
- **Method**: `POST`
- **Auth Required**: No

### Request Body
```json
{
  "orderId": "order_NXyz123",
  "paymentId": "pay_ABC123",
  "signature": "razorpay_signature_here",
  "visitTime": "...",
  "items": [...],
  "userDetails": { ... }
}
```

### Success Response
- **Code**: `200 OK`
- **Content**:
  ```json
  {
    "success": true,
    "orderId": "...",
    "paymentId": "...",
    "invoiceId": "...",
    "invoiceNumber": "INV-20240520-001",
    "message": "Payment verified successfully"
  }
  ```

---

## 4. Invoices Management

### Get User Invoices
Retrieves all invoices associated with a specific user email.

- **URL**: `/api/invoices?userId=:email`
- **Method**: `GET`
- **Auth Required**: Yes

### Save Invoice
Manually creating an invoice entry in the database.

- **URL**: `/api/invoices`
- **Method**: `POST`
- **Auth Required**: Yes

### Request Body
```json
{
  "invoice_number": "...",
  "order_id": "...",
  "user_id": "...",
  "total_amount": 100,
  ...
}
```

---

## Error Handling
The API returns standard HTTP status codes:
- `400 Bad Request`: Missing or invalid input.
- `500 Internal Server Error`: Something went wrong on the server or with external integrations (Supabase/Razorpay).

All error responses follow this format:
```json
{
  "error": "Error message description"
}
```
