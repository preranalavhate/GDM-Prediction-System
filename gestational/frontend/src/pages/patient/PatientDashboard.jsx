import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  FileText,
  Clock,
  CheckCircle,
  Plus,
  LogOut,
  Activity,
  TrendingUp
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5001/api';

const PatientDashboard = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [currentUser]);

  const fetchDashboardData = async () => {
    if (!currentUser) return;

    try {
      const token = await currentUser.getIdToken();
      const response = await axios.get(
        `${API_URL}/patients/${currentUser.uid}/dashboard`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStats(response.data.stats);
      setRecentAssessments(response.data.recentAssessments);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Failed to logout');
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Heart className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  Welcome, {userData?.name}
                </h1>
                <p className="text-sm text-gray-600">Patient Dashboard</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Assessments</p>
                <p className="text-3xl font-bold">{stats?.totalAssessments || 0}</p>
              </div>
              <FileText className="w-12 h-12 text-blue-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm mb-1">Pending Reviews</p>
                <p className="text-3xl font-bold">{stats?.pendingReviews || 0}</p>
              </div>
              <Clock className="w-12 h-12 text-yellow-200" />
            </div>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold">{stats?.completedAssessments || 0}</p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-200" />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/patient/new-assessment')}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Assessment
          </button>
        </div>

        {/* Recent Assessments */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary-600" />
              Recent Assessments
            </h2>
            <button
              onClick={() => navigate('/patient/assessments')}
              className="text-primary-600 hover:text-primary-700 text-sm font-semibold"
            >
              View All →
            </button>
          </div>

          {recentAssessments.length === 0 ? (
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
              {recentAssessments.map((assessment) => (
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
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
