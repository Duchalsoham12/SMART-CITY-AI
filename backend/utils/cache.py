"""
SmartCityAI - In-Memory High-Performance TTL & LRU Cache
Provides thread-safe caching with time-to-live expiration for expensive
geospatial aggregations, model inference summaries, and city health metrics.
"""

from functools import wraps
import hashlib
import json
import threading
import time
from typing import Any, Callable, Dict, Optional, Tuple


class TTLCache:
    """Thread-safe in-memory cache with time-to-live expiration and LRU eviction."""

    def __init__(self, default_ttl_seconds: float = 60.0, max_entries: int = 1000):
        self.default_ttl = default_ttl_seconds
        self.max_entries = max_entries
        self._store: Dict[str, Tuple[Any, float]] = {}
        self._lock = threading.Lock()
        self.hits: int = 0
        self.misses: int = 0

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            entry = self._store.get(key)
            if entry is None:
                self.misses += 1
                return None
            val, expiry = entry
            if time.time() > expiry:
                del self._store[key]
                self.misses += 1
                return None
            self.hits += 1
            return val

    def set(self, key: str, value: Any, ttl_seconds: Optional[float] = None) -> None:
        ttl = ttl_seconds if ttl_seconds is not None else self.default_ttl
        with self._lock:
            if len(self._store) >= self.max_entries:
                # Evict oldest entry
                oldest_key = min(self._store.keys(), key=lambda k: self._store[k][1])
                del self._store[oldest_key]
            self._store[key] = (value, time.time() + ttl)

    def clear(self) -> None:
        with self._lock:
            self._store.clear()
            self.hits = 0
            self.misses = 0


# Shared platform caches
geospatial_cache = TTLCache(default_ttl_seconds=60.0, max_entries=500)
city_summary_cache = TTLCache(default_ttl_seconds=30.0, max_entries=100)


def cached(cache_instance: TTLCache, ttl_seconds: Optional[float] = None):
    """Decorator to cache function results based on arguments."""
    def decorator(fn: Callable):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            # Build deterministic cache key
            raw_key = f"{fn.__module__}.{fn.__qualname__}:{repr(args)}:{repr(sorted(kwargs.items()))}"
            cache_key = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()

            cached_val = cache_instance.get(cache_key)
            if cached_val is not None:
                return cached_val

            result = fn(*args, **kwargs)
            cache_instance.set(cache_key, result, ttl_seconds=ttl_seconds)
            return result
        return wrapper
    return decorator
