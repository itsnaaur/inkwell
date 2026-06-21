# AI Workflow & Engineering Judgment

## 1. Collaborative Engineering Tools

* **Claude (Sonnet):** Leveraged for initial system design validation, rapid schema brainstorming, data modeling trade-offs, and security rule construction.
* **Cursor AI:** Utilized as an inline pair programmer for rapid boilerplate generation, component scaffolding, and refactoring loops.

---

## 2. Human-Driven Architectural Decisions (AI Overrides)

This application was built utilizing an AI-native workflow, but critical engineering architecture, stack changes, and debugging adjustments were entirely human-driven.

### Overriding the Database Selection (Supabase vs. Firebase)

* **AI Recommendation:** The assistant initially pushed for an architecture built entirely on Supabase.
* **Human Engineering Judgment:** I deliberately rejected this recommendation. Having production experience with the Firebase ecosystem, I chose Next.js 14 paired with Firebase Auth and Firestore. This allowed for instant implementation of zero-boilerplate real-time socket listeners and a robust security rules layer. To handle the lack of native user email queries in Firebase Client Auth, I designed a custom synchronization pipeline that populates a dedicated `/users` collection instantly upon signup.

### Restructuring for High-Scale Performance (Content Decoupling)

* **AI Recommendation:** The AI models natively grouped the document title, metadata, and the heavy Tiptap rich-text JSON state inside a single monolithic document node: `/documents/{docId}`.
* **Human Engineering Judgment:** Recognizing that this naive structure would create massive N+1 read overhead and download full document bodies every time the sidebar or dashboard loaded, I overrode the model. I instructed the AI to refactor the data layer, isolating heavy content states into a separate `/documents/{docId}/content/main` subcollection so list queries remain incredibly fast as the workspace scales.

### Resolving Firestore Security Errors (Sharing Index Overhaul)

* **AI Recommendation:** The AI initially recommended using a Firestore `collectionGroup` query on a nested `/shares` subcollection to aggregate files shared with a recipient.
* **Human Engineering Judgment:** During continuous integration testing, I caught repeated database permission exceptions caused by this pattern. Instead of fighting the collection group index constraints, I completely refactored the data model to create a dedicated user lookup collection (`/users/{uid}/sharedWithMe/{documentId}`). This approach simplified database security rules, eliminated cross-owner data leakage, and provided a clean surface for instant sidebar hydration.

---

## 3. Targeted AI Acceleration (Where AI Materially Sped Up Velocity)

The intentional application of AI tools shaved roughly **2.5 to 3 hours** off the development lifecycle by accelerating syntax implementation and boilerplate construction:

* **Rich-Text Hydration Boilerplate:** Rapidly generated the client-side UI buttons and mapped command bindings for the headless Tiptap canvas.
* **State Optimization:** Fast implementation of the 1500ms auto-save debounce cycle to prevent rapid, unnecessary writes to Firestore during live editing.
* **Parsing Utilities:** Provided the core structural framework for the line-by-line `.txt` and `.md` client-side browser reader.
* **Security Scaffolding:** Drafted initial baseline JSON matching schemas for Firestore access control.

---

## 4. Code Quality Auditing & Code Rejections

Outsourcing implementation speed did not mean outsourcing technical judgment. Multiple AI-generated blocks were actively modified or discarded upon code review:

* **Security Rules Gap:** The AI-generated security rules completely omitted the nested content subcollection validation paths, leaving newly separated document data exposed. I manually expanded the rule set to ensure nested read/write rules strictly match parent document ownership.
* **Out-of-Scope Bloat:** The AI repeatedly attempted to pull in heavy third-party parsing tools like `mammoth.js` for `.docx` formatting, along with extensive real-time web socket libraries (Yjs). I explicitly rejected these additions to maintain strict timebox compliance, opting to declare clear scope limitations in the user interface.
* **Missing Error States:** AI boilerplate lacked robust UI exceptions for database rejections. I refactored the logic to introduce clean loading boundaries and structured user notifications instead of generic console errors.

---

## 5. Verification & Correctness Paradigms

Implementation reliability was validated through a continuous testing framework:

* **Automated Logic Audits:** Maintained a clean Jest unit testing block verifying that string manipulation loops correctly map incoming markdown lines (`#`, `##`, `###`) into valid, uncorrupted Tiptap JSON block schemas.
* **Cross-User Session Testing:** Validated the security perimeter by operating two simultaneous authenticated browser sessions (Alice as Owner, Bob as Collaborator) to check live access grants, editing constraints, and trash visibility restrictions.
* **Security Rules Playground:** Verified the Firestore rule matrix by running manual mock operations inside the Firebase Console to guarantee that non-shared users are completely blocked from reading private documents.
