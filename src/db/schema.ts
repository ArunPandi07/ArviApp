import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const dbSchema = appSchema({
  version: 1,
  tables: [
    // ── Bills ──────────────────────────────────────────────────────
    tableSchema({
      name: 'bills',
      columns: [
        { name: 'shop_id',        type: 'string' },
        { name: 'customer_name',  type: 'string' },
        { name: 'customer_phone', type: 'string', isOptional: true },
        { name: 'total_amount',   type: 'number' },
        { name: 'items_count',    type: 'number' },
        { name: 'created_at',     type: 'number' },   // unix timestamp ms
        { name: 'is_synced',      type: 'boolean' },
      ],
    }),

    // ── Bill Items ─────────────────────────────────────────────────
    tableSchema({
      name: 'bill_items',
      columns: [
        { name: 'bill_id',      type: 'string' },
        { name: 'product_name', type: 'string' },
        { name: 'qty',          type: 'number' },
        { name: 'unit_price',   type: 'number' },
        { name: 'total_price',  type: 'number' },
      ],
    }),

    // ── Products (Inventory) ───────────────────────────────────────
    tableSchema({
      name: 'products',
      columns: [
        { name: 'shop_id',   type: 'string' },
        { name: 'name',      type: 'string' },
        { name: 'price',     type: 'number' },
        { name: 'stock_qty', type: 'number' },
        { name: 'category',  type: 'string', isOptional: true },
        { name: 'is_synced', type: 'boolean' },
      ],
    }),
  ],
});
