"""Password hashing and tokens, standard library only (research D4)."""
import base64
import hashlib
import hmac
import secrets

_N, _R, _P = 2 ** 15, 8, 1
MIN_PASSWORD = 12
_COMMON = {
    "password1234", "123456789012", "qwertyuiop12", "iloveyou1234", "administrator", "welcome12345", "letmein123456",
    "password12345", "changeme1234", "111111111111", "abcdefghijkl", "passw0rd1234",
}


def _b64(b: bytes) -> str:
    return base64.b64encode(b).decode()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.scrypt(password.encode(), salt=salt, n=_N, r=_R, p=_P, maxmem=128 * 1024 * 1024, dklen=32)
    return f"scrypt${_N}${_R}${_P}${_b64(salt)}${_b64(digest)}"


def verify_password(password: str, stored: str) -> bool:
    try:
        scheme, n, r, p, salt, digest = stored.split("$")
        if scheme != "scrypt":
            return False
        got = hashlib.scrypt(password.encode(), salt=base64.b64decode(salt), n=int(n), r=int(r), p=int(p),
                             maxmem=128 * 1024 * 1024, dklen=32)
        return hmac.compare_digest(got, base64.b64decode(digest))
    except Exception:
        return False


# Verified for unknown accounts so the time taken does not reveal whether an account exists.
DUMMY_HASH = hash_password("not-a-real-password")


def password_problem(password: str) -> str | None:
    if len(password) < MIN_PASSWORD:
        return f"Use at least {MIN_PASSWORD} characters."
    if password.lower() in _COMMON:
        return "That password is too common."
    return None


def new_token() -> str:
    return secrets.token_urlsafe(32)


def token_hash(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def keyed_hash(value: str) -> str:
    """For throttling records: lets us count attempts without storing the e-mail or address."""
    from ..config import settings
    return hmac.new(settings.secret_key.encode(), value.lower().encode(), hashlib.sha256).hexdigest()
