/**
 * App Component
 * 
 * Root application component with routing and layout.
 * 
 * @component App
 */

import { useState } from 'react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { ListProduct } from '@/pages/ListProduct';
import { BrowseProducts } from '@/pages/BrowseProducts';
import { Toaster } from 'react-hot-toast';

export default function App() {
  const [activeTab, setActiveTab] = useState<'list' | 'browse'>('list');

  return (
    <div className="min-h-screen flex flex-col bg-charcoal-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'list' ? <ListProduct /> : <BrowseProducts />}
      </main>

      <Footer />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            borderRadius: '12px',
            fontSize: '14px',
            background: '#fff',
            color: '#1a1a1a',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          },
        }}
      />
    </div>
  );
}
