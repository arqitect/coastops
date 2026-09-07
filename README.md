# CoastOps

Mobile-first interactive product mockup for a **proof-to-pay workflow** aimed initially at very small mobile detailing businesses.

Live demo: https://arqitect.github.io/coastops/

## Product thesis

CoastOps should **not** become a generic all-in-one field-service CRM. Jobber, Urable, QuoteIQ, Square, Housecall Pro, and other incumbents already cover most obvious feature checklists.

The working differentiation is a field workflow where the worker interacts with software as little as possible:

> **Take photos naturally; CoastOps turns the job into documentation, scope approval, billing, and customer-facing proof.**

The strongest initial ICP is an owner-operated mobile detailer with roughly 1–5 workers who currently uses some mixture of text messages, phone photos, calendar, Square/QuickBooks, or a disliked FSM.

Do not market the product as an “AI app.” Machine assistance should mostly be invisible: photo organization, issue detection, suggested add-ons/pricing context, and proof selection can happen behind the scenes while the merchant remains in control.

The original research that established this direction is committed at [`research/original-deep-research.md`](research/original-deep-research.md). Read it before broadening product scope.

## Current demo flow

The focused demo is intentionally narrow:

1. **Today** — Sarah Chen is the next job.
2. **Begin walkaround** — enters pre-job mode; the job is explicitly **not started yet**.
3. **Before walkaround** — take photos continuously with no category selection.
   - before photos can be added or removed;
   - the UI deliberately does **not** call them “locked”;
   - capture timestamps and edit history are the evidence model, rather than asking AI to infer whether a photo was really “before.”
4. **Start job** — appears only after a before set exists. This is the actual operational start boundary and changes the job to **IN PROGRESS**.
5. **Job photos** — keep shooting while working; CoastOps organizes afterward.
6. **Detected extra work** — example: pet hair in the rear cargo area, with a suggested $40 add-on based on the merchant’s own history.
7. **Customer approval** — shareable customer link, no app/account required.
8. **Approval audit trail** — request, photo, price, response, and timestamp stay associated with the job.
9. **Review & finish** — CoastOps assembles a proof package.
10. **Customer proof + payment** — before/after proof, final total, payment, and rebooking handoff.

## Interaction semantics

- **Teal filled buttons are the primary progression action.** A user should be able to scan the screen and know what advances the workflow.
- Entering the before walkaround does **not** mark a job as started.
- The job becomes **IN PROGRESS** only when the user taps **Start job** after before photos.
- Before photos remain editable. Preserve their capture timestamps and edit/audit history instead of using misleading “locked” language.
- Customer-facing routes have a visible **green frame/halo** plus a `CUSTOMER VIEW · Shareable link · no app needed` indicator.
- The camera is a single continuous capture surface. Do not reintroduce front/rear/interior/etc. category taps before each photo.
- The operator should interact with the app as little as possible while physically doing the job.

## UX principles

The target is a mature, low-friction field utility rather than a generic SaaS/AI aesthetic.

- Mobile first; primary review viewport is **390×844**.
- One screen = one primary question + one primary action.
- Preserve whitespace when it reduces cognitive load; do not fill empty space simply because it exists.
- Prefer ordinary rows, dividers, and system typography over nested rounded cards and pills.
- Use the teal accent selectively for progression, active state, and navigation.
- Photo capture is first-class and should remain faster than manually using a CRM attachment flow.
- The worker should complete the **job**, not “complete the software.”
- Customer-facing output should make a tiny detailing company look unusually professional.
- Do not broaden the mockup just to make every bottom-nav tab real. A smaller demo where the core path is excellent is preferable.

## Files

- `index.html` — static shell and stylesheet/script loading.
- `styles.css` — base visual system and component styling.
- `v2.css` — current proof-to-pay refinements, start/pre-start states, editable-before-photo UI, teal progression styling, and customer-view green halo.
- `app.js` — the complete demo state machine and screens. Structural behavior belongs here; avoid stacking patch scripts around it.
- `research/original-deep-research.md` — original market/product deep research.
- `.github/workflows/pages.yml` — GitHub Pages deployment.

There is deliberately no framework or build step; the mockup is plain HTML/CSS/JS so it can be changed and visually tested quickly.

## Notes for future agents

This repo is a **sales/validation mockup**, not a production architecture proposal. Before making product-scope decisions, read both this README and the research report.

When changing the mockup:

1. Preserve the proof-to-pay thesis and single-camera workflow.
2. Avoid adding broad CRM features unless the user explicitly asks for them.
3. Keep all primary progression CTAs teal and visually dominant.
4. Preserve the semantic start boundary: **pre-job walkaround → before photos → Start job → active work**.
5. Never use “locked” for before photos while they remain editable. If evidence integrity matters, represent timestamps/audit history rather than pretending UI immutability.
6. Keep customer pages visibly different from the internal worker app; currently that is a green halo plus the customer-view strip.
7. Render relevant states at **390×844** after edits and inspect screenshots for clipping, hierarchy, whitespace, accidental density, and misleading state labels.
8. Exercise the full interaction path after structural changes, including adding/removing a before photo and verifying that **Start job** is the transition that creates the active state.
9. Prefer changing `app.js`/the underlying flow over adding another overlay or monkey-patch script.

Useful direct mockup states for visual inspection include query parameters such as:

```text
?screen=today
?screen=active
?screen=active&before=4&conditions=2
?screen=active&before=4&conditions=2&work=1
?screen=camera&before=4&conditions=2&mode=before
?screen=customer&before=4&conditions=2&work=1&workshots=6&approval=pending
?screen=pay&before=4&conditions=2&work=1&workshots=6&approval=approved
```

These are mockup-only shortcuts. A production implementation should use real job records, media objects, audit events, and capture timestamps.

## Product guardrails

The most important competitive warning from the research is that **photos + invoices + scheduling + approvals are not themselves differentiation**. Established products already offer those features.

CoastOps is only interesting if the complete workflow is materially easier:

> **walk around → shoot freely → start job → photograph an issue → confirm the suggested change → customer approves → finish → proof and payment are already assembled**

The product should prove that a worker can create a trustworthy job record with almost no administrative work.

## Run locally

Open `index.html` directly, or run any static file server from the repository root, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

`main` deploys through `.github/workflows/pages.yml`. No build step is required.
