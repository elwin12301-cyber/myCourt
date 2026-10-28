"""Keeps credentials, e-mail addresses and party or case identifiers out of logs (constitution V, research D15)."""
import logging
import re

SENSITIVE_KEYS = ("password", "token", "email", "cnr", "name", "party", "secret", "csrf")
_KEYED = re.compile(r"""(?i)(["']?(?:%s)[A-Za-z_]*["']?\s*[:=]\s*)("[^"]*"|'[^']*'|[^\s,&}]+)""" % "|".join(SENSITIVE_KEYS))
_EMAIL = re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")


def redact(text: str) -> str:
    text = _KEYED.sub(r"\1[redacted]", text)
    return _EMAIL.sub("[redacted-email]", text)


class RedactFilter(logging.Filter):
    """Drops query strings from access-log lines and redacts sensitive keys and e-mail addresses from any message."""

    def filter(self, record: logging.LogRecord) -> bool:
        if isinstance(record.args, tuple):
            record.args = tuple(a.split("?", 1)[0] if isinstance(a, str) and "?" in a else a for a in record.args)
        record.msg = redact(record.getMessage()) if record.args else redact(str(record.msg))
        record.args = ()
        return True


def install() -> None:
    f = RedactFilter()
    for name in ("", "uvicorn", "uvicorn.access", "uvicorn.error", "app"):
        logger = logging.getLogger(name)
        if not any(isinstance(x, RedactFilter) for x in logger.filters):
            logger.addFilter(f)
        for h in logger.handlers:
            if not any(isinstance(x, RedactFilter) for x in h.filters):
                h.addFilter(f)
