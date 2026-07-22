/**
 * Footer Component
 * 
 * Application footer with branding and links.
 * 
 * @component Footer
 */

import { ShoppingBag, Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-charcoal-950 text-charcoal-400 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-restylee-400" />
            <span className="text-sm font-semibold text-charcoal-200">
              Restylee
            </span>
          </div>
          <p className="text-xs text-center sm:text-right">
            Made with{' '}
            <Heart className="h-3 w-3 inline text-restylee-400" /> for fashion
            lovers everywhere
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-charcoal-900 text-center">
          <p className="text-xs text-charcoal-600">
            &copy; {new Date().getFullYear()} Restylee. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
