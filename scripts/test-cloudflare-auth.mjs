import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';
import { build } from 'esbuild';
import { generateKeyPair, exportJWK, SignJWT } from 'jose';

const { publicKey, privateKey } = await generateKeyPair('RS256');
globalThis.__accessKeys = { keys: [{ ...await exportJWK(publicKey), kid: 'test-key' }] };
globalThis.__accessEnv = { CF_ACCESS_TEAM_DOMAIN: 'https://matcha-test.cloudflareaccess.com', CF_ACCESS_AUD: 'shop-admin', OWNER_EMAIL: 'owner@example.test' };
globalThis.__accessHeaders = new Headers();
mkdirSync('outputs/tests', { recursive: true });
await build({ entryPoints: ['lib/cloudflare-auth.ts'], outfile: 'outputs/tests/access.mjs', bundle: true, format: 'esm', platform: 'node', plugins: [{ name: 'auth-test', setup(b) {
  b.onResolve({ filter: /^(cloudflare:workers|next\/headers|next\/navigation)$/ }, a => ({ path: a.path, namespace: 'auth-test' }));
  b.onLoad({ filter: /.*/, namespace: 'auth-test' }, a => ({ contents: a.path === 'cloudflare:workers' ? 'export const env=globalThis.__accessEnv;' : a.path === 'next/headers' ? 'export async function headers(){return globalThis.__accessHeaders;}' : 'export function redirect(){throw new Error("redirect");}', loader: 'js' }));
  b.onResolve({ filter: /^jose$/, namespace: 'file' }, () => ({ path: 'jose-wrapper', namespace: 'auth-test-jose' }));
  b.onLoad({ filter: /.*/, namespace: 'auth-test-jose' }, () => ({ contents: 'import {jwtVerify,createLocalJWKSet} from "jose"; export {jwtVerify}; export function createRemoteJWKSet(){return createLocalJWKSet(globalThis.__accessKeys);}', loader: 'js', resolveDir: process.cwd() }));
} }] });
const { getChatGPTUser } = await import('../outputs/tests/access.mjs');
const token = (claims = {}, opts = {}) => new SignJWT({ email: 'owner@example.test', ...claims }).setProtectedHeader({ alg: 'RS256', kid: 'test-key' }).setIssuer(opts.issuer || globalThis.__accessEnv.CF_ACCESS_TEAM_DOMAIN).setAudience(opts.audience || 'shop-admin').setSubject('owner').setIssuedAt().setExpirationTime(opts.expires || '5m').sign(privateKey);
async function user(jwt) { globalThis.__accessHeaders = new Headers(jwt ? { 'cf-access-jwt-assertion': jwt } : {}); return getChatGPTUser(); }
assert.equal(await user(), null);
globalThis.__accessHeaders = new Headers({ 'oai-authenticated-user-id': 'spoofed', 'oai-authenticated-user-email': 'owner@example.test' });
assert.equal(await getChatGPTUser(), null);
assert.equal((await user(await token())).email, 'owner@example.test');
assert.equal(await user(await token({ email: 'someone@example.test' })), null);
assert.equal(await user(await token({}, { audience: 'other-app' })), null);
assert.equal(await user(await token({}, { issuer: 'https://other.cloudflareaccess.com' })), null);
assert.equal(await user(await token({}, { expires: '1s ago' })), null);
assert.equal(await user('forged.jwt.token'), null);
globalThis.__accessEnv.CF_ACCESS_AUD = '';
assert.equal(await user(await token()), null);
console.log('PASS: Cloudflare owner login; missing, forged, expired, wrong-owner, wrong-audience and wrong-issuer tokens rejected; OpenAI headers rejected; missing settings fail closed.');
