"""
Modified FastAPI Backend for Gestational Diabetes Prediction
Updated to work with the fixed models that include BMI and OGTT
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Dict, Any, Optional
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

def advanced_feature_engineering(df):
    """Apply the same feature engineering as in training"""
    df_enhanced = df.copy()
    
    # BMI Feature Engineering
    if 'BMI' in df_enhanced.columns:
        # BMI categories
        df_enhanced['BMI_Category'] = pd.cut(
            df_enhanced['BMI'],
            bins=[0, 18.5, 25, 30, 50],
            labels=['Underweight', 'Normal', 'Overweight', 'Obese']
        )
        
        # BMI risk score
        df_enhanced['BMI_Risk_Score'] = np.where(
            df_enhanced['BMI'] < 18.5, 1,
            np.where(df_enhanced['BMI'] < 25, 0,
            np.where(df_enhanced['BMI'] < 30, 2, 4))
        )
    
    # OGTT Feature Engineering  
    if 'OGTT' in df_enhanced.columns:
        # OGTT categories
        df_enhanced['OGTT_Category'] = pd.cut(
            df_enhanced['OGTT'],
            bins=[0, 140, 200, 1000],
            labels=['Normal', 'Impaired', 'Diabetic']
        )
        
        # OGTT risk score
        df_enhanced['OGTT_Risk_Score'] = np.where(
            df_enhanced['OGTT'] < 140, 0,
            np.where(df_enhanced['OGTT'] < 200, 3, 5)
        )
    
    # Combined Risk Features
    if 'BMI_Risk_Score' in df_enhanced.columns and 'OGTT_Risk_Score' in df_enhanced.columns:
        df_enhanced['BMI_OGTT_Risk'] = df_enhanced['BMI_Risk_Score'] + df_enhanced['OGTT_Risk_Score']
    
    # Age-BMI interaction
    if 'Age' in df_enhanced.columns and 'BMI' in df_enhanced.columns:
        df_enhanced['Age_BMI_Interaction'] = df_enhanced['Age'] * df_enhanced['BMI'] / 100
    
    # Blood pressure features
    if 'Sys BP' in df_enhanced.columns and 'Dia BP' in df_enhanced.columns:
        df_enhanced['BP_Ratio'] = df_enhanced['Sys BP'] / df_enhanced['Dia BP']
        df_enhanced['Pulse_Pressure'] = df_enhanced['Sys BP'] - df_enhanced['Dia BP']
        df_enhanced['Mean_Arterial_Pressure'] = (df_enhanced['Sys BP'] + 2 * df_enhanced['Dia BP']) / 3
        
        # Hypertension indicators
        df_enhanced['Hypertensive'] = (
            (df_enhanced['Sys BP'] >= 140) | (df_enhanced['Dia BP'] >= 90)
        ).astype(int)
    
    # Comprehensive Risk Score
    risk_score = 0
    
    # Major risk factors
    if 'OGTT_Risk_Score' in df_enhanced.columns:
        risk_score += df_enhanced['OGTT_Risk_Score'] * 2
    if 'BMI_Risk_Score' in df_enhanced.columns:
        risk_score += df_enhanced['BMI_Risk_Score'] * 1.5
    
    risk_score += (df_enhanced['Age'] > 35).astype(int) * 2
    risk_score += df_enhanced.get('Family History', 0) * 2
    risk_score += df_enhanced.get('PCOS', 0) * 2.5
    risk_score += (df_enhanced['No of Pregnancy'] > 2).astype(int) * 1
    
    if 'Hypertensive' in df_enhanced.columns:
        risk_score += df_enhanced['Hypertensive'] * 1.5
    
    df_enhanced['Comprehensive_Risk_Score'] = risk_score
    
    # High-risk indicators
    if 'BMI' in df_enhanced.columns:
        df_enhanced['High_Risk_BMI'] = (df_enhanced['BMI'] >= 30).astype(int)
    if 'OGTT' in df_enhanced.columns:
        df_enhanced['High_Risk_OGTT'] = (df_enhanced['OGTT'] >= 140).astype(int)
    
    df_enhanced['Advanced_Age'] = (df_enhanced['Age'] >= 35).astype(int)
    
    # Log transformations for skewed features
    for col in ['BMI', 'OGTT']:
        if col in df_enhanced.columns:
            df_enhanced[f'{col}_log'] = np.log1p(df_enhanced[col])
    
    return df_enhanced

def predict_with_ensemble(data, model_components_dict):
    """
    Make predictions using the loaded ensemble model with proper feature engineering.

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

    # Apply the same feature engineering as during training
    try:
        enhanced_data = advanced_feature_engineering(data)
    except Exception as e:
        logger.warning(f"Error in feature engineering: {str(e)}")
        enhanced_data = data.copy()

    # Apply categorical encoding
    processed_data = enhanced_data.copy()
    for col, encoder in preprocessing['label_encoders'].items():
        if col in processed_data.columns:
            try:
                if processed_data[col].dtype == 'object' or processed_data[col].dtype.name == 'category':
                    processed_data[col] = encoder.transform(processed_data[col].astype(str))
                elif col in ['BMI_Category', 'OGTT_Category']:
                    # Handle categorical columns created during feature engineering
                    processed_data[col] = encoder.transform(processed_data[col].astype(str))
            except ValueError as e:
                logger.warning(f"Unknown category in column {col}: {str(e)}")
                processed_data[col] = 0

    # Select only the features used during training
    try:
        feature_columns = preprocessing['feature_columns']
        # Handle missing features by filling with defaults
        for col in feature_columns:
            if col not in processed_data.columns:
                logger.warning(f"Missing feature {col}, filling with default value")
                if 'Risk' in col or 'Score' in col:
                    processed_data[col] = 0
                elif col in ['Age', 'BMI', 'OGTT', 'Hemoglobin', 'HDL']:
                    defaults = {
                        'Age': 28, 'BMI': 23, 'OGTT': 120, 
                        'Hemoglobin': 12, 'HDL': 50
                    }
                    processed_data[col] = defaults.get(col, 0)
                else:
                    processed_data[col] = 0
        
        final_data = processed_data[feature_columns]
    except Exception as e:
        logger.error(f"Error selecting features: {str(e)}")
        # Fallback to using all available columns
        final_data = processed_data

    # Apply scaling
    try:
        scaler = preprocessing['scaler']
        scaled_data = scaler.transform(final_data)
        scaled_df = pd.DataFrame(scaled_data, columns=final_data.columns, index=final_data.index)
    except Exception as e:
        logger.warning(f"Error in scaling: {str(e)}")
        scaled_df = final_data

    # Get predictions from individual models (excluding ensemble)
    individual_predictions = []
    for model_name, model in models.items():
        if model_name != 'Ensemble':
            try:
                pred = model.predict(scaled_df)
                individual_predictions.append(pred)
                logger.info(f"Model {model_name} prediction: {pred[0]}")
            except Exception as e:
                logger.error(f"Error with model {model_name}: {str(e)}")
                individual_predictions.append(np.zeros(len(scaled_df)))

    # Stack predictions
    if individual_predictions:
        stacked_predictions = np.array(individual_predictions).T
        logger.info(f"Stacked predictions shape: {stacked_predictions.shape}")
    else:
        raise ValueError("No individual models available for prediction")

    # Get final ensemble prediction
    ensemble_model = models['Ensemble']
    final_predictions = ensemble_model.predict(stacked_predictions)

    # Get probabilities if available
    try:
        final_probabilities = ensemble_model.predict_proba(stacked_predictions)
    except Exception as e:
        logger.warning(f"Error getting probabilities: {str(e)}")
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
        logger.info(f"✅ ML model loaded successfully")
        logger.info(f"📊 Version: {model_metadata['version']}")
        logger.info(f"🎯 Problem type: {model_metadata['problem_type']}")
        logger.info(f"📈 Best model: {model_metadata.get('best_model', 'Unknown')}")
        logger.info(f"🏆 Best F1 Score: {model_metadata.get('best_f1', 'Unknown')}")
        logger.info(f"🔧 Features: {len(model_metadata.get('feature_columns', []))}")
        
        # Print available models
        if 'saved_models' in model_metadata:
            logger.info(f"🤖 Available models: {list(model_metadata['saved_models'].keys())}")
        
    except Exception as e:
        logger.error(f"❌ Error loading model: {str(e)}")
        logger.error("Model loading failed, but server will continue running")

    yield

    # Cleanup (if needed)
    logger.info("Shutting down the application...")


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Gestational Diabetes Prediction API - Fixed Models",
    description="Fixed API for gestational diabetes prediction with proper BMI/OGTT handling",
    version="2.0.0",
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
    """Input schema for ML model prediction - Updated with BMI and OGTT"""
    model_config = ConfigDict(
        populate_by_name=True,
        protected_namespaces=()
    )

    Age: float = Field(..., ge=15, le=60, description="Patient age in years")
    No_of_Pregnancy: int = Field(..., alias="No of Pregnancy", ge=0, le=20, description="Number of pregnancies")
    Gestation_in_previous_Pregnancy: float = Field(..., alias="Gestation in previous Pregnancy", ge=0, le=45, description="Previous pregnancy gestation period")
    
    # Critical features for GDM prediction
    BMI: float = Field(..., ge=15, le=50, description="Body Mass Index (kg/m²) - Critical for GDM prediction")
    OGTT: float = Field(..., ge=50, le=400, description="Oral Glucose Tolerance Test result (mg/dL) - Critical for GDM prediction")
    
    HDL: float = Field(..., ge=10, le=150, description="HDL Cholesterol level")
    Family_History: int = Field(..., alias="Family History", ge=0, le=1, description="Family history of diabetes (0=No, 1=Yes)")
    unexplained_prenetal_loss: int = Field(..., alias="unexplained prenetal loss", ge=0, le=1, description="History of unexplained prenatal loss")
    Large_Child_or_Birth_Default: int = Field(..., alias="Large Child or Birth Default", ge=0, le=1, description="History of large baby or birth defects")
    PCOS: int = Field(..., ge=0, le=1, description="Polycystic Ovary Syndrome (0=No, 1=Yes)")
    Sys_BP: float = Field(..., alias="Sys BP", ge=70, le=200, description="Systolic Blood Pressure")
    Dia_BP: float = Field(..., alias="Dia BP", ge=40, le=130, description="Diastolic Blood Pressure")
    Hemoglobin: float = Field(..., ge=5, le=20, description="Hemoglobin level")
    Sedentary_Lifestyle: int = Field(..., alias="Sedentary Lifestyle", ge=0, le=1, description="Sedentary lifestyle (0=No, 1=Yes)")
    Prediabetes: int = Field(..., ge=0, le=1, description="History of prediabetes (0=No, 1=Yes)")

    @field_validator('Dia_BP')
    @classmethod
    def validate_blood_pressure(cls, dia_bp, info):
        if 'Sys_BP' in info.data and dia_bp >= info.data['Sys_BP']:
            raise ValueError('Diastolic BP must be less than Systolic BP')
        return dia_bp

    @field_validator('BMI')
    @classmethod
    def validate_bmi(cls, bmi):
        if bmi < 15 or bmi > 50:
            raise ValueError('BMI must be between 15 and 50')
        return bmi

    @field_validator('OGTT')
    @classmethod  
    def validate_ogtt(cls, ogtt):
        if ogtt < 50 or ogtt > 400:
            raise ValueError('OGTT must be between 50 and 400 mg/dL')
        return ogtt


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
    clinical_recommendations: Dict[str, str]
    timestamp: str
    model_version: str
    message: str


