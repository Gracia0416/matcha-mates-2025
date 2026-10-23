import { catalogue,db,reply } from '../../../lib/shop';
export async function GET(){try{await catalogue();const {results}=await db().prepare("SELECT id,name,description,price_sen,image,status,stock FROM products WHERE status <> 'hidden' ORDER BY created_at,id").all();return reply({products:results});}catch{ return reply({error:'The shop could not load. Please try again in a moment.'},503);}}
