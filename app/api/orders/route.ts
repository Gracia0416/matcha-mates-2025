import { body,clean,db,reply,sameOrigin,catalogue } from '../../../lib/shop';
export async function POST(request:Request){
 if(!sameOrigin(request))return reply({error:'Please submit your request from this website.'},403);
 try{
 const input=await body(request);if(input.website)return reply({error:'Unable to submit this request.'},400);
 const name=clean(input.name,80),contact=clean(input.contact,120),note=clean(input.note,600),key=clean(input.requestKey,64),productId=clean(input.productId,80);const qty=input.quantity;
 if(!name||name.length<2||contact.length<3||!Number.isInteger(qty)||qty<1||qty>10||input.consent!==true||!/^[-a-zA-Z0-9]{20,64}$/.test(key))return reply({error:'Please add your name, a contact, a quantity from 1 to 10, and permission to contact you.'},400);
 await catalogue();
 const existing=await db().prepare('SELECT id,product_id,name,contact,quantity,total_sen,status FROM orders WHERE request_key=?').bind(key).first<any>();
 if(existing){if(existing.product_id!==productId||existing.name!==name||existing.contact!==contact||existing.quantity!==qty)return reply({error:'This request key has already been used. Refresh the form to start again.'},409);return reply({order:{id:existing.id,totalSen:existing.total_sen,status:existing.status}});}
 const recent=await db().prepare('SELECT COUNT(*) AS n FROM orders WHERE contact=? AND created_at>?').bind(contact,Date.now()-3600000).first<any>();if(recent?.n>=5)return reply({error:'We have your recent requests. Please message us on Instagram for changes.'},429);
 const id=crypto.randomUUID(),now=Date.now();
 await db().batch([
 db().prepare(`INSERT INTO orders (id,request_key,product_id,product_name,quantity,unit_price_sen,total_sen,name,contact,note,status,created_at,updated_at)
 SELECT ?,?,id,name,?,price_sen,price_sen*?,?,?, ?,CASE WHEN status='coming_soon' THEN 'waitlist' ELSE 'pending' END,?,? FROM products
 WHERE id=? AND price_sen IS NOT NULL AND price_sen>=0 AND (status='coming_soon' OR (status='available' AND stock>=?)) ON CONFLICT(request_key) DO NOTHING`).bind(id,key,qty,qty,name,contact,note,now,now,productId,qty),
 db().prepare("UPDATE products SET stock=stock-?,updated_at=? WHERE id=? AND changes()>0 AND EXISTS(SELECT 1 FROM orders WHERE id=? AND status='pending')").bind(qty,now,productId,id),
 ]);
 const order=await db().prepare('SELECT id,total_sen,status FROM orders WHERE request_key=?').bind(key).first<any>();
 if(!order)return reply({error:'This item is no longer available in that quantity. Please refresh the product listing.'},409);
 return reply({order:{id:order.id,totalSen:order.total_sen,status:order.status}},201);
 }catch{return reply({error:'Your request could not be saved. Please try again; the same request will not create a duplicate.'},500);}
}
