import { createHash } from 'node:crypto';
import argon2 from 'argon2';

export const hashSandi = (sandi: string) => argon2.hash(sandi, { type: argon2.argon2id });
export const cocokSandi = (hash: string, sandi: string) => argon2.verify(hash, sandi);
export const sha256 = (teks: string) => createHash('sha256').update(teks).digest('hex');
