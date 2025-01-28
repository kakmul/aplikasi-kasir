import React, { useEffect, useState } from 'react';
import { Plus, Search, Scan } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Product } from '../types';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import Barcode from 'react-barcode';
import BarcodeScanner from '../components/BarcodeScanner';
import { useReactToPrint } from 'react-to-print';
import Receipt from '../components/Receipt';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);
  const [cashAmount, setCashAmount] = useState<number>(0);
  const { items, addItem, removeItem, updateQuantity, clearCart, total, subtotal, tax } = useCart();
  const receiptRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      setProducts(data || []);
      const uniqueCategories = [...new Set(data?.map(p => p.category) || [])];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  }

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleAddToCart = (product: Product) => {
    if (product.stock_quantity > 0) {
      addItem(product, 1);
      toast.success(`Added ${product.name} to cart`);
    } else {
      toast.error('Product out of stock');
    }
  };

  const handleScan = (sku: string) => {
    const product = products.find(p => p.sku === sku);
    if (product) {
      handleAddToCart(product);
    } else {
      toast.error('Product not found');
    }
    setShowScanner(false);
  };

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
  });

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (cashAmount < total) {
      toast.error('Insufficient cash amount');
      return;
    }

    try {
      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          total,
          tax,
          subtotal,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create transaction items
      const transactionItems = items.map(item => ({
        transaction_id: transaction.id,
        product_id: item.product.id,
        quantity: item.quantity,
        price_at_time: item.product.price
      }));

      const { error: itemsError } = await supabase
        .from('transaction_items')
        .insert(transactionItems);

      if (itemsError) throw itemsError;

      // Update product stock
      for (const item of items) {
        const { error: stockError } = await supabase
          .from('products')
          .update({ 
            stock_quantity: item.product.stock_quantity - item.quantity 
          })
          .eq('id', item.product.id);

        if (stockError) throw stockError;
      }

      handlePrint();
      clearCart();
      setCashAmount(0);
      toast.success('Transaction completed successfully');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process transaction');
    }
  };

  const quickCashButtons = [2000, 5000, 10000, 20000, 50000, 100000];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] gap-6">
      {/* Left side - Products */}
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-gray-50 z-10 pb-4">
          <div className="flex justify-between items-center mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <button
                onClick={() => setShowScanner(true)}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                <Scan size={20} className="mr-2" />
                Scan
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map(product => (
            <div
              key={product.id}
              onClick={() => handleAddToCart(product)}
              className="bg-white rounded-lg shadow-md p-4 cursor-pointer hover:shadow-lg transition-shadow"
            >
              <img
                src={product.image_url || `https://via.placeholder.com/200x200?text=${encodeURIComponent(product.name)}`}
                alt={product.name}
                className="w-full h-40 object-cover rounded-md mb-4"
              />
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-500">SKU: {product.sku}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="font-bold text-gray-900">Rp. {product.price.toLocaleString()}</p>
                <p className={`text-sm ${product.stock_quantity > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {product.stock_quantity} left
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right side - Cart */}
      <div className="w-96 bg-white shadow-lg p-6 overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Cart</h2>
        
        <div className="space-y-4 mb-6">
          {items.map(item => (
            <div key={item.product.id} className="flex items-center gap-4">
              <img
                src={item.product.image_url || `https://via.placeholder.com/50x50?text=${encodeURIComponent(item.product.name)}`}
                alt={item.product.name}
                className="w-12 h-12 object-cover rounded-md"
              />
              <div className="flex-1">
                <h3 className="font-medium">{item.product.name}</h3>
                <p className="text-sm text-gray-500">Rp. {item.product.price.toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md"
                >
                  -
                </button>
                <span className="w-8 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                  className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-md"
                >
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>Rp. {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax (10%)</span>
            <span>Rp. {tax.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-xl font-bold">
            <span>Total</span>
            <span>Rp. {total.toLocaleString()}</span>
          </div>
        </div>

        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cash Amount
          </label>
          <input
            type="number"
            value={cashAmount}
            onChange={(e) => setCashAmount(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
          />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {quickCashButtons.map(amount => (
              <button
                key={amount}
                onClick={() => setCashAmount(prev => prev + amount)}
                className="px-2 py-1 bg-gray-100 rounded-md text-sm"
              >
                +{amount.toLocaleString()}
              </button>
            ))}
          </div>
          {cashAmount > 0 && (
            <div className="mt-4 text-right">
              <p className={`text-lg font-bold ${cashAmount >= total ? 'text-green-600' : 'text-red-600'}`}>
                Change: Rp. {Math.max(cashAmount - total, 0).toLocaleString()}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={items.length === 0 || cashAmount < total}
          className={`w-full mt-6 py-3 rounded-md text-white font-medium ${
            items.length === 0 || cashAmount < total
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          }`}
        >
          Complete Transaction
        </button>
      </div>

      {showScanner && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setShowScanner(false)}
        />
      )}

      <div className="hidden">
        <Receipt
          ref={receiptRef}
          transaction={{
            id: 'temp',
            total,
            tax,
            subtotal,
            items: items.map(item => ({
              id: item.product.id,
              transaction_id: 'temp',
              product_id: item.product.id,
              quantity: item.quantity,
              price_at_time: item.product.price,
              created_at: new Date().toISOString(),
              product: item.product
            })),
            created_at: new Date().toISOString(),
            created_by: 'temp'
          }}
        />
      </div>
    </div>
  );
}
