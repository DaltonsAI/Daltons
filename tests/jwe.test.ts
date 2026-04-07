import { describe, it, expect } from 'vitest'
import { encryptJWE } from '@/lib/jwe/encrypt'
import { decryptJWE } from '@/lib/jwe/decrypt'

describe('JWE session encryption (lib/jwe)', () => {
  it('encrypts and decrypts an object round-trip', async () => {
    const payload = { userId: '123', plan: 'pro' }
    const token = await encryptJWE(payload, '1h')
    const decoded = await decryptJWE<typeof payload>(token)
    expect(decoded).toMatchObject(payload)
  })

  it('returns undefined for an invalid token', async () => {
    const result = await decryptJWE('not.a.valid.token.at.all')
    expect(result).toBeUndefined()
  })
})
