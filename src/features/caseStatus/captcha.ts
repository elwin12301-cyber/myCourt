/** Letters and digits without look-alikes (no 0/O, 1/I). */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * Demonstration CAPTCHA. It exists only so the form behaves like the official one;
 * it has no security purpose and the code is plain text. The official service uses its own CAPTCHA.
 */
export function generateCaptcha(random: () => number = Math.random, length = 6): string {
  let out = ''
  for (let i = 0; i < length; i++) out += ALPHABET[Math.floor(random() * ALPHABET.length)]
  return out
}

export function verifyCaptcha(expected: string, input: string): boolean {
  return expected.length > 0 && expected.toUpperCase() === input.trim().toUpperCase()
}
