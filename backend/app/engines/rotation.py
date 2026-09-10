FAMILIES = {
    "tomato": "solanaceae",
    "chilli": "solanaceae",
    "potato": "solanaceae",
    "brinjal": "solanaceae",
    "groundnut": "fabaceae",
    "chickpea": "fabaceae",
    "kidneybeans": "fabaceae",
    "pigeonpeas": "fabaceae",
    "mothbeans": "fabaceae",
    "mungbean": "fabaceae",
    "blackgram": "fabaceae",
    "lentil": "fabaceae",
    "rice": "poaceae",
    "maize": "poaceae",
    "cotton": "malvaceae",
    "jute": "malvaceae",
    "watermelon": "cucurbitaceae",
    "muskmelon": "cucurbitaceae",
    "cucumber": "cucurbitaceae",
    "grapes": "vitaceae",
    "mango": "anacardiaceae",
    "banana": "musaceae",
    "apple": "rosaceae",
    "orange": "rutaceae",
    "pomegranate": "lythraceae",
    "coconut": "arecaceae",
    "papaya": "caricaceae",
    "coffee": "rubiaceae",
}

N_FIXERS = {"groundnut", "chickpea", "kidneybeans", "pigeonpeas", "mothbeans", "mungbean", "blackgram", "lentil"}


def rotation_delta(previous_code: str | None, candidate_code: str) -> tuple[float, list[str], list[str]]:
    """Soft rotation. Never forbids a crop."""
    positives: list[str] = []
    negatives: list[str] = []
    if not previous_code:
        return 0.0, positives, negatives
    prev_f = FAMILIES.get(previous_code.lower(), "unknown")
    cand_f = FAMILIES.get(candidate_code.lower(), "unknown")
    delta = 0.0
    if prev_f != "unknown" and prev_f == cand_f:
        delta -= 8
        negatives.append(f"Same family as previous crop ({prev_f}); disease/pest pressure may increase.")
    if previous_code.lower() in N_FIXERS and candidate_code.lower() not in N_FIXERS:
        delta += 4
        positives.append("Previous pulse/legume may have contributed nitrogen; treated as a mild positive, not measured N.")
    return delta, positives, negatives
