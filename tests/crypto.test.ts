import { describe, it, expect } from 'vitest'
import { encrypt, decrypt } from '@/lib/crypto'

describe('AES-256-CBC encryption (lib/crypto)', () => {
  it('encrypts and decrypts a string round-trip', () => {
    const original = 'super-secret-value'
    const ciphertext = encrypt(original)
    expect(ciphertext).not.toBe(original)
    expect(ciphertext).toContain(':')
    expect(decrypt(ciphertext)).toBe(original)
  })

  it('produces different ciphertext each call (random IV)', () => {
    const text = 'same input'
    expect(encrypt(text)).not.toBe(encrypt(text))
  })

  it('passes through empty string unchanged', () => {
    expect(encrypt('')).toBe('')
    expect(decrypt('')).toBe('')
  })
})
