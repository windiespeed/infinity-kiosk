// Usage: npm run hash-pin -- 482913
// Prints a line to paste into .env. The PIN itself is never stored.
import { randomBytes, scryptSync } from "node:crypto";

const pin = process.argv[2];
if (!pin || !/^\d{4,8}$/.test(pin)) {
  console.error("Give a PIN of 4 to 8 digits, e.g.  npm run hash-pin -- 482913");
  process.exit(1);
}
const salt = randomBytes(16).toString("hex");
const hash = scryptSync(pin, salt, 64).toString("hex");
console.log(`ADMIN_PIN_HASH=${salt}:${hash}`);
