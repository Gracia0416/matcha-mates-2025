import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
export function db():D1Database {const binding=(env as any).DB;if(!binding)throw new Error('The shop database is not connected.');return binding;}
export function reply(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}})}
export function sameOrigin(request:Request){return request.headers.get('origin')===new URL(request.url).origin;}
export async function isOwner(){const user=await getChatGPTUser();const owner=(env as any).OWNER_EMAIL;return !!user&&!!owner&&user.email.toLowerCase()===owner.toLowerCase();}
export async function catalogue(){const now=Date.now();await db().batch([
 db().prepare('INSERT OR IGNORE INTO products (id,name,description,price_sen,image,status,stock,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind('matcha-butter','Matcha butter spread','A little matcha for your toast. Our first recipe is being tested — join the first-batch list and we will contact you when it is ready.',1000,'/assets/matcha-butter-mockup.png','coming_soon',0,now,now),
 db().prepare('INSERT OR IGNORE INTO products (id,name,description,price_sen,image,status,stock,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind('matcha-charms','Matcha charms','Tiny matcha things to take with you. Coming soon.',null,'/assets/charm-inspiration.png','coming_soon',0,now,now),
 db().prepare('INSERT OR IGNORE INTO products (id,name,description,price_sen,image,status,stock,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind('matcha-stickers','Matcha Mates stickers','A little matcha for your notebook, bottle, or wherever you like. Our sticker collection is up for sale — message us to choose your stickers and check the price.',null,'/assets/stickers-20.png','available',0,now,now),
]);}
export function clean(value:unknown,max:number){return typeof value==='string'?value.trim().slice(0,max):'';}
export async function body(request:Request){if(!request.headers.get('content-type')?.includes('application/json'))throw new Error('Please use the shop form.');const text=await request.text();if(text.length>8000)throw new Error('The request is too large.');return JSON.parse(text);}
