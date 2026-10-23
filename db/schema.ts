import { sqliteTable, text, integer, uniqueIndex } from 'drizzle-orm/sqlite-core';
export const products = sqliteTable('products', {
 id: text('id').primaryKey(), name: text('name').notNull(), description: text('description').notNull(),
 priceSen: integer('price_sen'), image: text('image').notNull(), status: text('status').notNull(), stock: integer('stock').notNull().default(0),
 createdAt: integer('created_at').notNull(), updatedAt: integer('updated_at').notNull(),
});
export const orders = sqliteTable('orders', {
 id: text('id').primaryKey(), requestKey: text('request_key').notNull(), productId: text('product_id').notNull().references(()=>products.id),
 productName: text('product_name').notNull(), quantity: integer('quantity').notNull(), unitPriceSen: integer('unit_price_sen').notNull(),totalSen: integer('total_sen').notNull(),
 name: text('name').notNull(),contact: text('contact').notNull(),note:text('note').notNull().default(''),status:text('status').notNull(),createdAt:integer('created_at').notNull(),updatedAt:integer('updated_at').notNull(),
},(table)=>[uniqueIndex('orders_request_key_unique').on(table.requestKey)]);
