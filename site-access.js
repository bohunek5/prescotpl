/* Encrypted document entry. Public assets and Git history remain public. */
(() => {
  'use strict';
  const form = document.getElementById('access');
  const field = document.getElementById('password');
  const error = document.getElementById('error');
  const button = form.querySelector('button');
  const payload = JSON.parse(document.getElementById('encrypted-page').textContent);
  const storageKey = `prescotpl-access-v1:${payload.salt}`;
  const bytes = value => Uint8Array.from(atob(value), character => character.charCodeAt(0));
  const base64 = value => btoa(String.fromCharCode(...new Uint8Array(value)));

  async function openDocument(rawKey) {
    const key = await crypto.subtle.importKey('raw', rawKey, 'AES-GCM', false, ['decrypt']);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: bytes(payload.iv) }, key, bytes(payload.ciphertext)
    );
    // Only a successful authenticated decryption can open a document.
    const html = new TextDecoder('utf-8', { fatal: true }).decode(plaintext);
    try { sessionStorage.setItem(storageKey, base64(rawKey)); } catch { /* Password entry still works without storage. */ }
    field.value = '';
    // Finish parsing the entry page before replacing it during automatic session unlock.
    if (document.readyState !== 'complete') {
      await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
    }
    document.open();
    document.write(html);
    document.close();
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    button.disabled = true;
    field.removeAttribute('aria-invalid');
    error.textContent = '';
    try {
      const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(field.value), 'PBKDF2', false, ['deriveBits']);
      const rawKey = await crypto.subtle.deriveBits({
        name: 'PBKDF2', salt: bytes(payload.salt), iterations: payload.iterations, hash: 'SHA-256'
      }, material, 256);
      await openDocument(rawKey);
    } catch (failure) {
      error.textContent = failure.name === 'OperationError'
        ? 'Nieprawidłowe hasło. Spróbuj ponownie.'
        : 'Nie udało się otworzyć strony. Spróbuj ponownie.';
      field.setAttribute('aria-invalid', 'true');
      field.focus();
      field.select();
    } finally { button.disabled = false; }
  });

  let savedKey;
  try { savedKey = sessionStorage.getItem(storageKey); } catch { /* Storage is optional. */ }
  if (savedKey) {
    button.disabled = true;
    Promise.resolve().then(() => openDocument(bytes(savedKey))).catch(() => {
      try { sessionStorage.removeItem(storageKey); } catch { /* Storage is optional. */ }
      button.disabled = false;
      field.focus();
    });
  }
})();
