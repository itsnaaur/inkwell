# Ajaia Docs — Production Ready Workspace

A high performance, lightweight document editor built with Next.js 14, Firebase, and Tiptap. Engineered with a decoupled document persistence architecture, user targeted sharing indexes, and a 30 day soft delete lifecycle optimized for high velocity product teams.

---

## 🚀 Key Engineering Enhancements

To deliver a production grade system within the strict development window, the codebase prioritizes performance engineering and absolute data integrity:

* **Decoupled Data Architecture:** Root document references only house light metadata parameters (title, flags, timestamps). The heavy rich text canvas state is separated into a dedicated `/documents/{id}/content/main` subcollection, preventing massive payload overhead on dashboard list queries.
* **Targeted Recipient Indexes:** Bypassed slow, rule heavy collection group queries by implementing a high speed user centric indexing matrix (`/users/{uid}/sharedWithMe`) ensuring clean security perimeters and instant sidebar rendering.
* **Complete Soft Delete Lifecycle:** Implemented a full 30 day trash workspace matching professional document systems. Documents get flagged as `isDeleted` with recovery pathways and automated client side session garbage collection.
* **Single Socket Stream Shell:** Centralized the real time state engine inside a global application `DocumentsProvider` wrapper to completely cut out duplicate Firestore network listeners.

---

## 🛠️ Integrated Technical Stack

* **Framework:** Next.js 14 (App Router) + TypeScript
* **Editor Base:** Tiptap v3 Headless Core Engine
* **Database & Security:** Firestore (Client SDK Core Layer)
* **Session Layer:** Firebase Authentication
* **Styling Matrix:** Tailwind CSS
* **Test Architecture:** Jest Unit Framework
* **Deployment Platform:** Vercel Continuous Delivery

---

## 📂 Project Layout & Documentation

Source code follows a layered Next.js structure. See **`docs/PROJECT_STRUCTURE.md`** for the full directory map and reviewer notes.

| Path | Purpose |
|------|---------|
| `app/` | Routes, layouts, API handlers |
| `components/` | UI components |
| `providers/` | Auth + Firestore listener context |
| `hooks/` | Consumer hooks (`useAuth`, `useDocuments`, `useTrash`) |
| `lib/` | Business logic, Firebase clients, utilities |
| `types/` | Shared TypeScript interfaces |
| `scripts/` | Dev tooling (seed, cache clean) |
| `docs/` | Architecture, AI workflow, battle plan |
| `public/` | Static assets (`ajaia-logo.png`) |

Supplementary documentation:

* `docs/ARCHITECTURE.md` — Systems design, Firestore schema, performance strategies
* `docs/AI_WORKFLOW.md` — AI-assisted development notes
* `docs/ajaia-battle-plan.md` — Original development roadmap
* `docs/PROJECT_STRUCTURE.md` — Folder layout and critical code paths

---

## 🔧 Local Workspace Execution

### 1. Install Project Dependencies

```bash
npm install

```

### 2. Configure Environment State

Duplicate the environment template asset:

```bash
cp .env.example .env.local

```

Open `.env.local` and populate the fields with your active Firebase Web App variables:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=ajaia-docs-45934.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=ajaia-docs-45934
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=ajaia-docs-45934.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=265550196322
NEXT_PUBLIC_FIREBASE_APP_ID=your_web_app_id

```

### 3. Database Security Rule Publishing

1. Access the **Firebase Console** linked to your active project instance.
2. Under **Firestore Database**, navigate to the **Rules** workspace tab.
3. Paste the complete code block found inside your local `firestore.rules` file and click **Publish**.

### 4. Seed Preconfigured Test Profiles

Execute the native user seeding tool to immediately register the required validation accounts inside both Firebase Authentication and the Firestore `/users` registry:

```bash
npm run seed

```

* **User A (Owner Profile):** `alice@ajaia.dev` | Password: `Test1234!`
* **User B (Collaborator Profile):** `bob@ajaia.dev` | Password: `Test1234!`

---

## 🏃 Native Script Registry

* `npm run dev` — Launches the local Next.js development server workflow.
* `npm run dev:clean` — Completely purges the local structural `.next` and Webpack system caches to guarantee a completely clean build pipeline (essential for avoiding file locking races on Windows environments).
* `npm run seed` — Runs the data seeding engine to provision User A and User B.
* `npm run build` — Compiles the TypeScript layers into highly optimized production targets.
* `npm run test` — Fires the Jest test blocks verifying the markdown conversion utilities.
* `npm run lint` — Runs style validations to maintain code maintainability metrics.

---

## 🛑 Scope Cut Boundaries

To maintain software quality and delivery speed within the timebox, the following items are explicitly out of scope:

* Real time character pointer position tracking (Yjs or mesh network sync structures).
* Microsoft Word `.docx` parsing (limited cleanly to high speed `.txt` and `.md` file reading).
* Detailed paragraph comment or suggestion threads.
* Unlimited workspace version history rollbacks.
* Granular multi tier permissions (strict Owner vs Collaborator framework enforced).

---

## 🌐 Production Deployment Guidelines

This project is fully structured for simple, single step deployment on Vercel. Ensure all variables mapped inside `.env.local` are mirrored exactly within your Vercel Project Settings portal. Once deployed, copy your production Vercel deployment domain and paste it securely into the **Authorized Domains** list inside the **Authentication Settings** panel in the Firebase Console.

```bash
npx vercel --prod

```
