"""
Simplified FastAPI Backend for Gestational Diabetes Prediction
Only handles model predictions - no auth or database
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Dict, Any
from contextlib import asynccontextmanager
import joblib
import pandas as pd
import numpy as np
import logging
import traceback
import os
import json
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables for model components
model_components = None
model_metadata = None

# Models directory - look in current directory
MODELS_DIR = "."


# ============================================
# MODEL LOADING UTILITIES
# ============================================

def load_model_version(version_dir):
    """
    Load a complete model version including all components and metadata.

    Args:
        version_dir (str): Path to the version directory

    Returns:
        dict: Dictionary containing all loaded models and components
    """

    # Load metadata
    metadata_path = os.path.join(version_dir, "model_metadata.json")
    with open(metadata_path, 'r') as f:
        metadata = json.load(f)

    # Load preprocessing components
    preprocessing_path = os.path.join(version_dir, "preprocessing.pkl")
    preprocessing_data = joblib.load(preprocessing_path)

    # Load individual models
    loaded_models = {}
    for model_name, filename in metadata['saved_models'].items():
        model_path = os.path.join(version_dir, filename)
        loaded_models[model_name] = joblib.load(model_path)

    return {
        'models': loaded_models,
        'preprocessing': preprocessing_data,
        'metadata': metadata
    }

def load_latest_model():
    """Load the latest saved model."""
    latest_dir = os.path.join(MODELS_DIR, "latest")
    if os.path.exists(latest_dir):
        return load_model_version(latest_dir)
    else:
        raise FileNotFoundError("No latest model found. Please train and save a model first.")

def predict_with_ensemble(data, model_components_dict):
    """
    Make predictions using the loaded ensemble model.

    Args:
        data (pd.DataFrame or dict): Input data for prediction
        model_components_dict (dict): Loaded model components from load_model_version()

    Returns:
        tuple: (predictions, probabilities)
    """

    models = model_components_dict['models']
    preprocessing = model_components_dict['preprocessing']

    # Convert to DataFrame if necessary
    if isinstance(data, dict):
        data = pd.DataFrame([data])
    elif isinstance(data, np.ndarray):
        data = pd.DataFrame(data, columns=preprocessing['feature_columns'])

    # Apply preprocessing
    processed_data = data.copy()
    for col, encoder in preprocessing['label_encoders'].items():
        if col in processed_data.columns:
            try:
                processed_data[col] = encoder.transform(processed_data[col])
            except ValueError as e:
                logger.warning(f"Unknown category in column {col}: {str(e)}")
                processed_data[col] = 0

    # Ensure feature columns are in correct order
    processed_data = processed_data[preprocessing['feature_columns']]

    # Get predictions from individual models (excluding ensemble)
    individual_predictions = []
    for model_name, model in models.items():
        if model_name != 'Ensemble':
            try:
                pred = model.predict(processed_data)
                individual_predictions.append(pred)
            except Exception as e:
                logger.error(f"Error with model {model_name}: {str(e)}")
                individual_predictions.append(np.zeros(len(processed_data)))

    # Stack predictions
    if individual_predictions:
        stacked_predictions = np.array(individual_predictions).T
    else:
        raise ValueError("No individual models available for prediction")

    # Get final ensemble prediction
    ensemble_model = models['Ensemble']
    final_predictions = ensemble_model.predict(stacked_predictions)

    # Get probabilities if available
    try:
        final_probabilities = ensemble_model.predict_proba(stacked_predictions)
    except:
        final_probabilities = np.array([[1-pred, pred] for pred in final_predictions])

    return final_predictions, final_probabilities


# ============================================
# LIFESPAN MANAGEMENT
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model on startup, cleanup on shutdown"""
    logger.info("Starting up the application...")

    # Load ML model
    try:
        global model_components, model_metadata
        model_components = load_latest_model()
        model_metadata = model_components['metadata']
        logger.info(f"ML model loaded successfully - Version: {model_metadata['version']}")
        logger.info(f"Model type: {model_metadata['problem_type']}")
        logger.info(f"Final score: {model_metadata['final_score']} ({model_metadata['score_metric']})")
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        logger.error("Model loading failed, but server will continue running")

    yield

    # Cleanup (if needed)
    logger.info("Shutting down the application...")


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Gestational Diabetes Prediction API",
    description="Simple API for gestational diabetes prediction",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for simplicity
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================
# PYDANTIC MODELS
# ============================================

class PatientData(BaseModel):
    """Input schema for ML model prediction"""
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=()
    )

    Age: float = Field(..., ge=15, le=60)
    No_of_Pregnancy: int = Field(..., alias="No of Pregnancy", ge=0, le=20)
    Gestation_in_previous_Pregnancy: float = Field(..., alias="Gestation in previous Pregnancy", ge=0, le=45)
    HDL: float = Field(..., ge=10, le=150)
    Family_History: int = Field(..., alias="Family History", ge=0, le=1)
    unexplained_prenetal_loss: int = Field(..., alias="unexplained prenetal loss", ge=0, le=1)
    Large_Child_or_Birth_Default: int = Field(..., alias="Large Child or Birth Default", ge=0, le=1)
    PCOS: int = Field(..., ge=0, le=1)
    Sys_BP: float = Field(..., alias="Sys BP", ge=70, le=200)
    Dia_BP: float = Field(..., alias="Dia BP", ge=40, le=130)
    Hemoglobin: float = Field(..., ge=5, le=20)
    Sedentary_Lifestyle: int = Field(..., alias="Sedentary Lifestyle", ge=0, le=1)
    Prediabetes: int = Field(..., ge=0, le=1)

    @field_validator('Dia_BP')
    @classmethod
    def validate_blood_pressure(cls, dia_bp, info):
        if 'Sys_BP' in info.data and dia_bp >= info.data['Sys_BP']:
            raise ValueError('Diastolic BP must be less than Systolic BP')
        return dia_bp


