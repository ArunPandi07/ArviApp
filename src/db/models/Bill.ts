import { Model } from '@nozbe/watermelondb';
import { field, date, readonly } from '@nozbe/watermelondb/decorators';

export default class Bill extends Model {
  static table = 'bills';

  @field('shop_id')        shopId!: string;
  @field('customer_name')  customerName!: string;
  @field('customer_phone') customerPhone!: string;
  @field('total_amount')   totalAmount!: number;
  @field('items_count')    itemsCount!: number;
  @field('created_at')     createdAt!: number;
  @field('is_synced')      isSynced!: boolean;
}
