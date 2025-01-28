export interface Product {
  id: string;
  name: string;
  price: number;
  sku: string;
  category: string;
  stock_quantity: number;
  created_at: string;
  updated_at: string;
  image_url?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction {
  id: string;
  total: number;
  tax: number;
  subtotal: number;
  customer_email?: string;
  created_at: string;
  created_by: string;
  items: TransactionItem[];
}

export interface TransactionItem {
  id: string;
  transaction_id: string;
  product_id: string;
  quantity: number;
  price_at_time: number;
  created_at: string;
  product?: Product;
}
