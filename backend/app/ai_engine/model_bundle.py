
import logging
import os
import threading

import joblib

from app.core.config import settings

logger = logging.getLogger(__name__)


class ModelFeatureContractError(RuntimeError):
    """Raised when a loaded bundle's `features` list contains a name the
    calling predictor doesn't know how to supply a value for.

    This is a deliberate, explicit failure instead of silently trusting
    dict/DataFrame column ordering: each predictor already builds its
    inference row by looking up every name in `bundle["features"]`
    against a known set of inputs it can compute, so an unrecognized
    name means the saved model's feature contract has drifted from what
    this backend build knows how to feed it (e.g. a retrain added a
    new feature the predictor was never updated to compute). Callers
    catch this the same way they already catch any other predict-time
    failure - see each predictor's `except Exception` block - so the
    request degrades to that predictor's heuristic fallback and gets
    logged, instead of either crashing or silently mislabeling
    columns.
    """


def validate_feature_contract(bundle_features: list[str], known_features: set[str], *, context: str) -> None:
    """Raise ModelFeatureContractError if `bundle_features` (the exact,
    ordered column list saved inside the .pkl) names anything outside
    `known_features` (everything this predictor actually knows how to
    compute a value for). Called by each predictor before it constructs
    its inference DataFrame - see crowd_predictor.predict_crowd,
    delay_predictor.predict_delay, frequency_predictor.recommend_frequency.
    """
    unknown = [f for f in bundle_features if f not in known_features]
    if unknown:
        raise ModelFeatureContractError(
            f"{context}: model bundle expects unknown feature(s) {unknown!r} "
            f"(known: {sorted(known_features)!r})"
        )

_VALID_KEYS = ("crowd", "delay", "frequency")


_registry_lock = threading.Lock()
_registry: dict[str, dict | None] = {}


_load_counts: dict[str, int] = {key: 0 for key in _VALID_KEYS}


def _pin_inference_threads(model) -> None:
    if hasattr(model, "n_jobs"):
        try:
            model.n_jobs = 1
        except Exception:
          
            pass

    get_booster = getattr(model, "get_booster", None)
    if callable(get_booster):
        try:
            get_booster().set_param({"nthread": 1})
        except Exception:
            # Same defensive stance as above: worst case the native
            # Booster keeps its trained-time nthread default.
            pass


def _pin_all_candidates_inference_threads(bundle: dict | None) -> None:
    if not bundle:
        return
    _pin_inference_threads(bundle.get("model"))
    for candidate in (bundle.get("models") or {}).values():
        _pin_inference_threads(candidate)


def get_or_load(key: str, path: str):

    if key not in _VALID_KEYS:
        raise ValueError(f"unknown model key {key!r} - expected one of {_VALID_KEYS}")

  
    if key in _registry:
        return _registry[key]

    with _registry_lock:
     
        if key in _registry:
            return _registry[key]

        if not os.path.exists(path):
            logger.info("[model_bundle] no trained model at %s (key=%s) - using heuristic fallback", path, key)
            _registry[key] = None
        else:
            try:
                bundle = joblib.load(path)
                _pin_all_candidates_inference_threads(bundle)
                bundle = prune_to_winner(bundle)
                _registry[key] = bundle
                _load_counts[key] += 1
            except Exception as exc:
                logger.warning("[model_bundle] failed to load %s (key=%s): %r - using heuristic fallback", path, key, exc)
                _registry[key] = None
        return _registry[key]


def get_load_counts() -> dict[str, int]:
    """Debug/test helper: how many times joblib.load() has actually
    executed for each model key so far in this process. Not used by
    any production code path."""
    return dict(_load_counts)


def prune_to_winner(bundle: dict | None) -> dict | None:
    if bundle is None or not settings.AI_MODEL_LIGHT_MODE:
        return bundle
    candidates = bundle.get("models")
    if not isinstance(candidates, dict) or len(candidates) <= 1:
        return bundle
    trained_name = bundle.get("model_name")
    winner = candidates.get(trained_name)
    if winner is None:
        trained_name, winner = next(iter(candidates.items()))
    bundle["models"] = {trained_name: winner}
    bundle["model"] = winner
    bundle["model_name"] = trained_name
    logger.info(
        "[model_bundle] AI_MODEL_LIGHT_MODE on - dropped %d non-winning candidate(s), keeping only %r",
        len(candidates) - 1,
        trained_name,
    )
    return bundle
