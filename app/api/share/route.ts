import { NextRequest, NextResponse } from 'next/server'
import { verifyRequestToken } from '@/lib/auth-token'
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin'

export async function POST(request: NextRequest) {
  const authResult = await verifyRequestToken(request)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await request.json()
  const { documentId, email } = body

  if (!documentId || !email) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  const documentRef = getAdminDb().collection('documents').doc(documentId)
  const documentSnapshot = await documentRef.get()

  if (!documentSnapshot.exists) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  }

  const documentData = documentSnapshot.data()!
  if (documentData.ownerId !== authResult.uid) {
    return NextResponse.json({ error: 'Only the owner can share this document.' }, { status: 403 })
  }

  let targetUser
  try {
    targetUser = await getAdminAuth().getUserByEmail(email)
  } catch {
    return NextResponse.json(
      { error: 'No account found with that email.' },
      { status: 404 }
    )
  }

  if (targetUser.uid === authResult.uid) {
    return NextResponse.json({ error: 'You already own this document.' }, { status: 400 })
  }

  const shareRef = documentRef.collection('shares').doc(targetUser.uid)
  const existingShare = await shareRef.get()

  if (existingShare.exists) {
    return NextResponse.json({ error: 'Already shared with this user.' }, { status: 409 })
  }

  await shareRef.set({
    sharedWith: targetUser.uid,
    sharedWithEmail: email,
    grantedBy: authResult.uid,
    createdAt: new Date(),
  })

  const sharesSnapshot = await documentRef.collection('shares').get()
  const shares = sharesSnapshot.docs.map((shareDoc) => ({
    email: shareDoc.data().sharedWithEmail,
    createdAt: shareDoc.data().createdAt?.toISOString?.() ?? '',
  }))

  return NextResponse.json({ success: true, shares })
}

export async function GET(request: NextRequest) {
  const authResult = await verifyRequestToken(request)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const docId = request.nextUrl.searchParams.get('docId')
  if (!docId) {
    return NextResponse.json({ error: 'Missing docId.' }, { status: 400 })
  }

  const documentRef = getAdminDb().collection('documents').doc(docId)
  const documentSnapshot = await documentRef.get()

  if (!documentSnapshot.exists) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  }

  if (documentSnapshot.data()!.ownerId !== authResult.uid) {
    return NextResponse.json({ error: 'Only the owner can view shares.' }, { status: 403 })
  }

  const sharesSnapshot = await documentRef.collection('shares').get()
  const shares = sharesSnapshot.docs.map((shareDoc) => ({
    email: shareDoc.data().sharedWithEmail,
    createdAt: shareDoc.data().createdAt?.toISOString?.() ?? '',
  }))

  return NextResponse.json({ shares })
}
