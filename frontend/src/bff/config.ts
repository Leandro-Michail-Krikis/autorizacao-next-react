import 'server-only';

export function getBackendUrl(): string {
  return process.env.BACKEND_URL ?? 'http://localhost:8080';
}

export function getBffUrl(): string {
  return process.env.BFF_INTERNAL_URL ?? 'http://localhost:3000';
}
