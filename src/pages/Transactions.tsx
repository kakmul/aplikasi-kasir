import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Transaction } from '../types';
import { useAuth } from '../context/AuthContext';
import { ChevronDown, ChevronUp, Printer, BarChart2, Calendar } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import Receipt from '../components/Receipt';

interface TransactionStats {
  totalSales: number;
  totalTransactions: number;
  averageTransactionValue: number;
  topProducts: {
    name: string;
    quantity: number;
    revenue: number;
  }[];
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTransaction, setExpandedTransaction] = useState<string | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showReport, setShowReport] = useState(false);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'all'>('all');
  const [stats, setStats] = useState<TransactionStats>({
    totalSales: 0,
    totalTransactions: 0,
    averageTransactionValue: 0,
    topProducts: []
  });
  const { user } = useAuth();
  const receiptRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTransactions();
  }, [dateRange]);

  async function fetchTransactions() {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          items:transaction_items(
            *,
            product:products(*)
          )
        `)
        .order('created_at', { ascending: false });

      // Apply date filters
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      if (dateRange === 'today') {
        query = query.gte('created_at', startOfDay);
      } else if (dateRange === 'week') {
        query = query.gte('created_at', startOfWeek);
      } else if (dateRange === 'month') {
        query = query.gte('created_at', startOfMonth);
      }

      const { data: transactionsData, error: transactionsError } = await query;

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);
      
      // Calculate statistics
      if (transactionsData) {
        const totalSales = transactionsData.reduce((sum, t) => sum + t.total, 0);
        const averageValue = totalSales / transactionsData.length || 0;

        // Calculate top products
        const productMap = new Map();
        transactionsData.forEach(transaction => {
          transaction.items.forEach(item => {
            const existing = productMap.get(item.product?.id) || {
              name: item.product?.name,
              quantity: 0,
              revenue: 0
            };
            existing.quantity += item.quantity;
            existing.revenue += item.price_at_time * item.quantity;
            productMap.set(item.product?.id, existing);
          });
        });

        const topProducts = Array.from(productMap.values())
          .sort((a, b) => b.revenue - a.revenue)
          .slice(0, 5);

        setStats({
          totalSales,
          totalTransactions: transactionsData.length,
          averageTransactionValue: averageValue,
          topProducts
        });
      }
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <button
          onClick={() => setShowReport(!showReport)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <BarChart2 size={20} className="mr-2" />
          {showReport ? 'Hide Report' : 'Show Report'}
        </button>
      </div>

      {showReport && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Transaction Report</h2>
            <div className="flex gap-2">
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalSales.toFixed(2)}
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalTransactions}
              </p>
            </div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500">Average Transaction</h3>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.averageTransactionValue.toFixed(2)}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Top Products</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity Sold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Revenue
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.topProducts.map((product, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {product.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${product.revenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
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