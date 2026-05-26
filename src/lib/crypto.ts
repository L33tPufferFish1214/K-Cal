function bytesToBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

function base64ToBytes(value: string): Uint8Array {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

async function sha256(bytes: Uint8Array): Promise<string> {
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return bytesToBase64(new Uint8Array(digest));
}

export async function createPinHash(pin: string): Promise<{ pinHash: string; pinSalt: string }> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const pinBytes = new TextEncoder().encode(pin);
  const combined = new Uint8Array(salt.length + pinBytes.length);
  combined.set(salt);
  combined.set(pinBytes, salt.length);

  return {
    pinHash: await sha256(combined),
    pinSalt: bytesToBase64(salt)
  };
}

export async function verifyPin(pin: string, pinHash: string, pinSalt: string): Promise<boolean> {
  const salt = base64ToBytes(pinSalt);
  const pinBytes = new TextEncoder().encode(pin);
  const combined = new Uint8Array(salt.length + pinBytes.length);
  combined.set(salt);
  combined.set(pinBytes, salt.length);

  return (await sha256(combined)) === pinHash;
}
