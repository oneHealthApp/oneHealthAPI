// import bcrypt from 'bcryptjs';
// import crypto from 'crypto';
// import dotenv from 'dotenv';

// dotenv.config();

// const SALT_ROUNDS = 10;
// const ENCRYPTION_KEY =
//   process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef'; // Must be 32 chars
// const IV_LENGTH = 16; // For AES, this is always 16

// /**
//  * Hashes a plain password using bcryptjs and salt.
//  */
// export async function hashPassword(password: string): Promise<string> {
//   return await bcrypt.hash(password, SALT_ROUNDS);
// }

// /**
//  * Compares a plain password with a bcryptjs hashed password.
//  */
// export async function comparePassword(
//   plainPassword: string,
//   hashedPassword: string,
// ): Promise<boolean> {
//   return await bcrypt.compare(plainPassword, hashedPassword);
// }

// /**
//  * Encrypts text using AES-256-CBC symmetric encryption.
//  */
// export function encrypt(text: string): string {
//   const iv = crypto.randomBytes(IV_LENGTH);
//   const cipher = crypto.createCipheriv(
//     'aes-256-cbc',
//     Buffer.from(ENCRYPTION_KEY),
//     iv,
//   );
//   let encrypted = cipher.update(text, 'utf8');
//   encrypted = Buffer.concat([encrypted, cipher.final()]);
//   return iv.toString('hex') + ':' + encrypted.toString('hex');
// }

// /**
//  * Decrypts AES-256-CBC encrypted text.
//  */
// export function decrypt(encryptedText: string): string {
//   const [ivHex, encryptedHex] = encryptedText.split(':');
//   const iv = Buffer.from(ivHex, 'hex');
//   const encrypted = Buffer.from(encryptedHex, 'hex');
//   const decipher = crypto.createDecipheriv(
//     'aes-256-cbc',
//     Buffer.from(ENCRYPTION_KEY),
//     iv,
//   );
//   let decrypted = decipher.update(encrypted);
//   decrypted = Buffer.concat([decrypted, decipher.final()]);
//   return decrypted.toString('utf8');
// }

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SALT_ROUNDS = 10;
const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || '0123456789abcdef0123456789abcdef'; // Must be 32 chars
const IV_LENGTH = 16; // For AES, this is always 16

/**
 * Hashes a plain password using bcryptjs and salt.
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain password with a bcryptjs hashed password.
 */
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Encrypts text using AES-256-CBC symmetric encryption.
 */
export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Decrypts AES-256-CBC encrypted text.
 */
export function decrypt(encryptedText: string): string {
  const [ivHex, encryptedHex] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString('utf8');
}

/**
 * Generates a random token for email verification or password reset.
 * The token is 32 bytes long and returned as a hexadecimal string.
 */
export const generateEmailToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Masks an Aadhaar number, showing only the last 4 digits.
 * Example: 123456789012 -> ********9012
 */
export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar || aadhaar.length !== 12) return aadhaar; // return as-is if invalid
  return aadhaar.replace(/^(\d{8})(\d{4})$/, '********$2');
}

export function encryptPAN(text: string): string {
  const iv = Buffer.alloc(16, 0); // fixed IV (16 bytes)
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION_KEY),
    iv,
  );
  let encrypted = cipher.update(text, 'utf8');
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * Fast & secure Aadhaar hashing (NOT bcrypt).
 */
export function hashAadhaar(aadhaar: string): string {
  const secret =
    process.env.AADHAAR_SECRET || '0123456789abcdef0123456789abcdef';
  return crypto.createHmac('sha256', secret).update(aadhaar).digest('hex');
}
