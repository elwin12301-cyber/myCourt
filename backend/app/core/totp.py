"""Time-based one-time passwords (RFC 6238) with the standard library only: SHA-1, 30-second steps, 6 digits.

Compatible with common authenticator apps. A code is accepted for the current step and one step either side, so a
slightly wrong phone clock still works.
"""
import base64
import hashlib
import hmac
import secrets
import struct
import time
from urllib.parse import quote

STEP = 30
DIGITS = 6


def new_secret() -> str:
    return base64.b32encode(secrets.token_bytes(20)).decode().rstrip("=")


def _code(secret: str, counter: int) -> str:
    key = base64.b32decode(secret + "=" * (-len(secret) % 8), casefold=True)
    mac = hmac.new(key, struct.pack(">Q", counter), hashlib.sha1).digest()
    offset = mac[-1] & 0x0F
    number = (struct.unpack(">I", mac[offset:offset + 4])[0] & 0x7FFFFFFF) % (10 ** DIGITS)
    return str(number).zfill(DIGITS)


def verify(secret: str | None, code: str | None, now: float | None = None) -> bool:
    if not secret or not code:
        return False
    code = code.strip().replace(" ", "")
    if not (code.isdigit() and len(code) == DIGITS):
        return False
    counter = int((time.time() if now is None else now) // STEP)
    return any(hmac.compare_digest(_code(secret, counter + d), code) for d in (-1, 0, 1))


def uri(secret: str, account: str, issuer: str = "myCourt") -> str:
    return f"otpauth://totp/{quote(issuer)}:{quote(account)}?secret={secret}&issuer={quote(issuer)}&digits={DIGITS}&period={STEP}"
