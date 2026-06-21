# AI Workflow

## Tools Used

- Claude (architecture, data modeling, code generation, debugging)
- Cursor AI (inline completions, refactoring, phase-by-phase implementation)

## Where AI Materially Sped Up Work

- Firestore data model design and security rules
- Tiptap toolbar boilerplate and autosave debounce pattern
- Markdown-to-Tiptap parser using a line-by-line approach
- Firebase Admin ID token verification pattern for API routes
- `collectionGroup` query approach for shared documents

## What Was Changed or Rejected

- Real-time collaboration via Yjs — rejected as out of scope
- `.docx` parsing via mammoth.js — scoped down to `.txt` and `.md` only
- Security rules needed an explicit `allow create` scoped to `ownerId`
- Content storage as plain string — changed to Tiptap JSON object

## How Correctness Was Verified

- Manual end-to-end testing of auth, create/edit/save, upload, and share flows
- Firestore security rules reviewed against the battle plan requirements
- Jest unit tests for `parseMdToTiptap`
