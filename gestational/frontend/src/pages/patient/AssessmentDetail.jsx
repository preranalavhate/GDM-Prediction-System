import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  ArrowLeft,
  Calendar,
  User,
  Activity,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const AssessmentDetail = () => {
  const { assessmentId } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessmentDetail();
  }, [assessmentId]);

  const fetchAssessmentDetail = async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(
        `${API_URL}/assessments/${assessmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssessment(response.data.assessment);
    } catch (error) {
      console.error('Error fetching assessment:', error);
      toast.error('Failed to load assessment details');
    } finally {
      setLoading(false);
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

  const getStatusIcon = (status) => {
    return status === 'completed' ? (
      <CheckCircle className="w-5 h-5 text-green-600" />
    ) : (
      <Clock className="w-5 h-5 text-yellow-600" />
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Assessment Not Found</h2>
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="btn-primary mt-4"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Assessment Details</h1>
                <p className="text-sm text-gray-600">View your assessment results</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status and Risk Card */}
        <div className="card mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              {getStatusIcon(assessment.status)}
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {assessment.status === 'completed' ? 'Reviewed by Doctor' : 'Pending Doctor Review'}
                </h2>
                <p className="text-sm text-gray-600">
                  {assessment.createdAt && new Date(
                    assessment.createdAt.toDate ? assessment.createdAt.toDate() : assessment.createdAt
                  ).toLocaleString()}
                </p>
              </div>
            </div>
            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getRiskColor(assessment.riskCategory)}`}>
              {assessment.riskCategory}
            </span>
          </div>

          {/* Doctor Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">Consulting Doctor</p>
                <p className="font-semibold text-gray-800">{assessment.doctorName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Prediction Results */}
        <div className="card mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary-600" />
            AI Prediction Results
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className={`rounded-lg p-4 ${assessment.prediction === 'GDM' ? 'bg-red-50 border-2 border-red-300' : 'bg-blue-50'}`}>
              <p className={`text-sm mb-1 ${assessment.prediction === 'GDM' ? 'text-red-600' : 'text-blue-600'}`}>Prediction</p>
              <p className={`text-2xl font-bold ${assessment.prediction === 'GDM' ? 'text-red-800' : 'text-blue-800'}`}>
                {assessment.prediction}
              </p>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-sm text-green-600 mb-1">Model Confidence</p>
              <p className="text-2xl font-bold text-green-800">
                {(assessment.confidence * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* Probabilities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-purple-50 rounded-lg p-4">
              <p className="text-sm text-purple-600 mb-1">GDM Probability</p>
              <p className="text-2xl font-bold text-purple-800">
                {(assessment.gdmProbability * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Probability of having GDM</p>
            </div>

            <div className="bg-cyan-50 rounded-lg p-4">
              <p className="text-sm text-cyan-600 mb-1">Non-GDM Probability</p>
              <p className="text-2xl font-bold text-cyan-800">
                {(assessment.nonGdmProbability * 100).toFixed(2)}%
              </p>
              <p className="text-xs text-gray-600 mt-1">Probability of NOT having GDM</p>
            </div>
          </div>

          {/* Risk Factors */}
          {assessment.riskFactors && (
            <div className="mt-6">
              <h4 className="font-semibold text-gray-800 mb-3">Identified Risk Factors:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(assessment.riskFactors).map(([key, value]) => {
                  if (value) {
                    return (
                      <div key={key} className="flex items-center gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-gray-700">
                          {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </div>
          )}
        </div>

        {/* Doctor's Review (if completed) */}
        {assessment.status === 'completed' && assessment.diagnosis && (
          <div className="card mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary-600" />
              Doctor's Review
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Final Diagnosis</p>
                <p className="text-lg font-semibold text-gray-800">{assessment.diagnosis}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Recommendations</p>
                <p className="text-gray-700 whitespace-pre-wrap">{assessment.recommendations}</p>
              </div>

              {assessment.notes && (
                <div>
                  <p className="text-sm text-gray-600 mb-1">Additional Notes</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{assessment.notes}</p>
                </div>
              )}

              <div className="bg-primary-50 rounded-lg p-4 mt-4">
                <p className="text-sm text-primary-600 mb-1">Final Verdict</p>
                <p className="text-xl font-bold text-primary-800">{assessment.finalVerdict}</p>
              </div>

              {assessment.reviewedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Reviewed on {new Date(
                      assessment.reviewedAt.toDate
                        ? assessment.reviewedAt.toDate()
                        : assessment.reviewedAt
                    ).toLocaleString()}
                  </span>
                </div>
              )}

              {assessment.reviewedBy && (
                <div className="mt-2 text-sm text-gray-600">
                  <p>Reviewed by: Dr. {assessment.doctorName}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Patient Data */}
        <div className="card">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Assessment Data</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {assessment.patientData && Object.entries(assessment.patientData).map(([key, value]) => (
              <div key={key} className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-600 text-xs mb-1">{key}</p>
                <p className="font-semibold text-gray-800">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-6">
          <button
            onClick={() => navigate('/patient/dashboard')}
            className="btn-primary"
          >
            Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
};

export default AssessmentDetail;
