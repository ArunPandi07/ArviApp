/**
 * API Service — FastAPI backend integration
 * Currently stubs — wire up BASE_URL when backend is ready.
 */

const BASE_URL = 'https://your-fastapi-backend.com/api'; // TODO: replace with real URL

const headers = { 'Content-Type': 'application/json' };

// ── Types ─────────────────────────────────────────────────────────
export interface ApiBill {
  shop_id: string;
  customer_name: string;
  customer_phone?: string;
  total_amount: number;
  items: {
    product_name: string;
    qty: number;
    unit_price: number;
    total_price: number;
  }[];
  created_at: number;
}

export interface ApiProduct {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  stock_qty: number;
  category?: string;
}

// ── Bills ─────────────────────────────────────────────────────────
export const syncBill = async (bill: ApiBill): Promise<{ id: string }> => {
  const res = await fetch(`${BASE_URL}/bills`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bill),
  });
  if (!res.ok) throw new Error(`Sync failed: ${res.status}`);
  return res.json();
};

export const fetchBills = async (shopId: string): Promise<ApiBill[]> => {
  const res = await fetch(`${BASE_URL}/bills?shop_id=${shopId}`, { headers });
  if (!res.ok) throw new Error(`Fetch bills failed: ${res.status}`);
  return res.json();
};

// ── Products ──────────────────────────────────────────────────────
export const fetchProducts = async (shopId: string): Promise<ApiProduct[]> => {
  const res = await fetch(`${BASE_URL}/products?shop_id=${shopId}`, { headers });
  if (!res.ok) throw new Error(`Fetch products failed: ${res.status}`);
  return res.json();
};

export const syncProduct = async (product: Omit<ApiProduct, 'id'>): Promise<{ id: string }> => {
  const res = await fetch(`${BASE_URL}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify(product),
  });
  if (!res.ok) throw new Error(`Product sync failed: ${res.status}`);
  return res.json();
};
