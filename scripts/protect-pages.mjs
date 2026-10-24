// In-place static HTML encryption; credentials are supplied through environment variables.
import { readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { createCipheriv, createDecipheriv, pbkdf2Sync, randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const password = process.env.PRESCOT_SITE_PASSWORD;
if (!password) throw new Error('Set PRESCOT_SITE_PASSWORD before encrypting documents.');
const previousPassword = process.env.PRESCOT_PREVIOUS_SITE_PASSWORD || password;
const salt = randomBytes(16);
const iterations = 310000;
const key = pbkdf2Sync(password, salt, iterations, 32, 'sha256');
const names = execFileSync('git', ['ls-files', '-z', '*.html'], { cwd: root, encoding: 'utf8' }).split('\0').filter(Boolean);
const encryptedPattern = /<script id="encrypted-page" type="application\/json">([^<]+)<\/script>/;

function decrypt(payload, passphrase) {
  const oldKey = pbkdf2Sync(passphrase, Buffer.from(payload.salt, 'base64'), payload.iterations, 32, 'sha256');
  const data = Buffer.from(payload.ciphertext, 'base64');
  const cipher = createDecipheriv('aes-256-gcm', oldKey, Buffer.from(payload.iv, 'base64'));
  cipher.setAuthTag(data.subarray(-16));
  return Buffer.concat([cipher.update(data.subarray(0, -16)), cipher.final()]);
}

function wrap(payload) {
  return `<!doctype html>
<html lang="pl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Dostęp do strony | PRESCOT</title><link rel="icon" href="/prescotpl/konfigurator/assets/d-pattern.svg"><link rel="stylesheet" href="/prescotpl/site-access.css?v=20261024"></head>
<body><main><img src="/prescotpl/konfigurator/assets/logo-navy.svg" alt="PRESCOT LED"><h1>Podaj hasło</h1><form id="access"><label for="password">Hasło dostępu</label><input type="password" id="password" name="password" autocomplete="current-password" required autofocus aria-describedby="error"><button type="submit">Wejdź na stronę</button><p id="error" role="status" aria-live="polite"></p></form><noscript>Włącz JavaScript, aby wpisać hasło i otworzyć stronę.</noscript><footer><a href="https://www.prescot.pl/">www.prescot.pl</a></footer></main>
<script id="encrypted-page" type="application/json">${JSON.stringify(payload)}</script><script src="/prescotpl/site-access.js?v=20261024"></script></body></html>\n`;
}

// Read and validate every source first; a failed decryption cannot leave a partial rewrite.
const documents = [];
let retained = 0;
for (const name of names) {
  const file = path.join(root, name);
  let original = await readFile(file);
  const match = original.toString('utf8').match(encryptedPattern);
  if (match) original = decrypt(JSON.parse(match[1]), previousPassword);
  if (name === 'konfigurator/index.html' && !match && original.includes(Buffer.from('unlock.js'))) {
    if (!process.env.PRESCOT_PREVIOUS_CONFIGURATOR_PASSWORD) {
      retained++;
      continue; // Preserve the separately encrypted configurator until its existing credential is available.
    }
    const oldPayload = JSON.parse(await readFile(path.join(root, 'konfigurator/protected-page.json'), 'utf8'));
    original = decrypt(oldPayload, process.env.PRESCOT_PREVIOUS_CONFIGURATOR_PASSWORD);
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(original), cipher.final(), cipher.getAuthTag()]);
  const payload = { version: 1, salt: salt.toString('base64'), iterations, iv: iv.toString('base64'), ciphertext: ciphertext.toString('base64') };
  if (!decrypt(payload, password).equals(original)) throw new Error(`Encryption verification failed: ${name}`);
  documents.push({ file, html: wrap(payload) });
}
for (const { file, html } of documents) await writeFile(file, html, 'utf8');
console.log(`Encrypted and verified ${documents.length} HTML documents.`);
if (retained) console.log(`Preserved ${retained} document with its existing separate password entry.`);
