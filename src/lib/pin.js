// PIN hashing for the on-kiosk admin sign-in (Android app).
// The PIN itself is never stored, only a salted PBKDF2 hash.
const ITERATIONS = 210000;

const toHex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
const fromHex = (hex) => new Uint8Array(hex.match(/../g).map((h) => parseInt(h, 16)));

async function derive(pin, saltHex) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: fromHex(saltHex), iterations: ITERATIONS, hash: "SHA-256" },
    key,
    256
  );
  return toHex(bits);
}

export async function hashPin(pin) {
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return `${salt}:${await derive(pin, salt)}`;
}

export async function verifyPin(pin, stored) {
  const [salt, hash] = stored.split(":");
  const actual = await derive(pin, salt);
  // Compare every character so timing doesn't reveal how much matched.
  let diff = actual.length ^ hash.length;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ (hash.charCodeAt(i) || 0);
  return diff === 0;
}

export const isValidPin = (pin) => /^\d{4,8}$/.test(pin);

// Recovery code: 12 random digits, shown once so staff can set a new PIN if the PIN
// is forgotten. Stored hashed like the PIN.
export const RECOVERY_CODE_LENGTH = 12;

export function makeRecoveryCode() {
  const digits = [];
  while (digits.length < RECOVERY_CODE_LENGTH) {
    const [n] = crypto.getRandomValues(new Uint32Array(1));
    if (n < 4294967290) digits.push(n % 10); // skip the top few values so every digit is equally likely
  }
  return digits.join("");
}

// "123456789012" -> "1234 5678 9012", easier to copy down.
export const formatRecoveryCode = (code) => code.replace(/(\d{4})(?=\d)/g, "$1 ");
