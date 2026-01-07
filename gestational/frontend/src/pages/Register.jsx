import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Heart, Mail, Lock, User, Phone, Building, Award, Loader2, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

const Register = () => {
  const [userType, setUserType] = useState('patient');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Common fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Patient specific
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');

  // Doctor specific
  const [specialization, setSpecialization] = useState('');
  const [license, setLicense] = useState('');
  const [hospital, setHospital] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Create Firebase user
      const additionalData = userType === 'patient'
        ? { name, phone, age: parseInt(age), address }
        : { name, phone, specialization, license, hospital };

      const user = await signup(email, password, userType, additionalData);

      // Get Firebase token
      const token = await user.getIdToken();

      // Register in backend
      try {
        if (userType === 'patient') {
          await axios.post(
            `${API_URL}/patients/register`,
            { name, age: parseInt(age), phone, address },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        } else {
          await axios.post(
            `${API_URL}/doctors/register`,
            { name, specialization, license, phone, hospital },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
      } catch (backendError) {
        // Backend registration failed, but Firebase user exists
        console.warn('Backend registration failed, but Firebase user created:', backendError);
        // Continue anyway - user can still use the app
      }

      toast.success('Registration successful!');
      navigate(userType === 'doctor' ? '/doctor/dashboard' : '/patient/dashboard');
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 py-12">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-primary-600 p-3 rounded-full">
              <Heart className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Create Account
          </h1>
          <p className="text-gray-600">
            Join our healthcare community
          </p>
        </div>

        {/* Register Form */}
        <div className="card animate-slide-up">
          {/* User Type Selector */}
          <div className="flex gap-2 mb-6 p-1 bg-gray-100 rounded-lg">
            <button
              type="button"
              onClick={() => setUserType('patient')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                userType === 'patient'
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Patient
            </button>
            <button
              type="button"
              onClick={() => setUserType('doctor')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                userType === 'doctor'
                  ? 'bg-white text-primary-600 shadow-md'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Doctor
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <User className="w-4 h-4 inline mr-2" />
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Enter your name"
                  required
                />
              </div>

              <div>
                <label className="label">
                  <Phone className="w-4 h-4 inline mr-2" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="Enter your email"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Create password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="label">
                  <Lock className="w-4 h-4 inline mr-2" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field pr-10"
                    placeholder="Confirm password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Patient Specific Fields */}
            {userType === 'patient' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Age</label>
                    <input
                      type="number"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="input-field"
                      placeholder="Enter your age"
                      required
                      min="15"
                      max="60"
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Address</label>
                  <textarea
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="input-field"
                    placeholder="Enter your address"
                    rows="2"
                    required
                  />
                </div>
              </>
            )}

            {/* Doctor Specific Fields */}
            {userType === 'doctor' && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">
                      <Award className="w-4 h-4 inline mr-2" />
                      Specialization
                    </label>
                    <input
                      type="text"
                      value={specialization}
                      onChange={(e) => setSpecialization(e.target.value)}
                      className="input-field"
                      placeholder="e.g., Obstetrician"
                      required
                    />
                  </div>

                  <div>
                    <label className="label">License Number</label>
                    <input
                      type="text"
                      value={license}
                      onChange={(e) => setLicense(e.target.value)}
                      className="input-field"
                      placeholder="Medical license number"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="label">
                    <Building className="w-4 h-4 inline mr-2" />
                    Hospital/Clinic
                  </label>
                  <input
                    type="text"
                    value={hospital}
                    onChange={(e) => setHospital(e.target.value)}
                    className="input-field"
                    placeholder="Hospital or clinic name"
                    required
                  />
                </div>
              </>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-primary-600 hover:text-primary-700 font-semibold"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
