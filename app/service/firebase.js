import admin from 'firebase-admin';

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH;
// Inisialisasi Firebase Admin SDK (jika belum diinisialisasi di tempat lain)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccountPath),
});

export default admin