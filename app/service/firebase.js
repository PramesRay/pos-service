import admin from 'firebase-admin';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY_JSON);
// Inisialisasi Firebase Admin SDK (jika belum diinisialisasi di tempat lain)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

export default admin