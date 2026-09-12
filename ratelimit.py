"""In-memory sliding-window rate limiter for live call attempts.

A plain dict of ip -> timestamps is enough for a single free-tier instance
demo — it doesn't need to survive restarts and there's only one process.
"""
from __future__ import annotations

import time
from collections import defaultdict
from threading import Lock

MAX_LIVE_CALLS_PER_WINDOW = 3
WINDOW_SECONDS = 24 * 60 * 60

_log: dict[str, list[float]] = defaultdict(list)
_lock = Lock()


class RateLimitExceeded(Exception):
    pass


def check_and_record(ip: str) -> None:
    """Raises RateLimitExceeded if `ip` already has MAX_LIVE_CALLS_PER_WINDOW
    live calls within the last WINDOW_SECONDS; otherwise records this call."""
    now = time.time()
    cutoff = now - WINDOW_SECONDS
    with _lock:
        fresh = [t for t in _log[ip] if t > cutoff]
        if len(fresh) >= MAX_LIVE_CALLS_PER_WINDOW:
            _log[ip] = fresh
            raise RateLimitExceeded()
        fresh.append(now)
        _log[ip] = fresh


def reset() -> None:
    """Test helper: clears all tracked state."""
    with _lock:
        _log.clear()
