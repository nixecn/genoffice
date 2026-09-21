import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  LOCAL_MOCK_EMAIL,
  LOCAL_MOCK_USER,
  genofficeApiKey,
  genofficeLoginInFlight,
  genofficeLogout,
  genofficeProxyFallbackPreferred,
  loadGenofficeAuth,
  resetGenofficeAuthCache,
  startGenofficeLogin,
  type GskLoginProgress,
} from '../src/genoffice-auth'
import { gskApiKey } from '../src/gsk'

/**
 * The device-code login flow (browser redirect + token polling against
 * genspark.ai) was removed. These tests pin the local-session mock: always
 * signed in, no network, no file I/O, no login in flight.
 */

beforeEach(() => {
  delete process.env.GSK_API_KEY
  delete process.env.GENOFFICE_ENABLE_GSK_TOOLS
  resetGenofficeAuthCache()
})

afterEach(() => {
  vi.unstubAllGlobals()
  delete process.env.GSK_API_KEY
  delete process.env.GENOFFICE_ENABLE_GSK_TOOLS
  resetGenofficeAuthCache()
})

describe('local session mock', () => {
  it('always reports the fixed local session', () => {
    expect(loadGenofficeAuth()).toEqual(LOCAL_MOCK_USER)
  })

  it('startGenofficeLogin succeeds immediately without network or a URL', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const events: GskLoginProgress[] = []
    expect(startGenofficeLogin((progress) => events.push(progress))).toBe(true)
    await vi.waitFor(() => expect(events).toEqual([{ phase: 'success' }]))
    expect(genofficeLoginInFlight()).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('logout is a no-op and never touches the network', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    await expect(genofficeLogout()).resolves.toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
    expect(loadGenofficeAuth()).toEqual(LOCAL_MOCK_USER)
  })

  it('exposes the fixed display email for the shell account UI', () => {
    expect(LOCAL_MOCK_EMAIL).toMatch(/@/)
  })
})

describe('gskApiKey interplay', () => {
  it('stays empty by default (the gsk backends must stay dormant)', () => {
    expect(genofficeApiKey()).toBe('')
  })

  it('honors an explicit GSK_API_KEY env override only', () => {
    process.env.GSK_API_KEY = 'gsk-env-override'
    expect(genofficeApiKey()).toBe('gsk-env-override')
    expect(gskApiKey()).toBe('gsk-env-override')
  })

  it('keeps the proxy-fallback hook quiescent', () => {
    expect(genofficeProxyFallbackPreferred()).toBe(false)
  })
})
