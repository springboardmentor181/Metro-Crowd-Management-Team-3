
from datetime import datetime

from sqlalchemy import DateTime
from sqlalchemy import ForeignKey
from sqlalchemy import Index
from sqlalchemy import UniqueConstraint

from sqlalchemy.dialects.postgresql import UUID

from sqlalchemy.orm import Mapped
from sqlalchemy.orm import mapped_column

from app.database.base import Base

class NotificationReadState(Base):

    __tablename__ = "notification_read_states"

    __table_args__ = (
        UniqueConstraint("user_id", "notification_id", name="ux_notification_read_states_user_notification"),
        Index("ix_notification_read_states_notification_id", "notification_id"),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_profiles.id"),
        nullable=False,
    )

    notification_id: Mapped[int] = mapped_column(
        ForeignKey("notifications.id"),
        nullable=False,
    )

    read_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Set the moment THIS user bins the broadcast row (individually or
    # via "mark all as read") - mirrors Notification.binned_at but
    # scoped to one user instead of hiding it from everyone's Inbox.
    binned_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

    # Set the moment THIS user hits "Delete All" and it sweeps up this
    # broadcast row (see notification_service.delete_all_notifications)
    # - the row itself is never removed (other users still see it),
    # this just hides it from this user's Inbox and Bin permanently,
    # skipping the Bin entirely. A per-card delete on a single
    # broadcast row uses `binned_at` above instead, same as "mark all
    # as read", so it still goes through the Bin first.
    deleted_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )

