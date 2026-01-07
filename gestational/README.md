# Gestational Diabetes Prediction System

A complete web application for predicting and managing gestational diabetes with AI-powered predictions, Firebase authentication, and role-based access for patients and doctors.

## Features

### For Patients
- 🔐 Secure authentication with Firebase
- 👨‍⚕️ Select from registered doctors
- 📋 Complete medical assessment forms
- 🤖 Get AI-powered GDM predictions
- 📊 View assessment history and results
- 📱 Beautiful, responsive dashboard

### For Doctors
- 🔐 Secure authentication with Firebase
- 📋 View pending patient assessments
- 🤖 Review AI predictions and patient data
- ✅ Provide final medical verdict
- 📊 Track statistics and patient outcomes
- 💼 Professional dashboard interface

## Tech Stack

### Frontend
- **React** with Vite
- **Tailwind CSS** for styling
- **Firebase** for authentication
- **React Router** for navigation
- **Axios** for API calls
- **Lucide React** for icons
- **React Hot Toast** for notifications

### Backend
- **Node.js** with Express
- **Firebase Admin** for authentication & Firestore
- **Axios** for ML API communication
- **CORS** enabled

### ML Model
- **FastAPI** backend
- **Ensemble ML model** for predictions
- Supports model versioning

## Project Structure

```
gestational/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── context/         # Auth context
│   │   ├── pages/           # Page components
│   │   │   ├── patient/     # Patient pages
│   │   │   └── doctor/      # Doctor pages
│   │   ├── firebase.js      # Firebase config
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   └── package.json
├── gestation_backend/       # ML backend
│   └── fastapi_backend_modified.py
├── server.js                # Node.js backend
└── package.json

```

## Setup Instructions

### 1. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** → Email/Password
4. Enable **Firestore Database**
5. Create collections: `users`, `doctors`, `patients`, `assessments`, `notifications`

#### Get Firebase Config
1. Go to Project Settings → General
2. Scroll to "Your apps" → Web app
3. Copy the config object
4. Update `frontend/src/firebase.js` with your config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

#### Get Service Account Key (for backend)
1. Go to Project Settings → Service Accounts
2. Click "Generate new private key"
3. Save the JSON file as `serviceAccountKey.json` in the root directory

### 2. Install Dependencies

#### Root (Backend Server)
```bash
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

#### ML Backend (Python)
```bash
cd gestation_backend
pip install fastapi uvicorn pandas numpy scikit-learn joblib
```

### 3. Start the Servers

You need to start all three servers:

#### Terminal 1 - ML Model Server (FastAPI)
```bash
cd gestation_backend
python fastapi_backend_modified.py
# Runs on http://localhost:8000
```

#### Terminal 2 - Backend Server (Node.js)
```bash
node server.js
# Runs on http://localhost:5000
```

#### Terminal 3 - Frontend (React)
```bash
cd frontend
npm run dev
# Runs on http://localhost:5173
```

### 4. Access the Application

Open your browser and go to: `http://localhost:5173`

## Usage Guide

### For Patients

1. **Register**
   - Click "Sign Up" on the login page
   - Select "Patient"
   - Fill in your details (name, age, phone, address)
   - Create account

2. **Create Assessment**
   - Login to your dashboard
   - Click "New Assessment"
   - Select a doctor from the list
   - Fill in the medical assessment form
   - Submit for AI prediction

3. **View Results**
   - AI prediction is instant
   - Wait for doctor's review
   - Check dashboard for status updates

### For Doctors

1. **Register**
   - Click "Sign Up" on the login page
   - Select "Doctor"
   - Fill in your details (name, specialization, license, hospital)
   - Create account

2. **Review Assessments**
   - Login to your dashboard
   - View pending assessments
   - Click on an assessment to review
   - See AI prediction and patient data
   - Provide your diagnosis and recommendations
   - Submit final verdict

## API Endpoints

### Doctor Endpoints
- `POST /api/doctors/register` - Register new doctor
- `GET /api/doctors` - Get all available doctors
- `GET /api/doctors/:doctorId` - Get doctor by ID
- `GET /api/doctors/:doctorId/dashboard` - Get doctor stats
- `GET /api/doctors/:doctorId/assessments/pending` - Get pending assessments

