# Architecture & Systems Design

## 1. System Overview

Ajaia Docs is built as a single, highly optimized Next.js 14 application leveraging App Router route groups (`(auth)` and `(app)`) to isolate secure and public layout trees.

To achieve maximum performance and zero data layer socket lag, the client side components utilize direct real time Firestore snapshot listeners for document CRUD and interactive workspace synchronization. Security boundaries are strictly maintained via server independent database validation layers (**Firestore Security Rules**). Elevated server side endpoints under `app/api/` are fully structured for administrative validation checks using the Firebase Admin SDK.

---

## 2. Production Ready Data Model (Evolved Firestore Schema)

To bypass standard data loading overhead and secure data isolation, the database schema was intentionally split to separate light document parameters from heavy layout state text trees:

```
/users/{uid}                        ← User profiles mapping { uid, email, displayName }
/users/{uid}/sharedWithMe/{docId}   ← Recipient optimized index for fast shared access lookup

/documents/{docId}                 ← Document metadata layer (Light reads for sidebars)
/documents/{docId}/content/main     ← Isolated subcollection housing heavy Tiptap rich-text JSON

```

### Document Metadata Structure (`/documents/{docId}`)

* `ownerId`: string (UID of creator)
* `ownerEmail`: string (Denormalized profile field for fast list rendering)
* `title`: string (Editable workspace name)
* `isDeleted`: boolean (Flag facilitating soft delete tracking)
* `deletedAt`: timestamp | null (Retention window calculation marker)
* `createdAt`: timestamp
* `updatedAt`: timestamp

### Heavy Content Layer (`/documents/{docId}/content/main`)

* `body`: object (Raw, structural Tiptap JSON data tree)
* `updatedAt`: timestamp

---

## 3. Core Architectural Subsystems

### 3.1 Session & State Shielding

* **Authentication Core:** Managed entirely via Firebase Authentication utilizing persistent client state tokens.
* **Layout Guards:** Secure routes configured under `app/(app)` are wrapped by a global `AppShell` gate. If an unauthenticated session is caught, the framework enforces an automatic routing push back to the `/login` gateway.
* **Unified Data Synchronization:** Built a single application wide `DocumentsProvider` React shell. This combines real time hooks for owned nodes, shared indexes, and trashed elements into a single execution context, eliminating the massive socket read multiplier caused by independent page listeners.

### 3.2 Decoupled Data Split Design (Performance Strategy)

* **The Problem:** Storing large rich text JSON data objects directly on the parent record forces dashboard lists and sidebar rows to load whole multi page documents just to print a list of titles.
* **The Solution:** The database layer separates title/date metadata from the heavy editing buffer. Listing views query only the root document. The editor page alone initiates the secondary socket download for `/content/main` upon route navigation. A robust fallback layer (`loadDocumentContent`) provides automatic backwards compatibility to safely read string data fields from legacy documents before writing newly updated edits into the subcollection structure.

### 3.3 Target Lookup Indexing (Sharing Redesign)

* **The Problem:** Initial blueprints recommended using a Firestore `collectionGroup` filter across deep shared files. During engineering validation loops, this pattern generated rule errors and introduced high database scanning liabilities.
* **The Solution:** Built an active index mapping matrix under `/users/{recipientUid}/sharedWithMe/{documentId}`. When an owner adds a collaborator by email, the engine verifies the target user's identity via a clean `/users` collection fetch and writes basic reference pointers directly to the recipient’s lookup tree. Shared dashboards read directly from the user's personal index node, removing complex scanning dependencies.

### 3.4 Soft Delete Lifecycle (Trash Engine)

* Rather than purging data instantly on click, documents get marked with an `isDeleted: true` parameter and stamped with a `deletedAt` flag.
* Trashed files are filtered out of dashboard lists on the client side instantly, maintaining backward visibility for legacy records.
* Expired files are swept and wiped out via an automated script tracking a 30 day expiration variable (`TRASH_RETENTION_DAYS`), run client side once per session via local `sessionStorage` markers to protect runtime performance.

---

## 4. Operational Pipeline Mechanics

### 4.1 Tiptap Rich Text Canvas

* Built using the headless Tiptap v3 framework. Employs a custom 1500ms auto save debounce cycle that triggers update parameters on Firestore only when editing activity pauses, protecting database write capacities.
* Initial state hydration fires strictly once on viewport mount to lock down document changes and eliminate paragraph cursor resetting anomalies during parallel background snapshot updates.

### 4.2 File Processing Ingestion

* File upload forms support clean client side text parsing for raw `.txt` and markdown `.md` files.
* Incoming file data is translated directly into clean block nodes within the browser container and immediately deployed into a newly formed Firestore document subcollection, bypassing third party conversion infrastructure.

---

## 5. Architectural Engineering Trade-offs

* **Deferred Real-Time Multi-User Editing (CRDTs):** Decoupled simultaneous cursor sync architectures (Yjs, WebRTC mesh layers) were pushed out of scope to focus entirely on building data persistence safety, absolute file loading security, and clean state debounce loops within the assignment time constraints.
* **Client SDK Routing Realignment:** The structural endpoint paths under `app/api/` (built around the Firebase Admin SDK) are fully designed but intentionally bypassed by active frontend workflows. To avoid authentication blockages stemming from IAM service account credential propagation delays encountered during implementation, core creation, updating, and indexing actions were routed cleanly through client side SDK operations protected by strict database rulesets.
* **Denormalization vs Read Multipliers:** Access details (owner emails, document titles) are duplicated onto share indexing tables. This introduces a slight data update sync requirement but protects performance by allowing dashboards to render instantly in a single read step.

---

## 6. Firestore Access Control Perimeter (`firestore.rules`)

The security perimeter enforces explicit structural data constraints at the database level:

1. **Profile Protection:** Users are allowed full read validation access across user indexes but can only write to their specific authenticated `/users/{uid}` matching document profile.
2. **Unified Data Ownership:** Parent document reads verify that `request.auth.uid == resource.data.ownerId` to allow clean query aggregation for active and trashed document dashboards.
3. **Segregated Edit Rights:** Security rules distinguish active documents from trashed documents. Collaborators possess deep read and update clearance on active shared nodes but are blocked from accessing data layers once an owner moves a document into the trash.
4. **Subcollection Inheritance:** Read/write validation rules for the heavy `/content` collection mirror parent document access tokens, completely blocking external data reading queries.
5. **Lookup Index Security:** Collaborators hold absolute read security over their own `/sharedWithMe` index space, while owners maintain clearance to generate or drop index entries during sharing updates.
