import {getChatGPTUser,chatGPTSignInPath,AUTH_PROVIDER_NAME} from '../chatgpt-auth';
import {isOwner} from '../../lib/shop';
import Admin from './Admin';
export const dynamic='force-dynamic';
export const metadata={title:'Manage shop | Matcha Mates',robots:{index:false,follow:false}};
export default async function AdminPage(){const user=await getChatGPTUser();if(!user)return <main className="admin-gate"><h1 className="hand">Manage your little shop.</h1><p>Sign in with the account that owns Matcha Mates.</p><a className="button" href={chatGPTSignInPath('/admin')} target="_top">Sign in with {AUTH_PROVIDER_NAME}</a></main>;if(!await isOwner())return <main className="admin-gate"><h1 className="hand">Owner access only.</h1><p>This page is for the owner of Matcha Mates.</p><a className="button" href="/creatives">Back to creatives</a></main>;return <main><div className="page-note hand">behind the little shop.</div><Admin/></main>}
