import { NextRequest, NextResponse } from 'next/server'
import { verifyRequestToken } from '@/lib/auth-token'
import { getAdminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  const authResult = await verifyRequestToken(request)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await request.json()
  const { ownerId, ownerEmail, title, content } = body

  if (!ownerId || !ownerEmail || !title) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  if (ownerId !== authResult.uid) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
  }

  const now = new Date()
  const documentRef = await getAdminDb().collection('documents').add({
    ownerId,
    ownerEmail,
    title,
    content: content ?? null,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ docId: documentRef.id })
}
