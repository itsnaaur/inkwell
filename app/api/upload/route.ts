import { NextRequest, NextResponse } from 'next/server'
import { verifyRequestToken } from '@/lib/auth-token'
import { getAdminDb } from '@/lib/firebase/admin'
import { parseMdToTiptap, parseTxtToTiptap } from '@/lib/utils'

export async function POST(request: NextRequest) {
  const authResult = await verifyRequestToken(request)
  if ('error' in authResult) {
    return NextResponse.json({ error: authResult.error }, { status: authResult.status })
  }

  const body = await request.json()
  const { text, filename, fileType } = body

  if (!text || !filename || !fileType) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 })
  }

  if (fileType !== 'txt' && fileType !== 'md') {
    return NextResponse.json({ error: 'Supported formats: .txt and .md only.' }, { status: 400 })
  }

  const content =
    fileType === 'md' ? parseMdToTiptap(text) : parseTxtToTiptap(text)
  const title = filename.replace(/\.(txt|md)$/i, '') || 'Untitled Document'
  const now = new Date()

  const documentRef = await getAdminDb().collection('documents').add({
    ownerId: authResult.uid,
    ownerEmail: authResult.email,
    title,
    content,
    createdAt: now,
    updatedAt: now,
  })

  return NextResponse.json({ docId: documentRef.id })
}
