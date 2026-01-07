/**
 * Default average values for GDM prediction parameters
 * These values will be used when a field is left empty by the user
 *
 * INSTRUCTIONS: Replace the placeholder values with actual averages from your dataset
 * Example: If average age in your dataset is 28.5, change 'REPLACE_WITH_AVERAGE' to 28.5
 */

export const PARAMETER_AVERAGES = {
  // Personal Information
  'Age': 28.5, // REPLACE_WITH_AVERAGE - Average age in years
  'No of Pregnancy': 2, // REPLACE_WITH_AVERAGE - Average number of pregnancies
  'Gestation in previous Pregnancy': 38.0, // REPLACE_WITH_AVERAGE - Average gestation weeks

  // Lab Results - CRITICAL FOR GDM PREDICTION
  'BMI': 27.85, // REPLACE_WITH_AVERAGE - Average Body Mass Index (kg/m²)
  'OGTT': 170.70, // REPLACE_WITH_AVERAGE - Average OGTT (Oral Glucose Tolerance Test) mg/dL
  'HDL': 46.47, // REPLACE_WITH_AVERAGE - Average HDL cholesterol (mg/dL)
  'Hemoglobin': 13.95, // REPLACE_WITH_AVERAGE - Average hemoglobin (g/dL)

  // Vital Signs
  'Sys BP': 135.76, // REPLACE_WITH_AVERAGE - Average systolic blood pressure (mmHg)
  'Dia BP': 81.53, // REPLACE_WITH_AVERAGE - Average diastolic blood pressure (mmHg)

  // Binary/Categorical Features (0 = No, 1 = Yes)
  // These are typically 0 (most common case is "No")
  'Family History': 0,
  'unexplained prenetal loss': 0,
  'Large Child or Birth Default': 0,
  'PCOS': 0,
  'Sedentary Lifestyle': 0,
  'Prediabetes': 0
};

/**
 * Field information for display purposes
 */