### Patient Endpoints
- `POST /api/patients/register` - Register new patient
- `GET /api/patients/:patientId` - Get patient by ID
- `GET /api/patients/:patientId/dashboard` - Get patient stats
- `GET /api/patients/:patientId/assessments` - Get patient assessments

### Assessment Endpoints
- `POST /api/assessments` - Create new assessment (with ML prediction)
- `GET /api/assessments/:assessmentId` - Get assessment details
- `POST /api/assessments/:assessmentId/review` - Submit doctor's review

### Notification Endpoints
- `GET /api/notifications/:userId` - Get user notifications
- `PUT /api/notifications/:notificationId/read` - Mark as read

## ML Model Features

The assessment form collects the following data:
- Age
- Number of pregnancies
- Gestation in previous pregnancy
- HDL cholesterol
- Family history of diabetes
- Previous pregnancy complications
- PCOS status
- Blood pressure (systolic & diastolic)
- Hemoglobin levels
- Lifestyle factors
- Prediabetes status

The model provides:
- Risk category (Low/Moderate/High)
- GDM probability
- Confidence score
- Identified risk factors

## Firestore Data Structure

### users
```
{
  email: string
  role: "patient" | "doctor"
  name: string
  phone: string
  createdAt: timestamp
  ... (role-specific fields)
}
```

### assessments
```
{
  patientId: string
  doctorId: string
  patientData: object
  prediction: string
  gdmProbability: number
  riskCategory: string
  status: "pending" | "completed"
  diagnosis: string (after review)
  recommendations: string (after review)
  createdAt: timestamp
}
```

## Security Features

- 🔐 Firebase Authentication
- 🛡️ Protected routes with role-based access
- 🔒 Token-based API authentication
- ✅ Input validation on forms
- 🚫 CORS configuration

## Color Scheme

- Primary: Blue (#0ea5e9)
- Success: Green
- Warning: Yellow
- Danger: Red
- Medical theme colors

## Troubleshooting

### Frontend won't start
- Make sure all dependencies are installed: `npm install`
- Clear node_modules and reinstall

### Backend errors
- Ensure Firebase service account key is in place
- Check that all environment variables are set
- Verify Firestore collections exist

### ML Model errors
- Ensure the model files are in `models/latest/` directory
- Check that Python dependencies are installed
- Verify FastAPI is running on port 8000

## Development Tips

- Use React DevTools for debugging
- Check browser console for errors
- Monitor Network tab for API calls
- Check Firebase Console for data
- View server logs in terminal

## Future Enhancements

- [ ] Email notifications
- [ ] SMS alerts for high-risk cases
- [ ] Export reports as PDF
- [ ] Patient medical history timeline
- [ ] Doctor appointment scheduling
- [ ] Multi-language support
- [ ] Mobile app version

## Contributing

This is a healthcare application. When contributing:
1. Maintain HIPAA compliance principles
2. Test thoroughly before submitting
3. Follow the existing code style
4. Document new features

## License

MIT License - feel free to use for educational purposes

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the setup instructions
3. Check Firebase and API configurations

## 🚀 Deploy to Vercel

This project is ready for deployment on Vercel! See deployment guides:

- **Quick Start**: [QUICK_START.md](QUICK_START.md) - 5-minute deployment guide
- **Full Guide**: [VERCEL_DEPLOYMENT_GUIDE.md](VERCEL_DEPLOYMENT_GUIDE.md) - Complete instructions
- **Summary**: [DEPLOYMENT_SUMMARY.md](DEPLOYMENT_SUMMARY.md) - Overview of all changes

### Files for Deployment
- [vercel.json](vercel.json) - Vercel configuration
- [api/index.js](api/index.js) - Serverless API functions
- [.env.example](.env.example) - Backend environment template
- [frontend/.env.example](frontend/.env.example) - Frontend environment template

---

**Made with ❤️ for better maternal healthcare**