# ============================================
# PREDICTION UTILITIES
# ============================================

def predict_gdm(patient_data: Dict) -> Dict:
    """Make prediction using the fixed ensemble ML model"""
    if model_components is None:
        raise ValueError("Model not loaded")

    try:
        logger.info(f"🔍 Making prediction for patient with BMI: {patient_data.get('BMI', 'Missing')}, OGTT: {patient_data.get('OGTT', 'Missing')}")
        
        # Ensure all required fields are present
        required_fields = ['Age', 'BMI', 'OGTT', 'No of Pregnancy', 'Family History', 'PCOS']
        for field in required_fields:
            if field not in patient_data:
                logger.warning(f"Missing required field: {field}")

        # Make prediction using the ensemble model
        predictions, probabilities = predict_with_ensemble(patient_data, model_components)

        prediction = predictions[0] if len(predictions) > 0 else 0
        proba = probabilities[0] if len(probabilities) > 0 else [1, 0]

        logger.info(f"📊 Raw prediction: {prediction}, probabilities: {proba}")

        # Determine class labels
        classes = ['Non GDM', 'GDM']
        prediction_label = classes[int(prediction)]

        # Get probabilities
        if len(proba) >= 2:
            non_gdm_probability = float(proba[0])
            gdm_probability = float(proba[1])
        else:
            gdm_probability = float(proba[0] if prediction == 1 else 1 - proba[0])
            non_gdm_probability = 1 - gdm_probability

        # Apply optimal threshold if available
        optimal_threshold = model_components['preprocessing'].get('optimal_threshold', 0.5)
        if gdm_probability >= optimal_threshold:
            prediction_label = "GDM"
        else:
            prediction_label = "Non GDM"

        # Determine risk category based on probability and risk factors
        high_risk_factors = sum([
            patient_data.get('BMI', 20) >= 30,  # Obesity
            patient_data.get('OGTT', 100) >= 140,  # High glucose
            patient_data.get('Age', 20) >= 35,  # Advanced age
            patient_data.get('Family History', 0) == 1,  # Family history
            patient_data.get('PCOS', 0) == 1,  # PCOS
        ])
        
        if gdm_probability >= 0.7 or high_risk_factors >= 3:
            risk_category = "High Risk"
        elif gdm_probability >= 0.4 or high_risk_factors >= 2:
            risk_category = "Moderate Risk"
        else:
            risk_category = "Low Risk"

        # Calculate confidence
        confidence = max(gdm_probability, non_gdm_probability)

        # Enhanced risk factors analysis
        risk_factors = {
            "obesity": patient_data.get('BMI', 20) >= 30,
            "overweight": 25 <= patient_data.get('BMI', 20) < 30,
            "high_glucose": patient_data.get('OGTT', 100) >= 140,
            "impaired_glucose": 120 <= patient_data.get('OGTT', 100) < 140,
            "family_history": patient_data.get('Family History', 0) == 1,
            "pcos": patient_data.get('PCOS', 0) == 1,
            "prediabetes": patient_data.get('Prediabetes', 0) == 1,
            "advanced_age": patient_data.get('Age', 20) >= 35,
            "high_bp": (
                patient_data.get('Sys BP', 0) >= 140 or
                patient_data.get('Dia BP', 0) >= 90
            ),
            "previous_complications": (
                patient_data.get('Large Child or Birth Default', 0) == 1 or
                patient_data.get('unexplained prenetal loss', 0) == 1
            ),
            "sedentary_lifestyle": patient_data.get('Sedentary Lifestyle', 0) == 1,
            "low_hdl": patient_data.get('HDL', 50) < 40,
            "anemia": patient_data.get('Hemoglobin', 12) < 11,
            "multiple_pregnancies": patient_data.get('No of Pregnancy', 1) > 2,
        }

        # Clinical recommendations based on risk factors and prediction
        recommendations = {}
        
        if prediction_label == "GDM" or risk_category == "High Risk":
            recommendations = {
                "immediate_action": "Consult with healthcare provider immediately for comprehensive GDM management",
                "monitoring": "Regular blood glucose monitoring and dietary modifications required",
                "lifestyle": "Implement supervised exercise program and nutritional counseling",
                "follow_up": "Weekly monitoring with healthcare team recommended"
            }
        elif risk_category == "Moderate Risk":
            recommendations = {
                "immediate_action": "Schedule follow-up appointment within 1-2 weeks",
                "monitoring": "Increase frequency of glucose monitoring",
                "lifestyle": "Focus on healthy diet and regular physical activity",
                "follow_up": "Bi-weekly check-ups recommended"
            }
        else:
            recommendations = {
                "immediate_action": "Continue routine prenatal care",
                "monitoring": "Standard prenatal glucose screening as scheduled",
                "lifestyle": "Maintain healthy lifestyle with balanced diet and exercise",
                "follow_up": "Regular prenatal appointments as planned"
            }

        logger.info(f"✅ Final prediction: {prediction_label} ({gdm_probability:.3f}), Risk: {risk_category}")

        return {
            'prediction': prediction_label,
            'gdm_probability': gdm_probability,
            'non_gdm_probability': non_gdm_probability,
            'risk_category': risk_category,
            'confidence': confidence,
            'risk_factors': risk_factors,
            'clinical_recommendations': recommendations
        }

    except Exception as e:
        logger.error(f"❌ Error in prediction: {str(e)}\n{traceback.format_exc()}")
        raise ValueError(f"Prediction failed: {str(e)}")


