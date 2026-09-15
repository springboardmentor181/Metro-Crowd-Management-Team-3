
from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.rate_limit import WRITE_LIMIT, limiter
from app.core.security import get_current_user, require_roles
from app.database.session import get_db
from app.enums.notification_dispatch_kind import NotificationDispatchKind
from app.enums.user_role import UserRole
from app.models.user_profile import UserProfile
from app.schemas.alert import AlertCreate, AlertResolve, AlertResponse
from app.schemas.notification_log import NotificationLogResponse
from app.services import alert_service
from app.services import notification_dispatch_queue

router = APIRouter(
    prefix="/alerts",
    tags=["Alerts"]
)

@router.get("/", response_model=list[AlertResponse])
def get_alerts(
    station_id: int | None = None,
    active_only: bool = False,
    state: str | None = None,
    limit: int = alert_service.DEFAULT_ALERTS_LIMIT,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
):
    """`limit`/`offset` page through results, most recent first (default
    page size and hard cap enforced in alert_service.list_alerts, so an
    out-of-range value here is clamped rather than rejected)."""
    return alert_service.list_alerts(db, station_id, active_only, state, limit, offset)

@router.post("/", response_model=AlertResponse, status_code=201)
@limiter.limit(WRITE_LIMIT)
def create_alert(
    request: Request,
    payload: AlertCreate,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATOR)),
):
    alert = alert_service.create_alert(db, payload, created_by=current_user.id)

    if payload.notify_email or payload.notify_sms:
        # Dedicated pool (Phase 8), via the durable queue (Phase 11) -
        # never the shared request-handling thread pool. Fire-and-
        # forget: this call returns immediately (after a fast, already-
        # committed DB write), the actual email/SMS sends happen on
        # notification_executor's own worker threads.
        notification_dispatch_queue.enqueue_and_submit(
            NotificationDispatchKind.ALERT_CREATED,
            alert.id,
            current_user.id,
            payload.notify_email,
            payload.notify_sms,
        )

    return alert

@router.get("/{alert_id}", response_model=AlertResponse)
def get_alert(
    alert_id: int,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user),
):
    return alert_service.get_alert(db, alert_id)

@router.patch("/{alert_id}/resolve", response_model=AlertResponse)
@limiter.limit(WRITE_LIMIT)
def resolve_alert(
    request: Request,
    alert_id: int,
    payload: AlertResolve = AlertResolve(),
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATOR)),
):
    alert, just_resolved = alert_service.resolve_alert(db, alert_id)

    if just_resolved and payload.notify_on_resolve:
        # Dedicated pool (Phase 8), via the durable queue (Phase 11) -
        # see create_alert above.
        notification_dispatch_queue.enqueue_and_submit(
            NotificationDispatchKind.ALERT_RESOLVED,
            alert.id,
            current_user.id,
            notify_email=False,
            notify_sms=False,
        )

    return alert

@router.get("/{alert_id}/notifications", response_model=list[NotificationLogResponse])
def get_alert_notifications(
    alert_id: int,
    limit: int = alert_service.DEFAULT_ALERT_NOTIFICATIONS_LIMIT,
    offset: int = 0,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(require_roles(UserRole.ADMIN, UserRole.OPERATOR)),
):

    return alert_service.list_alert_notifications(db, alert_id, limit, offset)
