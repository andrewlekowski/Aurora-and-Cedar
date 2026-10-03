#!/usr/bin/env node
/*
 * Makes APP_PASSWORD_HASH for the document app. Run from 4v-manutencoes/:
 *   npm run hash-password
 * It asks for the password (nothing is saved or printed except the hash).
 * Paste the output into Cloudflare → Pages → 4v-documentos → Settings → Variables and secrets
 * as an encrypted variable named APP_PASSWORD_HASH. It also prints a fresh SESSION_SECRET.
 */
import { webcrypto as crypto } from 'node:crypto';
import readline from 'node:readline';

const ITERATIONS = 100000; // Cloudflare Workers maximum
const b64 = u8 => Buffer.from(u8).toString('base64');

async function hash(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
  return `pbkdf2-sha256$${ITERATIONS}$${b64(salt)}$${b64(new Uint8Array(bits))}`;
}

function ask(q) {
  return new Promise(res => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = s => { if (s.includes(q)) rl.output.write(s); else rl.output.write('*'); };
    rl.question(q, a => { rl.close(); process.stdout.write('\n'); res(a); });
  });
}

const pw = process.env.PASSWORD || await ask('Password for Valdir: ');
if (!pw || pw.length < 8) { console.error('Use at least 8 characters (e.g. three Portuguese words).'); process.exit(1); }
console.log('\nAPP_PASSWORD_HASH=' + await hash(pw));
console.log('SESSION_SECRET=' + b64(crypto.getRandomValues(new Uint8Array(32))).replace(/=+$/, ''));
