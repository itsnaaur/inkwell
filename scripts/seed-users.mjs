import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { initializeApp } from 'firebase/app'
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
} from 'firebase/auth'
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')

for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) continue

  const separatorIndex = trimmed.indexOf('=')
  if (separatorIndex === -1) continue

  const key = trimmed.slice(0, separatorIndex).trim()
  let value = trimmed.slice(separatorIndex + 1).trim()

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1)
  }

  process.env[key] = value
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const db = getFirestore(app)

const TEST_USERS = [
  {
    email: 'alice@ajaia.dev',
    password: 'Test1234!',
    displayName: 'Alice',
  },
  {
    email: 'bob@ajaia.dev',
    password: 'Test1234!',
    displayName: 'Bob',
  },
]

async function ensureAuthUser(user) {
  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      user.email,
      user.password
    )
    console.log(`Created Auth user: ${user.email}`)
    return credential.user
  } catch (error) {
    const code = error.code

    if (code === 'auth/email-already-in-use') {
      const credential = await signInWithEmailAndPassword(
        auth,
        user.email,
        user.password
      )
      console.log(`Auth user already exists: ${user.email}`)
      return credential.user
    }

    if (code === 'auth/operation-not-allowed') {
      throw new Error(
        'Email/Password sign-in is disabled. Enable it in Firebase Console → Authentication → Sign-in method.'
      )
    }

    if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
      throw new Error(
        `${user.email} exists but password does not match. Delete the user in Firebase Console → Authentication, then run npm run seed again.`
      )
    }

    throw new Error(`Auth setup failed for ${user.email}: ${code ?? error.message}`)
  }
}

async function seedUser(user) {
  const authUser = await ensureAuthUser(user)

  await setDoc(
    doc(db, 'users', authUser.uid),
    {
      email: user.email,
      displayName: user.displayName,
      createdAt: serverTimestamp(),
    },
    { merge: true }
  )

  console.log(`Seeded Firestore profile: /users/${authUser.uid}`)
}

async function main() {
  console.log('Seeding test accounts...\n')

  for (const user of TEST_USERS) {
    await seedUser(user)
    console.log('')
  }

  console.log('Done. Login credentials:')
  console.log('  alice@ajaia.dev / Test1234!')
  console.log('  bob@ajaia.dev / Test1234!')
}

main().catch((error) => {
  console.error('Seed failed:', error.message)
  process.exit(1)
})
