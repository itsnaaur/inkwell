import { NextRequest } from 'next/server'
import { getAdminAuth } from '@/lib/firebase/admin'

export async function verifyRequestToken(request: NextRequest) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) {
    return { error: 'Missing authorization token', status: 401 as const }
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(token)
    return { uid: decoded.uid, email: decoded.email ?? '' }
  } catch {
    return { error: 'Invalid authorization token', status: 401 as const }
  }
}