# ============================================
# PREDICTION ENDPOINT
# ============================================

@app.post("/predict", response_model=PredictionResponse)
async def predict(patient_data: PatientData):
    """
    Make a prediction for gestational diabetes.

    Takes patient data including BMI and OGTT (critical features) and returns 
    prediction with probabilities, risk factors, and clinical recommendations.
    """
    try:
        # Convert PatientData to dict and make prediction
        data_dict = patient_data.model_dump(by_alias=True)
        
        logger.info(f"🔍 Received prediction request")
        logger.info(f"📊 Key features - Age: {data_dict['Age']}, BMI: {data_dict['BMI']}, OGTT: {data_dict['OGTT']}")
        
        prediction_result = predict_gdm(data_dict)

        return PredictionResponse(
            success=True,
            **prediction_result,
            timestamp=datetime.now().isoformat(),
            model_version=model_metadata['version'] if model_metadata else "unknown",
            message="Prediction completed successfully with fixed models"
        )

    except Exception as e:
        logger.error(f"❌ Error in prediction endpoint: {str(e)}\n{traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )


# ============================================
# TEST ENDPOINTS
# ============================================

@app.post("/test/high-risk")
async def test_high_risk():
    """Test with a high-risk patient profile"""
    high_risk_data = PatientData(
        Age=38,
        **{"No of Pregnancy": 3},
        **{"Gestation in previous Pregnancy": 1},
        BMI=32.5,  # Obese
        OGTT=180,  # High glucose
        HDL=35,    # Low HDL
        **{"Family History": 1},  # Yes
        **{"unexplained prenetal loss": 1},  # Yes
        **{"Large Child or Birth Default": 1},  # Yes
        PCOS=1,    # Yes
        **{"Sys BP": 145},  # High
        **{"Dia BP": 95},   # High
        Hemoglobin=10.5,  # Low
        **{"Sedentary Lifestyle": 1},  # Yes
        Prediabetes=1  # Yes
    )
    
    return await predict(high_risk_data)


@app.post("/test/low-risk")
async def test_low_risk():
    """Test with a low-risk patient profile"""
    low_risk_data = PatientData(
        Age=25,
        **{"No of Pregnancy": 1},
        **{"Gestation in previous Pregnancy": 0},
        BMI=22.5,  # Normal
        OGTT=115,  # Normal
        HDL=60,    # Good
        **{"Family History": 0},  # No
        **{"unexplained prenetal loss": 0},  # No
        **{"Large Child or Birth Default": 0},  # No
        PCOS=0,    # No
        **{"Sys BP": 110},  # Normal
        **{"Dia BP": 70},   # Normal
        Hemoglobin=12.5,  # Normal
        **{"Sedentary Lifestyle": 0},  # No
        Prediabetes=0  # No
    )
    
    return await predict(low_risk_data)


# ============================================
# HEALTH & INFO ENDPOINTS
# ============================================

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    model_loaded = model_components is not None
    
    health_status = {
        "status": "healthy" if model_loaded else "degraded",
        "model_loaded": model_loaded,
        "timestamp": datetime.now().isoformat()
    }
    
    if model_loaded and model_metadata:
        health_status.update({
            "model_version": model_metadata['version'],
            "problem_type": model_metadata.get('problem_type', 'unknown'),
            "best_model": model_metadata.get('best_model', 'unknown'),
            "best_f1_score": model_metadata.get('best_f1', 'unknown'),
            "features_count": len(model_metadata.get('feature_columns', [])),
            "fixes_applied": model_metadata.get('fixes_applied', [])
        })
    
    return health_status


@app.get("/model-info")
async def model_info():
    """Get detailed model information"""
    if model_components is None or model_metadata is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    info = {
        "model_version": model_metadata['version'],
        "timestamp": model_metadata['timestamp'],
        "problem_type": model_metadata['problem_type'],
        "best_model": model_metadata.get('best_model', 'Unknown'),
        "performance_metrics": {
            "best_f1": model_metadata.get('best_f1', 'Unknown'),
            "best_accuracy": model_metadata.get('best_accuracy', 'Unknown'),
            "best_precision": model_metadata.get('best_precision', 'Unknown'),
            "best_recall": model_metadata.get('best_recall', 'Unknown'),
        },
        "feature_columns": model_metadata.get('feature_columns', []),
        "critical_features": model_metadata.get('critical_features', ['BMI', 'OGTT']),
        "saved_models": list(model_metadata.get('saved_models', {}).keys()),
        "fixes_applied": model_metadata.get('fixes_applied', []),
        "validation_status": model_metadata.get('validation', {})
    }
    
    return info


@app.get("/")
async def root():
    """Root endpoint"""
    model_status = "loaded" if model_components is not None else "not loaded"
    model_version = model_metadata.get('version', 'unknown') if model_metadata else 'unknown'
    
    return {
        "message": "Gestational Diabetes Prediction API - Fixed Models",
        "version": "2.0.0",
        "status": "running",
        "model_status": model_status,
        "model_version": model_version,
        "critical_features": ["BMI", "OGTT"],
        "endpoints": {
            "prediction": "/predict",
            "test_high_risk": "/test/high-risk", 
            "test_low_risk": "/test/low-risk",
            "health": "/health",
            "model_info": "/model-info",
            "docs": "/docs"
        }
    }


if __name__ == "__main__":
    import uvicorn
    # Updated to match your filename ⬇️
    uvicorn.run("gdm_backend:app", host="0.0.0.0", port=8000, reload=True)