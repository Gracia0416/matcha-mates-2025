'use client';
import {usePathname} from 'next/navigation';
export default function Header(){const path=usePathname();return <header><a className="brand" href="/" aria-label="Matcha Mates home"><img src="/assets/logo.png" alt="Matcha Mates" width="191" height="93"/></a><nav aria-label="Main navigation">{[['/','about us'],['/menu','menu'],['/creatives','creatives']].map(([url,name])=><a key={url} href={url} aria-current={path===url?'page':undefined}>{name}</a>)}<a href="https://www.instagram.com/matcha__mates/" target="_blank" rel="noopener noreferrer">contact us</a></nav></header>}
