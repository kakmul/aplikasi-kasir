import React from 'react';
import Barcode from 'react-barcode';
import { Transaction } from '../types';

interface ReceiptProps {
  transaction: Transaction;
}

const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ transaction }, ref) => {
  return (
    <div ref={ref} className="bg-white p-8 max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold">POS System</h1>
        <p className="text-sm text-gray-600">123 Main Street</p>
        <p className="text-sm text-gray-600">City, State 12345</p>
        <p className="text-sm text-gray-600">Tel: (555) 123-4567</p>
      </div>

      <div className="mb-6">
        <p className="text-sm">Date: {new Date(transaction.created_at).toLocaleString()}</p>
        <p className="text-sm">Transaction ID: {transaction.id}</p>
        {transaction.customer_email && (
          <p className="text-sm">Customer: {transaction.customer_email}</p>
        )}
      </div>

      <div className="border-t border-b border-gray-200 py-4 mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Item</th>
              <th className="text-center py-2">Qty</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map(item => (
              <tr key={item.id}>
                <td className="py-2">{item.product?.name}</td>
                <td className="text-center py-2">{item.quantity}</td>
                <td className="text-right py-2">${item.price_at_time.toFixed(2)}</td>
                <td className="text-right py-2">
                  ${(item.price_at_time * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-2 mb-6">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${transaction.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>${transaction.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>Total</span>
          <span>${transaction.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="text-center">
        <Barcode value={transaction.id} width={1.5} height={50} fontSize={12} />
        <p className="text-sm text-gray-600 mt-4">Thank you for your business!</p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;