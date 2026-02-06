import React from 'react';

const PrivacyPolicy = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Privacy Policy</h1>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">1. Introduction</h2>
          <p className="mb-4">
            Welcome to Harvey Preordering. We are committed to protecting your privacy and ensuring that your personal information is collected and used appropriately, transparently, and securely. This Privacy Policy explains how we collect, use, and disclose your personal information.
          </p>

          <h2 className="text-xl font-semibold mb-4">2. Information We Collect</h2>
          <p className="mb-4">
            We may collect the following types of personal information from you:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>Contact information, such as your name, email address, and phone number.</li>
            <li>Billing information, such as your credit card number and billing address.</li>
            <li>Order information, such as the items you have ordered and your order history.</li>
            <li>Device information, such as your IP address, browser type, and operating system.</li>
            <li>Usage information, such as how you use our website and services.</li>
          </ul>

          <h2 className="text-xl font-semibold mb-4">3. How We Use Your Information</h2>
          <p className="mb-4">
            We may use your personal information for the following purposes:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>To process your orders and payments.</li>
            <li>To communicate with you about your orders and our services.</li>
            <li>To provide you with customer support.</li>
            <li>To improve our website and services.</li>
            <li>To personalize your experience on our website.</li>
            <li>To send you marketing and promotional materials.</li>
          </ul>

          <h2 className="text-xl font-semibold mb-4">4. How We Share Your Information</h2>
          <p className="mb-4">
            We may share your personal information with the following third parties:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>Payment processors, to process your payments.</li>
            <li>Shipping and delivery companies, to deliver your orders.</li>
            <li>Marketing and advertising partners, to send you marketing and promotional materials.</li>
            <li>Law enforcement agencies, to comply with legal requirements.</li>
          </ul>

          <h2 className="text-xl font-semibold mb-4">5. Your Choices</h2>
          <p className="mb-4">
            You have the following choices regarding your personal information:
          </p>
          <ul className="list-disc list-inside mb-4">
            <li>You can opt out of receiving marketing and promotional materials from us by following the instructions in those materials.</li>
            <li>You can request to access, correct, or delete your personal information by contacting us at privacy@harveypreordering.com.</li>
          </ul>

          <h2 className="text-xl font-semibold mb-4">6. Security</h2>
          <p className="mb-4">
            We take reasonable measures to protect your personal information from unauthorized access, use, and disclosure. However, no method of transmission over the internet or method of electronic storage is 100% secure. Therefore, we cannot guarantee the absolute security of your personal information.
          </p>

          <h2 className="text-xl font-semibold mb-4">7. Changes to This Privacy Policy</h2>
          <p className="mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on our website. You are advised to review this Privacy Policy periodically for any any changes.
          </p>

          <h2 className="text-xl font-semibold mb-4">8. Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, please contact us at privacy@harveypreordering.com.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
