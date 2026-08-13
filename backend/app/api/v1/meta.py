from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.station import Station
from app.models.train import Train
from app.models.train_schedule import TrainSchedule
from app.utils.geo import MIN_STATIONS_FOR_SUFFICIENT_DATA, STATE_CITY_MAP

router = APIRouter(
    prefix="/meta",
    tags=["Meta"]
)


@router.get("/states")
def list_states(db: Session = Depends(get_db)):
    """One row per Indian state MetroFlow knows about, with how much
    real data is seeded for it - drives the navbar state picker and
    the "not enough data yet" banner on each dashboard."""
    station_counts = dict(
        db.query(Station.city, func.count(Station.id))
        .filter(Station.is_active.is_(True))
        .group_by(Station.city)
        .all()
    )

    train_counts = dict(
        db.query(Station.city, func.count(func.distinct(Train.id)))
        .join(TrainSchedule, TrainSchedule.station_id == Station.id)
        .join(Train, Train.id == TrainSchedule.train_id)
        .group_by(Station.city)
        .all()
    )

    results = []
    for state, cities in STATE_CITY_MAP.items():
        station_count = sum(station_counts.get(c, 0) for c in cities)
        train_count = sum(train_counts.get(c, 0) for c in cities)
        results.append({
            "state": state,
            "cities": cities,
            "station_count": station_count,
            "train_count": train_count,
            "has_sufficient_data": station_count >= MIN_STATIONS_FOR_SUFFICIENT_DATA,
        })

    return sorted(results, key=lambda r: r["state"])


@router.get("/cities")
def list_cities(db: Session = Depends(get_db)):
    """One row per city that actually has station data seeded - drives
    the navbar's city picker. A new city shows up here automatically
    the moment stations for it are added, no code change required."""
    station_counts = dict(
        db.query(Station.city, func.count(Station.id))
        .filter(Station.is_active.is_(True))
        .group_by(Station.city)
        .all()
    )

    train_counts = dict(
        db.query(Station.city, func.count(func.distinct(Train.id)))
        .join(TrainSchedule, TrainSchedule.station_id == Station.id)
        .join(Train, Train.id == TrainSchedule.train_id)
        .group_by(Station.city)
        .all()
    )

    city_to_state = {
        city: state
        for state, cities in STATE_CITY_MAP.items()
        for city in cities
    }

    results = []
    for city, station_count in station_counts.items():
        results.append({
            "city": city,
            "state": city_to_state.get(city),
            "station_count": station_count,
            "train_count": train_counts.get(city, 0),
            "has_sufficient_data": station_count >= MIN_STATIONS_FOR_SUFFICIENT_DATA,
        })

    return sorted(results, key=lambda r: r["city"])