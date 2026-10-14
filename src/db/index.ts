import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';
import { dbSchema } from './schema';
import Bill from './models/Bill';
import BillItem from './models/BillItem';
import Product from './models/Product';

// ── SQLite Adapter ────────────────────────────────────────────────
const adapter = new SQLiteAdapter({
  schema: dbSchema,
  dbName: 'AIStoreDB',
  jsi: true,               // Use JSI for best performance on React Native
  onSetUpError: (error) => {
    console.error('[WatermelonDB] Setup error:', error);
  },
});

// ── Database instance (singleton) ────────────────────────────────
export const database = new Database({
  adapter,
  modelClasses: [Bill, BillItem, Product],
});

export { Bill, BillItem, Product };
