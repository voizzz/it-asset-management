// Edge-compatible session management using Web Crypto API

const SECRET = process.env.SESSION_SECRET || 'itam-default-session-secret-change-me-in-production-12345';

async function getHmacKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(SECRET);
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(payload: any): Promise<string> {
  const payloadStr = JSON.stringify(payload);
  const encoder = new TextEncoder();
  const data = encoder.encode(payloadStr);
  const key = await getHmacKey();
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
    
  const payloadBase64 = btoa(payloadStr);
  return `${payloadBase64}.${signatureHex}`;
}

export async function verifySession(token: string): Promise<any | null> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    
    const [payloadBase64, signatureHex] = parts;
    const payloadStr = atob(payloadBase64);
    const encoder = new TextEncoder();
    const data = encoder.encode(payloadStr);
    const key = await getHmacKey();
    
    const sigMatches = signatureHex.match(/.{1,2}/g);
    if (!sigMatches) return null;
    const sigBytes = new Uint8Array(sigMatches.map(byte => parseInt(byte, 16)));
    
    const isValid = await crypto.subtle.verify('HMAC', key, sigBytes, data);
    if (!isValid) return null;
    
    const payload = JSON.parse(payloadStr);
    if (payload.expiresAt && Date.now() > payload.expiresAt) {
      return null;
    }
    
    return payload;
  } catch (e) {
    return null;
  }
}
