/**
 * Header Component
 * 
 * Application header with navigation and branding.
 * 
 * @component Header
 */

import { cn } from '@/utils';
import { ShoppingBag, Menu, X } from 'lucide-react';
import { useState } from 'react';

interface HeaderProps {
  activeTab: 'list' | 'browse';
  onTabChange: (tab: 'list' | 'browse') => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-charcoal-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="bg-restylee-600 rounded-xl p-2">
              <ShoppingBag className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-charcoal-900 tracking-tight">
                Restylee
              </h1>
              <p className="text-[10px] text-charcoal-400 -mt-0.5 font-medium uppercase tracking-wider">
                Fashion Marketplace
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden sm:flex items-center gap-1 bg-charcoal-100/50 rounded-xl p-1">
            <button
              onClick={() => onTabChange('list')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === 'list'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-700'
              )}
            >
              List Item
            </button>
            <button
              onClick={() => onTabChange('browse')}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                activeTab === 'browse'
                  ? 'bg-white text-charcoal-900 shadow-sm'
                  : 'text-charcoal-500 hover:text-charcoal-700'
              )}
            >
              Browse
            </button>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="sm:hidden p-2 rounded-lg hover:bg-charcoal-100 transition-colors"
          >
            {isMobileMenuOpen ? (
              <X className="h-5 w-5 text-charcoal-700" />
            ) : (
              <Menu className="h-5 w-5 text-charcoal-700" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="sm:hidden border-t border-charcoal-100 bg-white animate-fade-in">
          <div className="px-4 py-3 space-y-1">
            <button
              onClick={() => {
                onTabChange('list');
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                activeTab === 'list'
                  ? 'bg-restylee-50 text-restylee-700'
                  : 'text-charcoal-600 hover:bg-charcoal-50'
              )}
            >
              List Item
            </button>
            <button
              onClick={() => {
                onTabChange('browse');
                setIsMobileMenuOpen(false);
              }}
              className={cn(
                'w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-colors',
                activeTab === 'browse'
                  ? 'bg-restylee-50 text-restylee-700'
                  : 'text-charcoal-600 hover:bg-charcoal-50'
              )}
            >
              Browse
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
