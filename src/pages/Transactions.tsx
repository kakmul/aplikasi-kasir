import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, ChevronUp, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Receipt from '../components/Receipt';

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const { user } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    try {
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select(`
          *,
          items:transaction_items(
            *,
            product:products(*)
          )
        `)
        .order('created_at', { ascending: false });

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = useReactToPrint({
    content: () => receiptRef.current,
    onAfterPrint: () => setSelectedTransaction(null),
  });

  const toggleTransaction = (transactionId: string) => {
    setExpandedTransaction(expandedTransaction === transactionId ? null : transactionId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
      
      <div className="space-y-4">
        {transactions.map(transaction => (
          <div key={transaction.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            <div
              className="flex justify-between items-center p-6 cursor-pointer hover:bg-gray-50"
              onClick={() => toggleTransaction(transaction.id)}
            >
              <div>
                <p className="text-sm text-gray-500">
                  {new Date(transaction.created_at).toLocaleString()}
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  ${transaction.total.toFixed(2)}
                </p>
                {transaction.customer_email && (
                  <p className="text-sm text-gray-600">
                    Customer: {transaction.customer_email}
                  </p>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTransaction(transaction);
                    setTimeout(handlePrint, 100);
                  }}
                  className="flex items-center px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  <Printer size={16} className="mr-1" />
                  Print
                </button>
                {expandedTransaction === transaction.id ? (
                  <ChevronUp size={20} className="text-gray-500" />
                ) : (
                  <ChevronDown size={20} className="text-gray-500" />
                )}
              </div>
            </div>
            
            {expandedTransaction === transaction.id && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="mt-4 space-y-4">
                  {transaction.items.map(item => (
                    <div key={item.id} className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">
                          {item.product?.name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Quantity: {item.quantity}
                        </p>
                      </div>
                      <p className="font-medium text-gray-900">
                        ${(item.price_at_time * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Subtotal</span>
                    <span>${transaction.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mt-2">
                    <span>Tax</span>
                    <span>${transaction.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-gray-900 mt-2">
                    <span>Total</span>
                    <span>${transaction.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Hidden receipt for printing */}
      <div className="hidden">
        {selectedTransaction && (
          <Receipt ref={receiptRef} transaction={selectedTransaction} />
        )}
      </div>
    </div>
  );
}
