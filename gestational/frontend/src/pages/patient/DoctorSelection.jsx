import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Heart,
  UserCheck,
  Building,
  Award,
  ArrowLeft,
  Loader2
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:5001/api';

const DoctorSelection = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await axios.get(`${API_URL}/doctors`);
      setDoctors(response.data.doctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDoctor = (doctor) => {
    setSelectedDoctor(doctor);
    // Navigate to assessment form with selected doctor
    navigate('/patient/assessment-form', { state: { doctor } });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading doctors...</p>
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
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-primary-600 p-2 rounded-lg">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Select a Doctor</h1>
                <p className="text-sm text-gray-600">Choose a doctor to review your assessment</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {doctors.length === 0 ? (
          <div className="card text-center py-12">
            <UserCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No doctors available at the moment</p>
            <button
              onClick={() => navigate('/patient/dashboard')}
              className="btn-primary"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div
                key={doctor.id}
                className="card hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => handleSelectDoctor(doctor)}
              >
                {/* Doctor Avatar */}
                <div className="flex items-center justify-center mb-4">
                  <div className="bg-gradient-to-br from-primary-500 to-primary-700 w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {doctor.name.charAt(0).toUpperCase()}
                  </div>
                </div>

                {/* Doctor Info */}
                <div className="text-center mb-4">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">
                    Dr. {doctor.name}
                  </h3>
                  <p className="text-sm text-primary-600 font-semibold mb-3">
                    <Award className="w-4 h-4 inline mr-1" />
                    {doctor.specialization}
                  </p>
                </div>

                {/* Doctor Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Building className="w-4 h-4 text-gray-400" />
                    <span>{doctor.hospital}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Heart className="w-4 h-4 text-gray-400" />
                    <span>License: {doctor.license}</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 mb-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {doctor.totalPatients || 0}
                    </p>
                    <p className="text-xs text-gray-600">Patients</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary-600">
                      {doctor.totalAssessments || 0}
                    </p>
                    <p className="text-xs text-gray-600">Assessments</p>
                  </div>
                </div>

                {/* Select Button */}
                <button className="w-full btn-primary">
                  Select Doctor
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default DoctorSelection;
