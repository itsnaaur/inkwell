# Project Structure

This document describes how the Ajaia Docs source code is organized for review and long-term maintenance.

```
ajaia/
├── app/                    # Next.js App Router — routes, layouts, API handlers
│   ├── (auth)/             # Public routes: login, signup
│   ├── (app)/              # Authenticated routes: documents, editor, trash
│   ├── api/                # Server routes (Firebase Admin — not used by UI)
│   ├── layout.tsx          # Root layout + AuthProvider
│   └── globals.css
│
├── components/             # Presentational and feature UI components
│   └── ui/                 # Reusable primitives (Button, LoadingState)
│
├── providers/              # React context providers (global app state)
│   ├── AuthProvider.tsx    # Firebase session + sign-in/up/out
│   └── DocumentsProvider.tsx  # Single Firestore listener hub for lists
│
├── hooks/                  # Consumer hooks (thin wrappers over providers)
│   ├── useAuth.ts
│   ├── useDocuments.ts
│   └── useTrash.ts
│
├── lib/                    # Business logic, Firebase clients, utilities
│   ├── firebase/
│   │   ├── client.ts       # Browser Firebase SDK (used by UI)
│   │   └── admin.ts        # Server Admin SDK (API routes only)
│   ├── documentContent.ts  # Content subcollection read/write
│   ├── sharing.ts          # sharedWithMe index helpers
│   ├── trash.ts            # Soft delete lifecycle
│   └── utils.ts            # Shared helpers (debounce, markdown parse)
│
├── types/                  # Shared TypeScript interfaces
│   └── document.ts
│
├── scripts/                # Dev tooling (seed users, clean cache)
├── __tests__/              # Jest unit tests
├── docs/                   # Supplementary documentation for reviewers
├── public/                 # Static assets served at /
│
├── firestore.rules         # Security rules (publish manually in Firebase Console)
├── firestore.indexes.json
└── README.md               # Setup, scripts, deployment
```

## Layer responsibilities

| Layer | Responsibility |
|-------|----------------|
| `app/` | Routing, page composition, auth gate in `(app)/layout.tsx` |
| `providers/` | Long-lived context + side effects (auth session, Firestore listeners) |
| `hooks/` | Ergonomic hooks for components — no direct Firestore wiring |
| `lib/` | Pure/domain logic reusable across UI and scripts |
| `components/` | UI only — receives data via hooks, calls lib helpers on user actions |

## Critical paths for reviewers

1. **Data split** — `lib/documentContent.ts` stores editor body in `/documents/{id}/content/main`, not on the parent doc.
2. **Sharing index** — `lib/sharing.ts` writes `/users/{uid}/sharedWithMe/{docId}` alongside `/documents/{id}/shares/{uid}`.
3. **Security** — `firestore.rules` must be published in Firebase Console; the app does not deploy rules automatically.
4. **Listeners** — `providers/DocumentsProvider.tsx` owns all list listeners; do not duplicate in pages.

## Further reading

- `docs/ARCHITECTURE.md` — system design and tradeoffs
- `docs/AI_WORKFLOW.md` — AI-assisted development notes
- `docs/ajaia-battle-plan.md` — original project roadmap
