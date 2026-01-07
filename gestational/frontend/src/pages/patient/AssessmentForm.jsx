import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  ArrowLeft,
  Loader2,
  Activity,
  Info,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { applyDefaults } from '../../constants/parameterDefaults';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const AssessmentForm = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const doctor = location.state?.doctor;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    Age: '',
    'No of Pregnancy': '',
    'Gestation in previous Pregnancy': '',
    BMI: '',
    OGTT: '',
    HDL: '',
    'Family History': '0',
    'unexplained prenetal loss': '0',
    'Large Child or Birth Default': '0',
    PCOS: '0',
    'Sys BP': '',
    'Dia BP': '',
    Hemoglobin: '',
    'Sedentary Lifestyle': '0',
    Prediabetes: '0'
  });

  if (!doctor) {
    navigate('/patient/new-assessment');
    return null;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = await currentUser.getIdToken();

      // Apply default values for empty fields
      const patientData = applyDefaults(formData);

      // Submit assessment
      const response = await axios.post(
        `${API_URL}/assessments`,
        {
          patientId: currentUser.uid,
          doctorId: doctor.id,
          doctorName: doctor.name,
          patientName: userData.name,
          patientData
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Assessment submitted successfully!');
      navigate(`/patient/assessment/${response.data.assessmentId}`);
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error(error.response?.data?.error || 'Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/patient/new-assessment')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Medical Assessment Form</h1>
                <p className="text-sm text-gray-600">Assigned to: Dr. {doctor.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Info Box - Optional Fields */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">About This Form</p>
              <p>
                All numeric fields are <strong>optional</strong>. If you don't have certain test results,
                you can leave those fields empty and our system will use statistical averages for prediction.
                However, providing actual values will give more accurate results.
              </p>
            </div>
          </div>

          {/* Personal Information */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary-600" />
              Personal Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Age (years)
                  <span className="text-xs text-gray-500 ml-2">(optional)</span>
                </label>
                <input
                  type="number"
                  name="Age"
                  value={formData.Age}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Leave empty if unknown"
                  min="15"
                  max="60"
                  step="1"
                />
              </div>

              <div>
                <label className="label">
                  Number of Pregnancies
                  <span className="text-xs text-gray-500 ml-2">(optional)</span>
                </label>
                <input
                  type="number"
                  name="No of Pregnancy"
                  value={formData['No of Pregnancy']}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Leave empty if unknown"
                  min="0"
                  max="20"
                />
              </div>

              <div>
                <label className="label">
                  Gestation in Previous Pregnancy (weeks)
                  <span className="text-xs text-gray-500 ml-2">(0 if first pregnancy, optional)</span>
                </label>
                <input
                  type="number"
                  name="Gestation in previous Pregnancy"
                  value={formData['Gestation in previous Pregnancy']}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="Enter 0 if first pregnancy"
                  min="0"
                  max="45"
                  step="0.1"
                />
              </div>
            </div>
          </div>

          {/* Medical History */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Medical History</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Family History of Diabetes</label>
                <select
                  name="Family History"
                  value={formData['Family History']}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>

              <div>
                <label className="label">Unexplained Prenatal Loss</label>
                <select
                  name="unexplained prenetal loss"
                  value={formData['unexplained prenetal loss']}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>

              <div>
                <label className="label">Large Child or Birth Defect (Previous)</label>
                <select
                  name="Large Child or Birth Default"
                  value={formData['Large Child or Birth Default']}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>

              <div>
                <label className="label">PCOS (Polycystic Ovary Syndrome)</label>
                <select
                  name="PCOS"
                  value={formData.PCOS}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>

              <div>
                <label className="label">Prediabetes</label>
                <select
                  name="Prediabetes"
                  value={formData.Prediabetes}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="0">No</option>
                  <option value="1">Yes</option>
                </select>
              </div>

              <div>
                <label className="label">Sedentary Lifestyle</label>
                <select
                  name="Sedentary Lifestyle"
                  value={formData['Sedentary Lifestyle']}
                  onChange={handleChange}
                  className="input-field"
                  required
                >
                  <option value="0">No (Active)</option>
                  <option value="1">Yes (Sedentary)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Vital Signs & Lab Results */}
          <div className="card">
            <h2 className="text-lg font-bold text-gray-800 mb-4">Vital Signs & Lab Results</h2>
            <p className="text-sm text-gray-600 mb-4">
              These values typically come from blood tests and routine checkups. Leave empty if not available.
            </p>

            {/* CRITICAL GDM INDICATORS - Highlighted */}
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
              <p className="text-sm font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Important: BMI and OGTT are critical for accurate GDM prediction
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="label">
                    BMI - Body Mass Index (kg/m²)
                    <span className="text-xs text-red-500 ml-2">(highly recommended)</span>
                  </label>
                  <input
                    type="number"
                    name="BMI"
                    value={formData.BMI}
                    onChange={handleChange}
                    className="input-field border-yellow-300 focus:border-yellow-500"
                    placeholder="e.g., 25.0"
                    min="10"
                    max="60"
                    step="0.1"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Calculate: Weight (kg) ÷ [Height (m)]²
                  </p>
                </div>

                <div>
                  <label className="label">
                    OGTT - Glucose Tolerance Test (mg/dL)
                    <span className="text-xs text-red-500 ml-2">(highly recommended)</span>
                  </label>
                  <input
                    type="number"
                    name="OGTT"
                    value={formData.OGTT}
                    onChange={handleChange}
                    className="input-field border-yellow-300 focus:border-yellow-500"
                    placeholder="e.g., 140"
                    min="50"
                    max="700"
                    step="1"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    2-hour oral glucose tolerance test result
                  </p>
                </div>
              </div>
            </div>

            {/* Other Lab Results */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  Systolic Blood Pressure (mmHg)
                  <span className="text-xs text-gray-500 ml-2">(optional)</span>
                </label>
                <input
                  type="number"
                  name="Sys BP"
                  value={formData['Sys BP']}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., 120"
                  min="70"
                  max="200"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">Upper number in BP reading</p>
              </div>

              <div>
                <label className="label">
                  Diastolic Blood Pressure (mmHg)
                  <span className="text-xs text-gray-500 ml-2">(optional)</span>
                </label>
                <input
                  type="number"
                  name="Dia BP"
                  value={formData['Dia BP']}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., 80"
                  min="40"
                  max="130"
                  step="1"
                />
                <p className="text-xs text-gray-500 mt-1">Lower number in BP reading</p>
              </div>

              <div>
                <label className="label">
                  HDL Cholesterol (mg/dL)
                  <span className="text-xs text-gray-500 ml-2">(optional)</span>
                </label>
                <input
                  type="number"
                  name="HDL"
                  value={formData.HDL}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., 50"
                  min="10"
                  max="150"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">Good cholesterol from blood test</p>
              </div>

              <div>
                <label className="label">
                  Hemoglobin (g/dL)
                  <span className="text-xs text-gray-500 ml-2">(optional)</span>
                </label>
                <input
                  type="number"
                  name="Hemoglobin"
                  value={formData.Hemoglobin}
                  onChange={handleChange}
                  className="input-field"
                  placeholder="e.g., 12.5"
                  min="5"
                  max="20"
                  step="0.1"
                />
                <p className="text-xs text-gray-500 mt-1">From complete blood count test</p>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Important Information</p>
              <p>
                Your data will be analyzed by our AI model and reviewed by Dr. {doctor.name}.
                All information is confidential and secure.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/patient/new-assessment')}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Submitting Assessment...
                </>
              ) : (
                'Submit Assessment'
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AssessmentForm;