class PredictionResponse(BaseModel):
    """Response schema for prediction"""
    model_config = ConfigDict(protected_namespaces=())

    success: bool
    prediction: str
    gdm_probability: float
    non_gdm_probability: float
    risk_category: str
    confidence: float
    risk_factors: Dict[str, Any]
    timestamp: str
    model_version: str
    message: str


# ============================================
# PREDICTION UTILITIES
# ============================================

def predict_gdm(patient_data: Dict) -> Dict:
    """Make prediction using the ensemble ML model"""
    if model_components is None:
        raise ValueError("Model not loaded")

    try:
        # Add missing features with default values
        if 'Case Number' not in patient_data:
            patient_data['Case Number'] = 0

        if 'BMI' not in patient_data:
            # Default BMI if not provided (normal BMI ~22)
            patient_data['BMI'] = 22.0

        if 'OGTT' not in patient_data:
            # Default OGTT if not provided (normal ~120)
            patient_data['OGTT'] = 120.0

        # Make prediction using the ensemble model
        predictions, probabilities = predict_with_ensemble(patient_data, model_components)

        prediction = predictions[0] if len(predictions) > 0 else 0
        proba = probabilities[0] if len(probabilities) > 0 else [1, 0]

        # Determine class labels
        if model_metadata['problem_type'] == 'classification':
            classes = ['Non GDM', 'GDM']
            prediction_label = classes[int(prediction)]

            # Get probabilities
            if len(proba) >= 2:
                non_gdm_probability = float(proba[0])
                gdm_probability = float(proba[1])
            else:
                gdm_probability = float(proba[0] if prediction == 1 else 1 - proba[0])
                non_gdm_probability = 1 - gdm_probability
        else:
            # For regression, convert to binary classification
            threshold = 0.5
            prediction_label = "GDM" if prediction > threshold else "Non GDM"
            gdm_probability = float(prediction)
            non_gdm_probability = 1 - gdm_probability

        # Determine risk category
        if gdm_probability < 0.3:
            risk_category = "Low Risk"
        elif gdm_probability < 0.6:
            risk_category = "Moderate Risk"
        else:
            risk_category = "High Risk"

        # Calculate confidence
        confidence = max(gdm_probability, non_gdm_probability)

        # Identify risk factors based on input data
        risk_factors = {
            "family_history": patient_data.get('Family History', 0) == 1,
            "pcos": patient_data.get('PCOS', 0) == 1,
            "prediabetes": patient_data.get('Prediabetes', 0) == 1,
            "advanced_age": patient_data.get('Age', 0) > 35,
            "high_bp": (
                patient_data.get('Sys BP', 0) > 140 or
                patient_data.get('Dia BP', 0) > 90
            ),
            "previous_complications": (
                patient_data.get('Large Child or Birth Default', 0) == 1 or
                patient_data.get('unexplained prenetal loss', 0) == 1
            ),
            "sedentary_lifestyle": patient_data.get('Sedentary Lifestyle', 0) == 1,
            "low_hdl": patient_data.get('HDL', 0) < 40,
            "anemia": patient_data.get('Hemoglobin', 0) < 11,
            "multiple_pregnancies": patient_data.get('No of Pregnancy', 0) > 2,
        }

        return {
            'prediction': prediction_label,
            'gdm_probability': gdm_probability,
            'non_gdm_probability': non_gdm_probability,
            'risk_category': risk_category,
            'confidence': confidence,
            'risk_factors': risk_factors
        }

    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}\n{traceback.format_exc()}")
        raise ValueError(f"Prediction failed: {str(e)}")


# ============================================
# PREDICTION ENDPOINT
# ============================================

@app.post("/predict", response_model=PredictionResponse)
async def predict(patient_data: PatientData):
    """
    Make a prediction for gestational diabetes.

    Takes patient data and returns prediction with probabilities and risk factors.
    """
    try:
        # Convert PatientData to dict and make prediction
        data_dict = patient_data.model_dump(by_alias=True)
        prediction_result = predict_gdm(data_dict)

        return PredictionResponse(
            success=True,
            **prediction_result,
            timestamp=datetime.now().isoformat(),
            model_version=model_metadata['version'] if model_metadata else "unknown",
            message="Prediction completed successfully"
        )

    except Exception as e:
        logger.error(f"Error in prediction: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


# ============================================
# HEALTH & INFO ENDPOINTS
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_loaded = model_components is not None
    return {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
        "model_version": model_metadata['version'] if model_metadata else None,
        "timestamp": datetime.now().isoformat()
    }


@app.get("/model-info")
async def model_info():
    """Get detailed model information"""
    if model_components is None or model_metadata is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    return {
        "model_version": model_metadata['version'],
        "timestamp": model_metadata['timestamp'],
        "problem_type": model_metadata['problem_type'],
        "final_score": model_metadata['final_score'],
        "score_metric": model_metadata['score_metric'],
        "feature_columns": model_metadata['feature_columns'],
        "saved_models": list(model_metadata['saved_models'].keys())
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Gestational Diabetes Prediction API",
        "version": "1.0.0",
        "status": "running",
        "model_loaded": model_components is not None,
        "docs": "/docs",
        "redoc": "/redoc"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("fastapi_backend_modified:app", host="0.0.0.0", port=8000, reload=True)
