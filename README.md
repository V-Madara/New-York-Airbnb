# 🌙 Night Check-In — Airbnb Room Type Predictor

An end-to-end Machine Learning web application that predicts an **Airbnb room type** from listing and location features.

The project combines a trained **Scikit-learn ML model**, **FastAPI backend**, and a modern **HTML/CSS/JavaScript frontend** to provide real-time predictions through a simple web interface.

## 🚀 Live Demo

**Frontend:**
https://new-york-airbnb-1.onrender.com/

**Backend API:**
https://new-york-airbnb.onrender.com/

## ✨ Features

* 🤖 Machine Learning room-type prediction
* 📍 Location-based prediction using latitude, longitude, neighbourhood group, and neighbourhood
* 💰 Uses listing price and minimum-night requirements
* ⭐ Uses review-related features
* 📅 Uses availability information
* ⚡ FastAPI REST API
* 🌐 Interactive web frontend
* 🔗 Frontend-to-backend API integration
* ☁️ Deployed on Render
* 📊 Prediction probabilities returned by the model

## 🧠 Input Features

The model receives:

| Feature                          | Description                      |
| -------------------------------- | -------------------------------- |
| `latitude`                       | Listing latitude                 |
| `longitude`                      | Listing longitude                |
| `price`                          | Price per night                  |
| `minimum_nights`                 | Minimum required nights          |
| `number_of_reviews`              | Total number of reviews          |
| `reviews_per_month`              | Average monthly reviews          |
| `calculated_host_listings_count` | Number of listings owned by host |
| `availability_365`               | Available days in a year         |
| `neighbourhood_group`            | NYC neighbourhood group          |
| `neighbourhood`                  | Specific neighbourhood           |

## 🎯 Prediction

The application predicts the Airbnb room type, such as:

* `Entire home/apt`
* `Private room`
* `Shared room`

The API also returns the model's prediction probabilities.

## 🏗️ Project Architecture

```text
User
 │
 ▼
Frontend
HTML + CSS + JavaScript
 │
 │ POST /predict
 ▼
FastAPI Backend
 │
 ▼
Scikit-learn Model
Airbnb_model.pkl
 │
 ▼
Prediction + Probabilities
 │
 ▼
Frontend Result
```

## 📁 Project Structure

```text
Airbnb/
│
├── main.py
├── Airbnb_model.pkl
├── requirements.txt
├── index.html
├── style.css
├── script.js
├── .gitattributes
└── README.md
```

## ⚙️ Technologies Used

### Machine Learning

* Python
* Pandas
* NumPy
* Scikit-learn
* Joblib

### Backend

* FastAPI
* Pydantic
* Uvicorn

### Frontend

* HTML
* CSS
* JavaScript
* Fetch API

### Deployment

* Render
* GitHub
* Git LFS

## 🔌 API Endpoints

### Health Check

```http
GET /health
```

Example response:

```json
{
  "status": "healthy",
  "model_loaded": true
}
```

### Prediction

```http
POST /predict
```

Example request:

```json
{
  "latitude": 40.7128,
  "longitude": -74.0060,
  "price": 150,
  "minimum_nights": 2,
  "number_of_reviews": 50,
  "reviews_per_month": 2.5,
  "calculated_host_listings_count": 3,
  "availability_365": 200,
  "neighbourhood_group": "Manhattan",
  "neighbourhood": "Chelsea"
}
```

Example response:

```json
{
  "Predicted_room_type": "Entire home/apt",
  "Probability": [
    0.85,
    0.14,
    0.01
  ]
}
```

## 🧪 Run Locally

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd Airbnb
```

### 2. Create a virtual environment

```bash
python -m venv .venv
```

### 3. Activate it

**Windows PowerShell:**

```powershell
.venv\Scripts\Activate.ps1
```

### 4. Install dependencies

```bash
pip install -r requirements.txt
```

### 5. Start the FastAPI server

For local development:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### 6. Open the API documentation

```text
http://127.0.0.1:8000/docs
```

You can test the `/predict` endpoint directly from the interactive Swagger documentation.

## ☁️ Render Deployment

The backend can be deployed on Render using:

### Build Command

```bash
pip install -r requirements.txt
```

### Start Command

```bash
uvicorn main:app --host 0.0.0.0 --port $PORT
```

Render provides the `$PORT` environment variable automatically.

## 📊 Model

The trained model is stored as:

```text
Airbnb_model.pkl
```

Because the model file is large, **Git LFS** is used to track it.

```text
Airbnb_model.pkl filter=lfs diff=lfs merge=lfs -text
```

## 🔄 How It Works

1. The user enters Airbnb listing information.
2. JavaScript collects the form values.
3. The frontend sends the data to the FastAPI `/predict` endpoint.
4. FastAPI validates the input using Pydantic.
5. Pandas creates the model input.
6. The trained Scikit-learn model generates a prediction.
7. Prediction probabilities are returned.
8. The frontend displays the predicted room type.

## 🎓 Project Purpose

This project was built as a practical **end-to-end Machine Learning deployment project**, covering the complete workflow:

```text
Dataset
   ↓
Data Processing
   ↓
Machine Learning
   ↓
Model Training
   ↓
Model Serialization
   ↓
FastAPI API
   ↓
Frontend Integration
   ↓
Cloud Deployment
```

## 👨‍💻 Author

**Vishal Kumar**

Built with Python, Machine Learning, FastAPI, and JavaScript.

---

⭐ If you found this project useful, consider giving the repository a star!
