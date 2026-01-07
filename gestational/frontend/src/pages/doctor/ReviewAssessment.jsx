import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  ArrowLeft,
  Loader2,
  User,
  Activity,
  CheckCircle,
  AlertTriangle,
  FileText
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5001/api';

const ReviewAssessment = () => {
  const { assessmentId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [reviewData, setReviewData] = useState({
    diagnosis: '',
    recommendations: '',
    finalVerdict: '',
    notes: ''
  });

  useEffect(() => {
    fetchAssessment();
  }, [assessmentId]);

  const fetchAssessment = async () => {
    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(
        `${API_URL}/assessments/${assessmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssessment(response.data.assessment);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error('Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setReviewData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = await currentUser.getIdToken();
      await axios.post(
        `${API_URL}/assessments/${assessmentId}/review`,
        reviewData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Review submitted successfully!');
      navigate('/doctor/dashboard');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const getRiskColor = (category) => {
    switch (category) {
      case 'High Risk':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Moderate Risk':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Low Risk':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading assessment...</p>
        </div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Assessment not found</p>
          <button onClick={() => navigate('/doctor/dashboard')} className="btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/doctor/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Review Assessment</h1>
                <p className="text-sm text-gray-600">
                  Patient: {assessment.patientInfo?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - AI Results & Patient Data */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Prediction Results */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-600" />
                AI Prediction Results
              </h2>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Risk Category</p>
                  <span className={`inline-block px-4 py-2 rounded-lg text-sm font-semibold border ${getRiskColor(assessment.riskCategory)}`}>
                    {assessment.riskCategory}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Prediction</p>
                  <p className="text-lg font-bold text-gray-800">{assessment.prediction}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">GDM Probability</p>
                  <p className="text-2xl font-bold text-red-600">
                    {(assessment.gdmProbability * 100).toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Model Confidence</p>
                  <p className="text-2xl font-bold text-primary-600">
                    {(assessment.confidence * 100).toFixed(1)}%
                  </p>
                </div>
              </div>

              {/* Risk Factors */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-800 mb-3">Identified Risk Factors</h3>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(assessment.riskFactors || {}).map(([key, value]) => (
                    value && (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        {value ? (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        <span className={value ? 'text-red-700' : 'text-green-700'}>
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            </div>

            {/* Patient Medical Data */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-primary-600" />
                Patient Medical Data
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                {Object.entries(assessment.patientData || {}).map(([key, value]) => (
                  <div key={key} className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-gray-600 mb-1 text-xs">{key}</p>
                    <p className="font-semibold text-gray-800">
                      {typeof value === 'number' ? value.toFixed(1) : value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Doctor's Review Form */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="text-lg font-bold text-gray-800 mb-4">
                Your Medical Review
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Final Verdict *</label>
                  <select
                    name="finalVerdict"
                    value={reviewData.finalVerdict}
                    onChange={handleChange}
                    className="input-field"
                    required
                  >
                    <option value="">Select verdict</option>
                    <option value="GDM Confirmed">GDM Confirmed</option>
                    <option value="No GDM">No GDM</option>
                    <option value="Further Testing Required">Further Testing Required</option>
                  </select>
                </div>

                <div>
                  <label className="label">Diagnosis *</label>
                  <textarea
                    name="diagnosis"
                    value={reviewData.diagnosis}
                    onChange={handleChange}
                    className="input-field"
                    rows="4"
                    placeholder="Enter your professional diagnosis..."
                    required
                  />
                </div>

                <div>
                  <label className="label">Recommendations *</label>
                  <textarea
                    name="recommendations"
                    value={reviewData.recommendations}
                    onChange={handleChange}
                    className="input-field"
                    rows="4"
                    placeholder="Treatment plan, lifestyle changes, follow-ups..."
                    required
                  />
                </div>

                <div>
                  <label className="label">Additional Notes</label>
                  <textarea
                    name="notes"
                    value={reviewData.notes}
                    onChange={handleChange}
                    className="input-field"
                    rows="3"
                    placeholder="Any additional observations or notes..."
                  />
                </div>

                <div className="pt-4 space-y-3">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary w-full flex items-center justify-center"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5 mr-2" />
                        Submit Review
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => navigate('/doctor/dashboard')}
                    className="btn-secondary w-full"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ReviewAssessment;
