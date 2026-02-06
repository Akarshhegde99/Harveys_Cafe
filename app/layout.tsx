import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { PaymentProvider } from "@/context/PaymentContext";
import { InvoiceProvider } from "@/context/InvoiceContext";
import Navbar from "@/components/Navbar";
import ToastProvider from "@/components/ToastProvider";
import LayoutContent from "./components/LayoutContent";

export const metadata: Metadata = {
  title: "Harvey's Preorder",
  description: "Preorder now!",
  icons: {
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/logo.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`font-garet antialiased bg-[url('/bg.svg')] bg-cover bg-center bg-no-repeat`}
      >
        <AuthProvider>
          <CartProvider>
            <PaymentProvider>
              <InvoiceProvider>
                <LayoutContent>{children}</LayoutContent>
                <ToastProvider />
              </InvoiceProvider>
            </PaymentProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
