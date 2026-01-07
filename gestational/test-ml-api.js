// Test script to verify ML API parameters
const axios = require('axios');

const ML_API_URL = 'https://gestation-backend.onrender.com';

// Test data - HIGH RISK GDM case
const highRiskData = {
  'Age': 35,
  'No of Pregnancy': 4,
  'Gestation in previous Pregnancy': 38,
  'BMI': 32.5,
  'OGTT': 200,
  'HDL': 35,
  'Hemoglobin': 10.5,
  'Sys BP': 150,
  'Dia BP': 95,
  'Family History': 1,
  'unexplained prenetal loss': 1,
  'Large Child or Birth Default': 1,
  'PCOS': 1,
  'Sedentary Lifestyle': 1,
  'Prediabetes': 1
};

// Test data - LOW RISK case
const lowRiskData = {
  'Age': 25,
  'No of Pregnancy': 1,
  'Gestation in previous Pregnancy': 0,
  'BMI': 22,
  'OGTT': 95,
  'HDL': 60,
  'Hemoglobin': 13.5,
  'Sys BP': 110,
  'Dia BP': 70,
  'Family History': 0,
  'unexplained prenetal loss': 0,
  'Large Child or Birth Default': 0,
  'PCOS': 0,
  'Sedentary Lifestyle': 0,
  'Prediabetes': 0
};

async function testMLAPI() {
  console.log('\n========================================');
  console.log('Testing ML API with HIGH RISK data');
  console.log('========================================\n');
  console.log('Sending data:', JSON.stringify(highRiskData, null, 2));

  try {
    const response1 = await axios.post(`${ML_API_URL}/predict`, highRiskData);
    console.log('\n--- HIGH RISK RESPONSE ---');
    console.log(JSON.stringify(response1.data, null, 2));
  } catch (error) {
    console.error('Error with HIGH RISK:', error.message);
    console.error('Details:', error.response?.data);
  }

  console.log('\n========================================');
  console.log('Testing ML API with LOW RISK data');
  console.log('========================================\n');
  console.log('Sending data:', JSON.stringify(lowRiskData, null, 2));

  try {
    const response2 = await axios.post(`${ML_API_URL}/predict`, lowRiskData);
    console.log('\n--- LOW RISK RESPONSE ---');
    console.log(JSON.stringify(response2.data, null, 2));
  } catch (error) {
    console.error('Error with LOW RISK:', error.message);
    console.error('Details:', error.response?.data);
  }

  // Test with your actual averages
  console.log('\n========================================');
  console.log('Testing ML API with AVERAGE VALUES');
  console.log('========================================\n');

  const averageData = {
    'Age': 28.5,
    'No of Pregnancy': 2,
    'Gestation in previous Pregnancy': 38.0,
    'BMI': 27.85,
    'OGTT': 170.70,
    'HDL': 46.47,
    'Hemoglobin': 13.95,
    'Sys BP': 135.76,
    'Dia BP': 81.53,
    'Family History': 0,
    'unexplained prenetal loss': 0,
    'Large Child or Birth Default': 0,
    'PCOS': 0,
    'Sedentary Lifestyle': 0,
    'Prediabetes': 0
  };

  console.log('Sending data:', JSON.stringify(averageData, null, 2));

  try {
    const response3 = await axios.post(`${ML_API_URL}/predict`, averageData);
    console.log('\n--- AVERAGE VALUES RESPONSE ---');
    console.log(JSON.stringify(response3.data, null, 2));
  } catch (error) {
    console.error('Error with AVERAGE:', error.message);
    console.error('Details:', error.response?.data);
  }
}

testMLAPI().then(() => {
  console.log('\n========================================');
  console.log('Test completed!');
  console.log('========================================\n');
}).catch(err => {
  console.error('Test failed:', err);
});
