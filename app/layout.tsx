import type {Metadata} from 'next';
import './globals.css';
import Header from './components/Header';
export const metadata:Metadata={title:'Matcha Mates',description:'A small matcha community. Our menu, matcha butter spread, and little creative things.',icons:{icon:'/assets/smile.png'}};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body><div className="shell"><Header/>{children}<footer><span className="hand">made by matcha mates.</span><a href="https://www.instagram.com/matcha__mates/" target="_blank" rel="noopener noreferrer">@matcha__mates</a><a href="/admin" className="manage">Manage shop</a></footer></div></body></html>}
