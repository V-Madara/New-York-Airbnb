from pathlib import Path

import joblib
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent

COLUMNS = [
    "latitude",
    "longitude",
    "price",
    "minimum_nights",
    "number_of_reviews",
    "reviews_per_month",
    "calculated_host_listings_count",
    "availability_365",
    "neighbourhood_group",
    "neighbourhood",
]

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

model = joblib.load(BASE_DIR / "Airbnb_model.pkl")


class Features(BaseModel):
    latitude: float = Field(..., ge=-90, le=90, description="Latitude coordinate")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude coordinate")
    price: float = Field(..., gt=0, description="Price per night, must be positive")
    minimum_nights: int = Field(..., ge=1, le=365, description="Minimum nights required for booking")
    number_of_reviews: int = Field(..., ge=0, description="Total number of reviews")
    reviews_per_month: float = Field(..., ge=0, description="Average reviews per month")
    calculated_host_listings_count: int = Field(..., ge=0, description="Number of listings by this host")
    availability_365: int = Field(..., ge=0, le=365, description="Days available out of 365")
    neighbourhood_group: str = Field(..., min_length=1, description="Borough or neighbourhood group")
    neighbourhood: str = Field(..., min_length=1, description="Specific neighbourhood name")


@app.get("/")
def serve_index():
    return FileResponse(BASE_DIR / "index.html")


@app.get("/style.css")
def serve_css():
    return FileResponse(BASE_DIR / "style.css", media_type="text/css")


@app.get("/script.js")
def serve_js():
    return FileResponse(BASE_DIR / "script.js", media_type="application/javascript")


@app.get("/health")
def health():
    return {"status": "ok", "classes": list(model.classes_)}


@app.post("/predict")
def predict(features: Features):
    row = pd.DataFrame([features.model_dump()], columns=COLUMNS)
    prediction = model.predict(row)
    probability = model.predict_proba(row)

    return {
        "Predicted_room_type": prediction[0],
        "Probability": probability.tolist()[0],
        "classes": [str(c) for c in model.classes_],
    }
