/**
 * LOCAL SESSION MOCK (genspark-fork).
 *
 * The upstream GenOffice device-code login flow (office_addin_auth against
 * www.genspark.ai, minting a gsk API key stored in ~/.genoffice/auth.json) was
 * fully removed. There is no sign-in anymore: this module now hands out a
 * fixed local session so the shell's account UI always shows "signed in" and
 * no login window, browser redirect or token polling ever happens.
 *
 * No network access, no file I/O, no genspark.ai traffic.
 */

import { homedir } from 'node:os'
import { join } from 'node:path'

/** Progress event for the (now instantaneous, mocked) login flow. */
export interface GskLoginProgress {
  phase: 'url' | 'success' | 'error'
  url?: string
  expiresInSec?: number
  /** 'network' | 'expired' | raw error text */
  error?: string
}

/** Kept for API compatibility with the removed real-auth module. */
export function genofficeAuthPath(): string {
  return join(process.env.GENOFFICE_AUTH_DIR || join(homedir(), '.genoffice'), 'auth.json')
}

export interface GenofficeAuth {
  apiKey: string
  keyId?: string
  accessToken?: string
}

/** The fixed local session every entry point reports. */
export const LOCAL_MOCK_USER: GenofficeAuth = {
  apiKey: '',
  keyId: 'local-mock',
}

/** Display identity for the mocked session (shown in the account entry). */
export const LOCAL_MOCK_EMAIL = 'local@genoffice.local'

export function loadGenofficeAuth(): GenofficeAuth | null {
  return { ...LOCAL_MOCK_USER }
}

/**
 * The GenOffice-named api key; always '' in this fork unless someone opts in
 * via GSK_API_KEY for private testing. Keeping this '' (and hasGskAuth()
 * false) is what keeps the gsk CLI/tool_cli backends — and with them the last
 * genspark.ai call sites — dormant.
 */
export function genofficeApiKey(): string {
  return process.env.GSK_API_KEY ?? ''
}

/**
 * Mocked "login": emits success immediately, performs no network call. Kept
 * so existing IPC handlers that call it stay no-op-safe.
 */
export function startGenofficeLogin(onEvent?: (progress: GskLoginProgress) => void): boolean {
  onEvent?.({ phase: 'success' })
  return true
}

/** True while a login started via startGenofficeLogin is in flight — never true now. */
export function genofficeLoginInFlight(): boolean {
  return false
}

/**
 * Fire-and-forget login for entry points without progress UI. Mocked: a no-op
 * (the session already exists locally).
 */
export function ensureGenofficeLogin(_openUrl?: (url: string) => void): void {
  /* no-op: the local session is always present */
}

/**
 * Mocked sign-out: nothing to revoke, nothing to clear. Kept so logout IPC
 * handlers keep working (they still clear their own local caches).
 */
export async function genofficeLogout(): Promise<void> {
  /* no-op */
}

/** Test hook kept for API compatibility; the mock has no caches. */
export function resetGenofficeAuthCache(): void {
  /* no-op */
}

/** Test hook kept for API compatibility. */
export function genofficeProxyFallbackPreferred(): boolean {
  return false
}
