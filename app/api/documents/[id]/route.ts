import { NextRequest, NextResponse } from 'next/server'
import { verifyRequestToken } from '@/lib/auth-token'
import { getAdminDb } from '@/lib/firebase/admin'

async function userCanAccessDocument(documentId: string, uid: string) {
  const documentRef = getAdminDb().collection('documents').doc(documentId)
  const documentSnapshot = await documentRef.get()

  if (!documentSnapshot.exists) {
    return { allowed: false, notFound: true }
  }

  const data = documentSnapshot.data()!
  if (data.ownerId === uid) {
    return { allowed: true, isOwner: true, documentRef, data }
  }

  const shareSnapshot = await documentRef.collection('shares').doc(uid).get()
  if (shareSnapshot.exists) {
    return { allowed: true, isOwner: false, documentRef, data }
  }

  return { allowed: false, notFound: false }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyRequestToken(request)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const access = await userCanAccessDocument(params.id, authResult.uid)
  if (access.notFound) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  }
  if (!access.allowed || !access.documentRef) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
  }

  const body = await request.json()
  const updateData: Record<string, unknown> = {
    updatedAt: new Date(),
  }

  if (body.title !== undefined) updateData.title = body.title
  if (body.content !== undefined) updateData.content = body.content

  await access.documentRef.update(updateData)
  return NextResponse.json({ success: true })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authResult = await verifyRequestToken(request)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const access = await userCanAccessDocument(params.id, authResult.uid)
  if (access.notFound) {
    return NextResponse.json({ error: 'Document not found.' }, { status: 404 })
  }
  if (!access.allowed || !access.isOwner || !access.documentRef) {
    return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 })
  }

  await access.documentRef.delete()
  return NextResponse.json({ success: true })
}
