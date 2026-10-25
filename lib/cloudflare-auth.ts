import { env } from 'cloudflare:workers';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createRemoteJWKSet, jwtVerify } from 'jose';

type AccessSettings = { CF_ACCESS_TEAM_DOMAIN?: string; CF_ACCESS_AUD?: string; OWNER_EMAIL?: string };
export const AUTH_PROVIDER_NAME = 'Cloudflare';
export type ChatGPTUser = { userId: string; displayName: string; email: string; fullName: string | null };

// Compatibility names keep the shop API unchanged; authentication is Cloudflare-only.
export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const settings = env as AccessSettings;
  const token = (await headers()).get('cf-access-jwt-assertion');
  const domain = settings.CF_ACCESS_TEAM_DOMAIN;
  if (!token || !domain || !settings.CF_ACCESS_AUD || !settings.OWNER_EMAIL) return null;
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(domain)) return null;
  try {
    const keys = createRemoteJWKSet(new URL(`${domain}/cdn-cgi/access/certs`));
    const { payload } = await jwtVerify(token, keys, {
      issuer: domain, audience: settings.CF_ACCESS_AUD, algorithms: ['RS256'],
    });
    if (typeof payload.email !== 'string' || typeof payload.sub !== 'string' ||
        payload.email.toLowerCase() !== settings.OWNER_EMAIL.toLowerCase()) return null;
    return { userId: payload.sub, displayName: payload.email, email: payload.email, fullName: null };
  } catch { return null; }
}
export function chatGPTSignInPath(returnTo: string): string {
  return returnTo.startsWith('/') && !returnTo.startsWith('//') && !returnTo.includes('\\') ? returnTo : '/admin';
}
export function chatGPTSignOutPath(): string { return '/cdn-cgi/access/logout'; }
export async function requireChatGPTUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;
  redirect(chatGPTSignInPath(returnTo));
}
