/*
  # Point of Sale System Schema

  1. New Tables
    - `products`
      - `id` (uuid, primary key)
      - `name` (text)
      - `price` (decimal)
      - `sku` (text, unique)
      - `category` (text)
      - `stock_quantity` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `transactions`
      - `id` (uuid, primary key)
      - `total` (decimal)
      - `tax` (decimal)
      - `subtotal` (decimal)
      - `customer_email` (text, nullable)
      - `created_at` (timestamp)
      - `created_by` (uuid, references auth.users)
    
    - `transaction_items`
      - `id` (uuid, primary key)
      - `transaction_id` (uuid, references transactions)
      - `product_id` (uuid, references products)
      - `quantity` (integer)
      - `price_at_time` (decimal)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2) NOT NULL CHECK (price >= 0),
  sku text UNIQUE NOT NULL,
  category text NOT NULL,
  stock_quantity integer NOT NULL DEFAULT 0 CHECK (stock_quantity >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  total decimal(10,2) NOT NULL CHECK (total >= 0),
  tax decimal(10,2) NOT NULL CHECK (tax >= 0),
  subtotal decimal(10,2) NOT NULL CHECK (subtotal >= 0),
  customer_email text,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users NOT NULL
);

-- Transaction Items Table
CREATE TABLE IF NOT EXISTS transaction_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES transactions ON DELETE CASCADE NOT NULL,
  product_id uuid REFERENCES products NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_time decimal(10,2) NOT NULL CHECK (price_at_time >= 0),
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow authenticated users to read products"
  ON products FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to read their transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (created_by = auth.uid());

CREATE POLICY "Allow authenticated users to insert transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow authenticated users to read transaction items"
  ON transaction_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM transactions 
    WHERE transactions.id = transaction_items.transaction_id 
    AND transactions.created_by = auth.uid()
  ));

CREATE POLICY "Allow authenticated users to insert transaction items"
  ON transaction_items FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM transactions 
    WHERE transactions.id = transaction_items.transaction_id 
    AND transactions.created_by = auth.uid()
  ));