export const FIELD_INFO = {
  'Age': {
    label: 'Age',
    unit: 'years',
    min: 15,
    max: 60,
    step: 1,
    type: 'number',
    section: 'personal',
    required: false,
    description: 'Your current age in years'
  },
  'No of Pregnancy': {
    label: 'Number of Pregnancies',
    unit: '',
    min: 0,
    max: 20,
    step: 1,
    type: 'number',
    section: 'personal',
    required: false,
    description: 'Total number of pregnancies including current'
  },
  'Gestation in previous Pregnancy': {
    label: 'Gestation in Previous Pregnancy',
    unit: 'weeks',
    min: 0,
    max: 45,
    step: 0.1,
    type: 'number',
    section: 'personal',
    required: false,
    description: 'Enter 0 if this is your first pregnancy'
  },
  'BMI': {
    label: 'BMI (Body Mass Index)',
    unit: 'kg/m²',
    min: 10,
    max: 60,
    step: 0.1,
    type: 'number',
    section: 'lab',
    required: false,
    description: 'Body Mass Index - weight in kg / (height in m)²'
  },
  'OGTT': {
    label: 'OGTT (Oral Glucose Tolerance Test)',
    unit: 'mg/dL',
    min: 50,
    max: 700,
    step: 1,
    type: 'number',
    section: 'lab',
    required: false,
    description: 'Blood glucose level after 2-hour glucose tolerance test'
  },
  'HDL': {
    label: 'HDL Cholesterol',
    unit: 'mg/dL',
    min: 10,
    max: 150,
    step: 0.1,
    type: 'number',
    section: 'lab',
    required: false,
    description: 'HDL (good) cholesterol level'
  },
  'Hemoglobin': {
    label: 'Hemoglobin',
    unit: 'g/dL',
    min: 5,
    max: 20,
    step: 0.1,
    type: 'number',
    section: 'lab',
    required: false,
    description: 'Hemoglobin level from blood test'
  },
  'Sys BP': {
    label: 'Systolic Blood Pressure',
    unit: 'mmHg',
    min: 70,
    max: 200,
    step: 1,
    type: 'number',
    section: 'vitals',
    required: false,
    description: 'The upper number in blood pressure reading'
  },
  'Dia BP': {
    label: 'Diastolic Blood Pressure',
    unit: 'mmHg',
    min: 40,
    max: 130,
    step: 1,
    type: 'number',
    section: 'vitals',
    required: false,
    description: 'The lower number in blood pressure reading'
  },
  'Family History': {
    label: 'Family History of Diabetes',
    type: 'select',
    section: 'history',
    required: true,
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' }
    ],
    description: 'Does anyone in your immediate family have diabetes?'
  },
  'unexplained prenetal loss': {
    label: 'Unexplained Prenatal Loss',
    type: 'select',
    section: 'history',
    required: true,
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' }
    ],
    description: 'Have you experienced unexplained pregnancy loss?'
  },
  'Large Child or Birth Default': {
    label: 'Large Child or Birth Defect (Previous)',
    type: 'select',
    section: 'history',
    required: true,
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' }
    ],
    description: 'Previous pregnancy with large baby (>4kg) or birth defect?'
  },
  'PCOS': {
    label: 'PCOS (Polycystic Ovary Syndrome)',
    type: 'select',
    section: 'history',
    required: true,
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' }
    ],
    description: 'Have you been diagnosed with PCOS?'
  },
  'Sedentary Lifestyle': {
    label: 'Sedentary Lifestyle',
    type: 'select',
    section: 'history',
    required: true,
    options: [
      { value: '0', label: 'No (Active)' },
      { value: '1', label: 'Yes (Sedentary)' }
    ],
    description: 'Do you have limited physical activity?'
  },
  'Prediabetes': {
    label: 'Prediabetes',
    type: 'select',
    section: 'history',
    required: true,
    options: [
      { value: '0', label: 'No' },
      { value: '1', label: 'Yes' }
    ],
    description: 'Have you been diagnosed with prediabetes?'
  }
};

/**
 * Helper function to get default value for a parameter
 */
export const getDefaultValue = (parameterName) => {
  return PARAMETER_AVERAGES[parameterName] ?? '';
};

/**
 * Helper function to apply defaults to form data
 * Only applies defaults to empty numeric fields
 */
export const applyDefaults = (formData) => {
  const processedData = {};

  Object.keys(PARAMETER_AVERAGES).forEach(key => {
    const value = formData[key];
    const fieldInfo = FIELD_INFO[key];

    // For numeric fields, use default if empty
    if (fieldInfo?.type === 'number') {
      if (value === '' || value === null || value === undefined) {
        processedData[key] = PARAMETER_AVERAGES[key];
      } else {
        processedData[key] = parseFloat(value);
      }
    }
    // For select fields, use provided value or default
    else {
      processedData[key] = value !== '' && value !== null && value !== undefined
        ? parseInt(value)
        : PARAMETER_AVERAGES[key];
    }
  });

  return processedData;
};

/**
 * Helper function to validate parameter ranges
 */
export const validateParameter = (parameterName, value) => {
  const fieldInfo = FIELD_INFO[parameterName];

  if (!fieldInfo || value === '' || value === null || value === undefined) {
    return { valid: true }; // Empty values are allowed (will use defaults)
  }

  if (fieldInfo.type === 'number') {
    const numValue = parseFloat(value);

    if (isNaN(numValue)) {
      return { valid: false, message: 'Must be a valid number' };
    }

    if (fieldInfo.min !== undefined && numValue < fieldInfo.min) {
      return { valid: false, message: `Must be at least ${fieldInfo.min}` };
    }

    if (fieldInfo.max !== undefined && numValue > fieldInfo.max) {
      return { valid: false, message: `Must be at most ${fieldInfo.max}` };
    }
  }

  return { valid: true };
};
