import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import {build} from 'esbuild';
const sql=new DatabaseSync(':memory:');
sql.exec('PRAGMA foreign_keys = ON');
sql.exec(readFileSync('drizzle/0000_flowery_zaran.sql','utf8'));
class Query {
 constructor(query,args=[]){this.query=query;this.args=args}
 bind(...args){return new Query(this.query,args)}
 async first(){return sql.prepare(this.query).get(...this.args)||null}
 async all(){return {results:sql.prepare(this.query).all(...this.args)}}
 async run(){return sql.prepare(this.query).run(...this.args)}
}
globalThis.__testEnv={OWNER_EMAIL:'owner@example.test',DB:{prepare:s=>new Query(s),batch:async queries=>{sql.exec('BEGIN');try{const result=[];for(const q of queries)result.push(await q.run());sql.exec('COMMIT');return result}catch(e){sql.exec('ROLLBACK');throw e}}}};
globalThis.__testUser=null;
const plugin={name:'shop-test-bindings',setup(b){b.onResolve({filter:/^cloudflare:workers$/},()=>({path:'env',namespace:'test'}));b.onResolve({filter:/chatgpt-auth$/},()=>({path:'auth',namespace:'test'}));b.onLoad({filter:/.*/,namespace:'test'},args=>({contents:args.path==='env'?'export const env=globalThis.__testEnv;':'export async function getChatGPTUser(){return globalThis.__testUser;}',loader:'js'}));}};
mkdirSync('outputs/tests',{recursive:true});
const modules={};for(const [key,path]of Object.entries({products:'app/api/products/route.ts',orders:'app/api/orders/route.ts',adminProducts:'app/api/admin/products/route.ts',adminOrders:'app/api/admin/orders/route.ts'})){await build({entryPoints:[path],outfile:`outputs/tests/${key}.mjs`,bundle:true,format:'esm',platform:'node',plugins:[plugin]});modules[key]=await import(`../outputs/tests/${key}.mjs?run=${Date.now()}`)}
const payload=(overrides={})=>({productId:'matcha-butter',quantity:2,name:'Test visitor',contact:'@test-only',note:'Local automated test',consent:true,requestKey:crypto.randomUUID(),...overrides});
const req=(path,data,origin='https://shop.test')=>new Request('https://shop.test'+path,{method:'POST',headers:{'Content-Type':'application/json',Origin:origin},body:JSON.stringify(data)});
async function post(module,path,data){const response=await module.POST(req(path,data));return {status:response.status,...await response.json()}}
let response=await modules.products.GET();assert.equal(response.status,200);let body=await response.json();assert.equal(body.products.length,3);assert.equal(body.products.find(p=>p.id==='matcha-butter').price_sen,1000);
assert.equal((await post(modules.orders,'/api/orders',payload({quantity:0}))).status,400);
assert.equal((await modules.orders.POST(req('/api/orders',payload(),'https://other.test'))).status,403);
const data=payload({priceSen:1,totalSen:1});const first=await post(modules.orders,'/api/orders',data);assert.equal(first.status,201);assert.equal(first.order.totalSen,2000);assert.equal(first.order.status,'waitlist');
const repeat=await post(modules.orders,'/api/orders',data);assert.equal(repeat.order.id,first.order.id);assert.equal(sql.prepare('SELECT COUNT(*) AS n FROM orders').get().n,1);
assert.equal((await post(modules.orders,'/api/orders',{...data,quantity:3})).status,409);
assert.equal((await modules.adminOrders.GET()).status,403);assert.equal((await modules.adminProducts.GET()).status,403);assert.equal((await post(modules.adminProducts,'/api/admin/products',{})).status,403);
globalThis.__testUser={email:'visitor@example.test',userId:'visitor'};assert.equal((await modules.adminOrders.GET()).status,403);
globalThis.__testUser={email:'owner@example.test',userId:'owner'};
const product={id:'matcha-butter',name:'Matcha butter spread',description:'Test description',priceSen:1000,image:'/assets/matcha-butter-mockup.png',status:'available',stock:2};
assert.equal((await post(modules.adminProducts,'/api/admin/products',product)).status,200);
const a=await post(modules.orders,'/api/orders',payload({contact:'@buyer-a'}));assert.equal(a.status,201);assert.equal(a.order.status,'pending');
const b=await post(modules.orders,'/api/orders',payload({contact:'@buyer-b'}));assert.equal(b.status,409);assert.equal(sql.prepare('SELECT stock FROM products WHERE id=?').get('matcha-butter').stock,0);
assert.equal((await post(modules.adminOrders,'/api/admin/orders',{id:a.order.id,status:'cancelled'})).status,200);assert.equal(sql.prepare('SELECT stock FROM products WHERE id=?').get('matcha-butter').stock,2);
assert.equal((await post(modules.adminOrders,'/api/admin/orders',{id:a.order.id,status:'cancelled'})).status,409);assert.equal(sql.prepare('SELECT stock FROM products WHERE id=?').get('matcha-butter').stock,2);
assert.equal((await post(modules.adminProducts,'/api/admin/products',{...product,stock:1})).status,200);
assert.equal((await post(modules.adminOrders,'/api/admin/orders',{id:first.order.id,status:'pending'})).status,409);
assert.equal((await post(modules.adminProducts,'/api/admin/products',product)).status,200);
assert.equal((await post(modules.adminOrders,'/api/admin/orders',{id:first.order.id,status:'pending'})).status,200);assert.equal(sql.prepare('SELECT stock FROM products WHERE id=?').get('matcha-butter').stock,0);
assert.equal((await post(modules.adminOrders,'/api/admin/orders',{id:first.order.id,status:'confirmed'})).status,200);
assert.equal((await post(modules.adminOrders,'/api/admin/orders',{id:first.order.id,status:'fulfilled'})).status,200);
assert.equal((await post(modules.adminOrders,'/api/admin/orders',{id:first.order.id,status:'cancelled'})).status,409);
assert.equal((await post(modules.orders,'/api/orders',payload({productId:'matcha-stickers'}))).status,409);
assert.equal((await post(modules.adminProducts,'/api/admin/products',{...product,priceSen:-1})).status,400);
assert.equal((await post(modules.adminProducts,'/api/admin/products',{...product,stock:-1})).status,400);
console.log('PASS: saved catalogue; RM10 pricing; validated requests; duplicate protection; cross-origin rejection; owner authorization; inventory limits; stock restoration; waitlist promotion; order transitions.');
sql.close();
