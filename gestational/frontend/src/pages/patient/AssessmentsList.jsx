import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  ArrowLeft,
  Activity,
  TrendingUp,
  Plus
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5001/api';

const AssessmentsList = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAssessments();
  }, [currentUser]);

  const fetchAssessments = async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(
        `${API_URL}/patients/${currentUser.uid}/assessments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAssessments(response.data.assessments || []);
    } catch (error) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to load assessments');
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

  const getStatusColor = (status) => {
    return status === 'completed'
      ? 'bg-green-100 text-green-800'
      : 'bg-yellow-100 text-yellow-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
                <h1 className="text-xl font-bold text-gray-800">My Assessments</h1>
                <p className="text-sm text-gray-600">{userData?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Assessment Button */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/patient/new-assessment')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Assessment
          </button>
        </div>

        {/* Assessments List */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <Activity className="w-6 h-6 text-primary-600" />
            All Assessments ({assessments.length})
          </h2>

          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No assessments yet</p>
              <button
                onClick={() => navigate('/patient/new-assessment')}
                className="btn-primary"
              >
                Create Your First Assessment
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => (
                <div
                  key={assessment.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition cursor-pointer"
                  onClick={() => navigate(`/patient/assessment/${assessment.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskColor(assessment.riskCategory)}`}>
                          {assessment.riskCategory}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(assessment.status)}`}>
                          {assessment.status === 'completed' ? 'Reviewed' : 'Pending Review'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Doctor: {assessment.doctorName}
                      </p>
                    </div>
                    <div className="text-right text-sm text-gray-500">
                      {assessment.createdAt && new Date(
                        assessment.createdAt.toDate ? assessment.createdAt.toDate() : assessment.createdAt
                      ).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Prediction: </span>
                      <span className="font-semibold text-gray-800">{assessment.prediction}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Confidence: </span>
                      <span className="font-semibold text-gray-800">
                        {(assessment.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {assessment.status === 'completed' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        Final Verdict: <span className="font-semibold text-primary-600">
                          {assessment.doctorReview?.finalVerdict}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AssessmentsList;
