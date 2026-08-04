import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const ADMIN_APP_NAME = 'kriana-booking-admin'

let cachedDb

function serviceAccountFromEnvironment() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    let serviceAccount
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    } catch {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON')
    }

    if (!serviceAccount.project_id || !serviceAccount.client_email || !serviceAccount.private_key) {
      throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is missing required fields')
    }

    return {
      projectId: serviceAccount.project_id,
      clientEmail: serviceAccount.client_email,
      privateKey: serviceAccount.private_key.replace(/\\n/g, '\n'),
    }
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey }
  }

  return null
}

export function getAdminDb() {
  if (cachedDb) return cachedDb

  const existingApp = getApps().find(app => app.name === ADMIN_APP_NAME)
  let app = existingApp

  if (!app) {
    if (process.env.FIRESTORE_EMULATOR_HOST) {
      app = initializeApp({
        projectId: process.env.FIREBASE_PROJECT_ID
          || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
          || 'demo-kriana-security',
      }, ADMIN_APP_NAME)
      cachedDb = getFirestore(app)
      return cachedDb
    }
    const serviceAccount = serviceAccountFromEnvironment()
    if (serviceAccount) {
      app = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.projectId,
      }, ADMIN_APP_NAME)
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      app = initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      }, ADMIN_APP_NAME)
    } else {
      throw new Error(
        'Firebase Admin credentials are not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.'
      )
    }
  }

  cachedDb = getFirestore(app)
  return cachedDb
}
