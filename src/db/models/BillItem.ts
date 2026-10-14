import { Model } from '@nozbe/watermelondb';
import { field } from '@nozbe/watermelondb/decorators';

export default class BillItem extends Model {
  static table = 'bill_items';

  @field('bill_id')      billId!: string;
  @field('product_name') productName!: string;
  @field('qty')          qty!: number;
  @field('unit_price')   unitPrice!: number;
  @field('total_price')  totalPrice!: number;
}
