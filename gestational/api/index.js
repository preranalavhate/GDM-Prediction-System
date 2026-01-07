const express = require('express');
const cors = require('cors');
const axios = require('axios');
const admin = require('firebase-admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin
let db = null;
let firebaseInitialized = false;

try {
  // For Vercel, use environment variable for service account
  const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
    : require('../serviceAccountKey.json');

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }
  db = admin.firestore();
  firebaseInitialized = true;
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.log('⚠️  Firebase Admin initialization skipped');
  console.log('⚠️  Error:', error.message);
}

// ML Model API endpoint
const ML_API_URL = process.env.ML_API_URL || 'https://gestation-backend.onrender.com';

// Verify Firebase token middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// ============================================
// DOCTOR ENDPOINTS
// ============================================

// Register a new doctor
app.post('/api/doctors/register', verifyToken, async (req, res) => {
  try {
    const { name, specialization, license, phone, hospital } = req.body;
    const userId = req.user.uid;

    const doctorData = {
      userId,
      name,
      specialization,
      license,
      phone,
      hospital,
      isAvailable: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      totalPatients: 0,
      totalAssessments: 0
    };

    await db.collection('doctors').doc(userId).set(doctorData);

    res.status(201).json({
      message: 'Doctor registered successfully',
      doctor: doctorData
    });
  } catch (error) {
    console.error('Error registering doctor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all available doctors
app.get('/api/doctors', async (req, res) => {
  try {
    const doctorsSnapshot = await db.collection('doctors')
      .where('isAvailable', '==', true)
      .get();

    const doctors = [];
    doctorsSnapshot.forEach(doc => {
      doctors.push({ id: doc.id, ...doc.data() });
    });

    res.json({ doctors });
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get doctor by ID
app.get('/api/doctors/:doctorId', async (req, res) => {
  try {
    const doctorDoc = await db.collection('doctors').doc(req.params.doctorId).get();

    if (!doctorDoc.exists) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    res.json({ doctor: { id: doctorDoc.id, ...doctorDoc.data() } });
  } catch (error) {
    console.error('Error fetching doctor:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get doctor dashboard stats
app.get('/api/doctors/:doctorId/dashboard', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;

    const pendingSnapshot = await db.collection('assessments')
      .where('doctorId', '==', doctorId)
      .where('status', '==', 'pending')
      .get();

    const completedSnapshot = await db.collection('assessments')
      .where('doctorId', '==', doctorId)
      .where('status', '==', 'completed')
      .get();

    const highRiskSnapshot = await db.collection('assessments')
      .where('doctorId', '==', doctorId)
      .where('riskCategory', '==', 'High Risk')
      .get();

    const patientIds = new Set();
    pendingSnapshot.forEach(doc => patientIds.add(doc.data().patientId));
    completedSnapshot.forEach(doc => patientIds.add(doc.data().patientId));

    res.json({
      stats: {
        totalPatients: patientIds.size,
        pendingAssessments: pendingSnapshot.size,
        completedAssessments: completedSnapshot.size,
        highRiskPatients: highRiskSnapshot.size
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get pending assessments for doctor
app.get('/api/doctors/:doctorId/assessments/pending', verifyToken, async (req, res) => {
  try {
    const { doctorId } = req.params;

    const assessmentsSnapshot = await db.collection('assessments')
      .where('doctorId', '==', doctorId)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();

    const assessments = [];
    for (const doc of assessmentsSnapshot.docs) {
      const assessment = { id: doc.id, ...doc.data() };

      const patientDoc = await db.collection('patients').doc(assessment.patientId).get();
      if (patientDoc.exists) {
        assessment.patientInfo = patientDoc.data();
      }

      assessments.push(assessment);
    }

    res.json({ assessments });
  } catch (error) {
    console.error('Error fetching pending assessments:', error);
    res.status(500).json({ error: error.message });
  }
});

// Submit doctor's review
app.post('/api/assessments/:assessmentId/review', verifyToken, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { diagnosis, recommendations, finalVerdict, notes } = req.body;
    const doctorId = req.user.uid;

    const reviewData = {
      diagnosis,
      recommendations,
      finalVerdict,
      notes,
      reviewedAt: admin.firestore.FieldValue.serverTimestamp(),
      reviewedBy: doctorId,
      status: 'completed'
    };

    await db.collection('assessments').doc(assessmentId).update(reviewData);

    const assessmentDoc = await db.collection('assessments').doc(assessmentId).get();
    const assessment = assessmentDoc.data();

    await db.collection('notifications').add({
      userId: assessment.patientId,
      type: 'review_completed',
      title: 'Assessment Reviewed',
      message: `Your assessment has been reviewed by Dr. ${assessment.doctorName}`,
      assessmentId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ message: 'Review submitted successfully', review: reviewData });
  } catch (error) {
    console.error('Error submitting review:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PATIENT ENDPOINTS
// ============================================

// Register a new patient
app.post('/api/patients/register', verifyToken, async (req, res) => {
  try {
    const { name, age, phone, address } = req.body;
    const userId = req.user.uid;

    const patientData = {
      userId,
      name,
      age,
      phone,
      address,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      totalAssessments: 0
    };

    await db.collection('patients').doc(userId).set(patientData);

    res.status(201).json({
      message: 'Patient registered successfully',
      patient: patientData
    });
  } catch (error) {
    console.error('Error registering patient:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get patient by ID
app.get('/api/patients/:patientId', verifyToken, async (req, res) => {
  try {
    const patientDoc = await db.collection('patients').doc(req.params.patientId).get();

    if (!patientDoc.exists) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ patient: { id: patientDoc.id, ...patientDoc.data() } });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get patient dashboard
app.get('/api/patients/:patientId/dashboard', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    const assessmentsSnapshot = await db.collection('assessments')
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .get();

    const assessments = [];
    let pendingCount = 0;
    let completedCount = 0;

    assessmentsSnapshot.forEach(doc => {
      const assessment = { id: doc.id, ...doc.data() };
      assessments.push(assessment);

      if (assessment.status === 'pending') pendingCount++;
      if (assessment.status === 'completed') completedCount++;
    });

    res.json({
      stats: {
        totalAssessments: assessments.length,
        pendingReviews: pendingCount,
        completedAssessments: completedCount
      },
      recentAssessments: assessments.slice(0, 5)
    });
  } catch (error) {
    console.error('Error fetching patient dashboard:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get patient's assessments
app.get('/api/patients/:patientId/assessments', verifyToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    const assessmentsSnapshot = await db.collection('assessments')
      .where('patientId', '==', patientId)
      .orderBy('createdAt', 'desc')
      .get();

    const assessments = [];
    for (const doc of assessmentsSnapshot.docs) {
      const assessment = { id: doc.id, ...doc.data() };

      const doctorDoc = await db.collection('doctors').doc(assessment.doctorId).get();
      if (doctorDoc.exists) {
        assessment.doctorInfo = doctorDoc.data();
      }

      assessments.push(assessment);
    }

    res.json({ assessments });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// ASSESSMENT ENDPOINTS
// ============================================

// Create new assessment with ML prediction
app.post('/api/assessments', verifyToken, async (req, res) => {
  try {
    const { patientId, doctorId, patientData, doctorName, patientName } = req.body;

    let predictionResult;
    try {
      const mlResponse = await axios.post(`${ML_API_URL}/predict`, patientData);
      predictionResult = mlResponse.data;
    } catch (mlError) {
      console.error('Error calling ML API:', mlError.message);
      return res.status(500).json({
        error: 'Failed to get prediction from ML model',
        details: mlError.message
      });
    }

    const assessmentData = {
      patientId,
      doctorId,
      doctorName,
      patientName,
      patientData,
      prediction: predictionResult.prediction,
      gdmProbability: predictionResult.gdm_probability,
      nonGdmProbability: predictionResult.non_gdm_probability,
      riskCategory: predictionResult.risk_category,
      confidence: predictionResult.confidence,
      riskFactors: predictionResult.risk_factors,
      modelVersion: predictionResult.model_version,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const assessmentRef = await db.collection('assessments').add(assessmentData);

    await db.collection('patients').doc(patientId).set({
      totalAssessments: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection('doctors').doc(doctorId).set({
      totalAssessments: admin.firestore.FieldValue.increment(1),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    await db.collection('notifications').add({
      userId: doctorId,
      type: 'new_assessment',
      title: 'New Assessment',
      message: `New assessment from ${patientName}`,
      assessmentId: assessmentRef.id,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.status(201).json({
      message: 'Assessment created successfully',
      assessmentId: assessmentRef.id,
      prediction: predictionResult
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get assessment by ID
app.get('/api/assessments/:assessmentId', verifyToken, async (req, res) => {
  try {
    const assessmentDoc = await db.collection('assessments').doc(req.params.assessmentId).get();

    if (!assessmentDoc.exists) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const assessment = { id: assessmentDoc.id, ...assessmentDoc.data() };

    const patientDoc = await db.collection('patients').doc(assessment.patientId).get();
    if (patientDoc.exists) {
      assessment.patientInfo = patientDoc.data();
    }

    const doctorDoc = await db.collection('doctors').doc(assessment.doctorId).get();
    if (doctorDoc.exists) {
      assessment.doctorInfo = doctorDoc.data();
    }

    res.json({ assessment });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// NOTIFICATION ENDPOINTS
// ============================================

// Get user notifications
app.get('/api/notifications/:userId', verifyToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .limit(20)
      .get();

    const notifications = [];
    notificationsSnapshot.forEach(doc => {
      notifications.push({ id: doc.id, ...doc.data() });
    });

    res.json({ notifications });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:notificationId/read', verifyToken, async (req, res) => {
  try {
    await db.collection('notifications').doc(req.params.notificationId).update({
      read: true
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// HEALTH CHECK
// ============================================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    firebaseInitialized
  });
});

// Export the Express app for Vercel
module.exports = app;
