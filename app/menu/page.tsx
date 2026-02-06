import React from 'react';
import Menu from './components/menu';
import ProtectedRoute from '@/components/ProtectedRoute';

function MenuPage() {
  return (
    <ProtectedRoute>
      <main className="min-h-screen">
        <div className="flex flex-wrap justify-center gap-6 pt-8 font-grimpt-brush text-white text-7xl">
          Menu
        </div>
        <div className="relative w-full h-1 mb-8">
          <div className="absolute inset-0 bg-gray-100 h-full w-full" style={{ maskImage: 'linear-gradient(to right, transparent, black, black, transparent)', WebkitMaskImage: 'linear-gradient(to right, transparent, black, black, transparent)' }}></div>
        </div>
        <Menu />
      </main>
    </ProtectedRoute>
  );
}

export default MenuPage;