import React from 'react';
    import { Link, useLocation } from 'react-router-dom';
    import { ShoppingCart, Package, Receipt, LogOut, Settings } from 'lucide-react';
    import { useAuth } from '../context/AuthContext';
    import { useCart } from '../context/CartContext';

    export default function Navbar() {
      const { user, signOut } = useAuth();
      const { items } = useCart();
      const location = useLocation();

      if (!user) return null;

      return (
        <nav className="bg-custom-blue shadow-lg">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <Link to="/" className="text-xl font-bold text-white">Aplikasi Kasir</Link>
                <div className="hidden md:flex space-x-4">
                  <Link
                    to="/"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Package size={18} className="text-white" />
                    <span className="text-white">Products</span>
                  </Link>
                  <Link
                    to="/products/manage"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/products/manage' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-900'
                    }`}
                  >
                    <Settings size={18} className="text-white" />
                    <span className="text-white">Manage Products</span>
                  </Link>
                  <Link
                    to="/transactions"
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium ${
                      location.pathname === '/transactions' ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-900'
                    }`}
                  >
                    <Receipt size={18} className="text-white" />
                    <span className="text-white">Transactions</span>
                  </Link>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link
                  to="/cart"
                  className="relative flex items-center text-white hover:text-gray-300"
                >
                  <ShoppingCart size={24} className="text-white" />
                  {items.length > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {items.length}
                    </span>
                  )}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-white hover:bg-gray-900"
                >
                  <LogOut size={18} className="text-white" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </nav>
      );
    }
