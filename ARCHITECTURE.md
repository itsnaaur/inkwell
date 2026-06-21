# Architecture

## Overview

Ajaia Docs is a single Next.js application using App Router route groups for auth and authenticated app surfaces. Client components talk directly to Firestore for document CRUD and real-time updates. Server API routes use Firebase Admin for privileged operations: file upload parsing, sharing by email lookup, and token verification.

## Data Model

```
/users/{uid}
/documents/{docId}
/documents/{docId}/shares/{uid}
```

Documents store Tiptap JSON in `content` to preserve formatting structure. Emails are denormalized on documents and share records to avoid extra reads in list views.

## Auth Flow

- Firebase Auth handles email/password sign-in and session persistence
- `AuthProvider` listens to `onAuthStateChanged` and exposes auth helpers via `useAuth`
- Authenticated routes live under `app/(app)` and redirect unauthenticated users to `/login`
- Signup writes a `/users/{uid}` profile document

## Document Access

- Owners have full read/write/delete access
- Shared users can read and update documents but not delete them
- Share records live in a subcollection scoped to each document
- Shared document discovery uses a Firestore `collectionGroup('shares')` query filtered by `sharedWith`

## Editor

- Tiptap StarterKit plus Underline extension
- Autosave debounced at 1500ms via Firestore `updateDoc`
- Initial content is loaded once to avoid cursor resets on snapshot updates

## API Routes

- `POST /api/upload` — parse `.txt`/`.md`, create document
- `POST /api/share` — grant access by recipient email
- `GET /api/share?docId=` — list current shares for owners
- `POST /api/documents` and `PATCH/DELETE /api/documents/[id]` — server-side document operations with token verification

## Tradeoffs

- No real-time multi-user editing — simpler persistence and lower complexity
- Markdown parsing is line-based, not a full markdown AST — sufficient for headings and paragraphs within the timebox
- Shared users can edit documents — no viewer/editor role distinction by design
- Admin SDK required for email lookup and secure upload/share endpoints

## Security

Firestore rules enforce:

- Users can only write their own profile
- Document owners have full access
- Shared users can read/update documents when a matching share record exists
- Only owners can manage share subcollection records
