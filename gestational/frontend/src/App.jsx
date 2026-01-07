import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Patient Pages
import PatientDashboard from './pages/patient/PatientDashboard';
import DoctorSelection from './pages/patient/DoctorSelection';
import AssessmentForm from './pages/patient/AssessmentForm';
import AssessmentsList from './pages/patient/AssessmentsList';
import AssessmentDetail from './pages/patient/AssessmentDetail';

// Doctor Pages
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import ReviewAssessment from './pages/doctor/ReviewAssessment';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen">
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Patient Routes */}
            <Route
              path="/patient/dashboard"
              element={
                <ProtectedRoute allowedRole="patient">
                  <PatientDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/new-assessment"
              element={
                <ProtectedRoute allowedRole="patient">
                  <DoctorSelection />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/assessment-form"
              element={
                <ProtectedRoute allowedRole="patient">
                  <AssessmentForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/assessments"
              element={
                <ProtectedRoute allowedRole="patient">
                  <AssessmentsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient/assessment/:assessmentId"
              element={
                <ProtectedRoute allowedRole="patient">
                  <AssessmentDetail />
                </ProtectedRoute>
              }
            />

            {/* Doctor Routes */}
            <Route
              path="/doctor/dashboard"
              element={
                <ProtectedRoute allowedRole="doctor">
                  <DoctorDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/doctor/review/:assessmentId"
              element={
                <ProtectedRoute allowedRole="doctor">
                  <ReviewAssessment />
                </ProtectedRoute>
              }
            />

            {/* Default Route */}
            <Route path="/" element={<Navigate to="/login" />} />

            {/* 404 Route */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#fff',
                color: '#333',
                borderRadius: '10px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
