import type { Account, AuthProvider } from "../types/domain";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function validateEmail(email: string): boolean {
  return emailPattern.test(normalizeEmail(email));
}

export function validatePassword(password: string): boolean {
  return password.trim().length >= 8;
}

export function createAccount(input: {
  name: string;
  email: string;
  provider: AuthProvider;
  password?: string;
}): Account {
  const cleanEmail = normalizeEmail(input.email);

  return {
    id: `${input.provider}-${cleanEmail}`,
    name: input.name.trim(),
    email: cleanEmail,
    provider: input.provider,
    password: input.password,
    createdAt: new Date().toISOString(),
  };
}

export function isEmailUnique(accounts: Account[], email: string): boolean {
  const normalized = normalizeEmail(email);
  return !accounts.some((account) => account.email === normalized);
}
