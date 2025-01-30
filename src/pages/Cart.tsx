import React, { useState } from 'react';
import { Trash2, Receipt } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Cart() {
  const { items, removeItem, updateQuantity, clearCart, total, subtotal, tax } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customerEmail, setCustomerEmail] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    const product = items.find(item => item.product.id === productId)?.product;
    if (product && newQuantity <= product.stock_quantity) {
      updateQuantity(productId, newQuantity);
    } else {
      toast.error('Quantity exceeds available stock');
    }
  };

  const handleCheckout = async () => {
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setProcessing(true);
    try {
      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          total,
          tax,
          subtotal,
          customer_email: customerEmail || null,
          created_by: user!.id
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

      toast.success('Transaction completed successfully');
      clearCart();
      navigate('/transactions');
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error('Failed to process transaction');
    } finally {
      setProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-xl text-gray-600 mb-4">Your cart is empty</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Browse Products
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Shopping Cart</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="space-y-4">
          {items.map(item => (
            <div key={item.product.id} className="flex items-center justify-between py-4 border-b">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{item.product.name}</h3>
                <p className="text-sm text-gray-500">SKU: {item.product.sku}</p>
              </div>
              <div className="flex items-center space-x-4">
                <p className="text-lg font-semibold text-gray-900">
                  ${(item.product.price * item.quantity).toFixed(2)}
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                    className="px-2 py-1 text-gray-600 hover:text-gray-900"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(item.product.id, parseInt(e.target.value) || 1)}
                    className="w-16 text-center border rounded-md"
                  />
                  <button
                    onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                    className="px-2 py-1 text-gray-600 hover:text-gray-900"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.product.id)}
                  className="text-gray-500 hover:text-red-600"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Tax (8%)</span>
            <span>${tax.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xl font-bold text-gray-900 pt-2 border-t">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Customer Email (optional)
          </label>
          <input
            type="email"
            id="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="customer@example.com"
          />
        </div>
      </div>

      <div className="flex justify-between items-center">
        <button
          onClick={clearCart}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Clear Cart
        </button>
        <button
          onClick={handleCheckout}
          disabled={processing || items.length === 0}
          className={`flex items-center px-6 py-3 rounded-md ${
            processing || items.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-700'
          } text-white transition-colors`}
        >
          {processing ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : (
            <>
              <Receipt size={20} className="mr-2" />
              Complete Purchase
            </>
          )}
        </button>
      </div>
    </div>
  );
}