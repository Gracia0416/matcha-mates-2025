import { isOwner,reply } from '../../../../lib/shop';
export async function GET(){return reply({owner:await isOwner()});}
