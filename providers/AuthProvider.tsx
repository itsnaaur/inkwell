'use client'

/**
 * Root auth shell — wraps the entire app in app/layout.tsx.
 * Persists Firebase session state and exposes sign-in/up/out helpers.
 */
import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
} from 'firebase/auth'
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase/client'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/** Keeps the profile email lowercase and matching the account so share lookups find it. */
async function syncUserProfile(user: User) {
  if (!user.email) return

  const email = user.email.toLowerCase()
  const profileRef = doc(db, 'users', user.uid)
  const profile = await getDoc(profileRef)

  if (profile.exists() && profile.data().email === email) return

  await setDoc(
    profileRef,
    profile.exists()
      ? { email }
      : { email, displayName: user.displayName ?? '', createdAt: serverTimestamp() },
    { merge: true }
  )
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser)
      setLoading(false)

      if (nextUser) {
        syncUserProfile(nextUser).catch(() => {
          // Best-effort repair — sign-in still succeeds
        })
      }
    })
    return unsubscribe
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(credential.user, { displayName })
    // Mirror auth profile into Firestore for email-based share lookups.
    await setDoc(doc(db, 'users', credential.user.uid), {
      email: email.trim().toLowerCase(),
      displayName,
      createdAt: serverTimestamp(),
    })
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  )
}
