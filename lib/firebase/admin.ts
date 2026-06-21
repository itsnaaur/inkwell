/**
 * Firebase Admin SDK — server-side only (app/api/* routes).
 *
 * The UI uses lib/firebase/client.ts instead. Admin credentials are optional
 * for deployment unless you wire the API routes into the frontend.
 */
import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

function initAdmin() {
  if (getApps().length) {
    return
  }

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n')

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Firebase Admin credentials are not configured.')
  }

  initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
  })
}

export function getAdminAuth() {
  initAdmin()
  return getAuth()
}

export function getAdminDb() {
  initAdmin()
  return getFirestore()
}
