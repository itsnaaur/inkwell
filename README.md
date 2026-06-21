# Ajaia Docs

A document editor built with Next.js 14, Firebase, and Tiptap. Create rich-text documents, upload `.txt` and `.md` files, and share documents with other users by email.

## Stack

- Next.js 14 (App Router) + TypeScript
- Firebase Auth, Firestore, Storage
- Tiptap v2/v3 rich-text editor
- Tailwind CSS
- Vercel deployment

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in Firebase client config and Admin service account values in `.env.local`.

4. In Firebase Console:
   - Enable Email/Password auth
   - Create Firestore and Storage
   - Paste `firestore.rules` into Firestore Rules and publish
   - Add test users and seed `/users/{uid}` profiles

5. Run locally:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Test Accounts

Seed both accounts (Auth + Firestore profiles):

```bash
npm run seed
```

- `alice@ajaia.dev` / `Test1234!`
- `bob@ajaia.dev` / `Test1234!`

## Scripts

- `npm run dev` — start development server
- `npm run seed` — create/update Alice and Bob test accounts
- `npm run build` — production build
- `npm run start` — start production server
- `npm run test` — run Jest unit tests
- `npm run lint` — run ESLint

## Environment Variables

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

FIREBASE_ADMIN_PROJECT_ID=
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

## Features

- Email/password authentication
- Create, rename, edit, save, and reopen documents
- Rich text: bold, italic, underline, H1/H2/H3, bullet and numbered lists
- Upload `.txt` and `.md` files into editable documents
- Share documents by email
- Firestore-backed persistence with security rules

## Out of Scope

- Real-time collaboration (Yjs/CRDTs)
- `.docx` parsing
- Version history
- Role-based permissions beyond owner/shared access
- Comments

## Deployment

Deploy to Vercel and add all environment variables in the project settings. Add your Vercel domain to Firebase Auth authorized domains.

```bash
npx vercel --prod
```

## Firestore Index

Shared documents use a `collectionGroup` query on `shares`. Firebase may prompt you to create an index on first use — follow the console link to create it automatically.
