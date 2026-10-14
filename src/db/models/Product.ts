import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class Product extends Model {
  static table = 'products';

  @field('shop_id')   shopId!: string;
  @field('name')      name!: string;
  @field('price')     price!: number;
  @field('stock_qty') stockQty!: number;
  @field('category')  category!: string;
  @field('is_synced') isSynced!: boolean;
}
