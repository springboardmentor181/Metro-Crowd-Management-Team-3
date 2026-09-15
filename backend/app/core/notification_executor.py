import atexit
import logging
from concurrent.futures import ThreadPoolExecutor
from typing import Callable

from app.core.config import settings

logger = logging.getLogger(__name__)

_executor = ThreadPoolExecutor(
    max_workers=settings.NOTIFICATION_DISPATCH_WORKERS,
    thread_name_prefix="notify-dispatch",
)

def submit(fn: Callable, *args, **kwargs) -> None:
    def _run() -> None:
        try:
            fn(*args, **kwargs)
        except Exception:
            logger.exception("Notification dispatch job failed: %s", getattr(fn, "__name__", fn))

    try:
        _executor.submit(_run)
    except RuntimeError:
        logger.error(
            "Notification dispatch executor is not accepting new work "
            "(shutdown in progress) - dropped a %s job.",
            getattr(fn, "__name__", fn),
        )

def shutdown(wait: bool = True) -> None:
    """Called from app/main.py's lifespan on shutdown. `wait=True`
    lets in-flight sends finish (bounded by their own 15s socket
    timeouts) instead of abandoning them mid-send."""
    _executor.shutdown(wait=wait)

atexit.register(shutdown, wait=False)
