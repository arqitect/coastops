# CoastOps

Mobile-first interactive product mockup for a **proof-to-pay workflow** aimed initially at very small mobile detailing businesses.

Live demo: https://arqitect.github.io/coastops/

## Product thesis

CoastOps should **not** become a generic all-in-one field-service CRM. Jobber, Urable, QuoteIQ, Square, Housecall Pro, and other incumbents already cover most obvious feature checklists.

The working differentiation is a field workflow where the worker interacts with software as little as possible:

> **Do the job normally. CoastOps handles the paperwork around you.**

The strongest initial ICP is an owner-operated mobile detailer with roughly 1–5 workers who currently uses some mixture of text messages, phone photos, Google Calendar, Square/QuickBooks, or a disliked FSM.

Do not market the product as an “AI app.” Machine assistance should mostly be invisible: price guidance, photo organization, pre-existing-condition detection, add-on suggestions, finish-proof coverage checks, and proof selection can happen behind the scenes while the merchant remains in control.

The original research that established this direction is committed at [`research/original-deep-research.md`](research/original-deep-research.md). Read it before broadening product scope.

## Current demo flow

The demo now shows the full wedge around the job without turning into a broad CRM:

1. **Lightweight intake + quote** — a new request contains the customer, vehicle, service and preferred time. CoastOps suggests a price using the merchant's own service template and prior-job range. The merchant remains in control and sends a customer link.
2. **Customer quote approval** — private link, no app/account required. Approval produces a customer confirmation state rather than dropping the customer into operator UI.
3. **Today** — Sarah Chen is the next job. The mockup explicitly positions CoastOps as compatible with an existing calendar/payment stack rather than requiring an all-or-nothing migration.
4. **Begin walkaround** — enters pre-job mode; the job is explicitly **not started yet**.
5. **Before walkaround** — take photos continuously with no category selection.
   - before photos can be added or removed;
   - capture timestamps and edit history are the evidence model;
   - likely pre-existing conditions are surfaced only after the walkaround for one quick merchant review.
6. **Confirm pre-existing conditions** — CoastOps suggests likely damage/conditions, but the merchant confirms the record and can add something manually.
7. **Start job** — appears only after the before record is ready. This is the actual operational start boundary and changes the job to **IN PROGRESS**.
8. **Job photos** — keep shooting naturally while working; CoastOps organizes afterward.
9. **Detected extra work** — example: pet hair in the rear cargo area, with a suggested $40 add-on based on the merchant's own history.
10. **Customer approval** — shareable customer link with photo, reason and exact added price. The customer remains on a customer confirmation screen after approving or declining; the operator state updates separately.
11. **Finish coverage check** — instead of forcing a photo checklist during the job, CoastOps checks the existing job photos at finish and recommends only the missing proof shots.
12. **Proof review** — CoastOps picks a before/after pair automatically, but the merchant can change either image before sending.
13. **Customer proof + payment** — the customer page prioritizes the finished result and total, while the detailed service record is available on demand. Payment is shown as an external payment-provider handoff.
14. **Maintenance rebook** — after payment, the customer can request a 4/6/8-week maintenance interval without re-entering vehicle history.

## Interaction semantics

- **Teal filled buttons are the primary progression action.** A user should be able to scan the screen and know what advances the workflow.
- Entering the before walkaround does **not** mark a job as started.
- The job becomes **IN PROGRESS** only when the user taps **Start job** after the before record is ready.
- Before photos remain editable. Preserve their capture timestamps and edit/audit history instead of using misleading “locked” language.
- Customer-facing routes have a visible **green frame/halo** plus a `CUSTOMER VIEW · Private link · no app needed` indicator.
- Customer and operator states are separate. Customer approval/decline never navigates directly into the operator UI; explicit `DEMO` bridge controls exist only to make the mockup traversable.
- The camera is a single continuous capture surface. Do not reintroduce front/rear/interior/etc. category taps before each photo.
- Finish-time proof coverage checks may recommend a small number of targeted shots, but should not become a mandatory per-photo checklist while the worker is doing the job.
- Automation chooses defaults; the merchant retains veto/control over price, condition records, add-ons and final customer proof.
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
- Customer-facing output should make a tiny detailing company look unusually professional, not like a liability/audit report.
- Do not broaden the mockup just to make every bottom-nav tab real. A smaller demo where the core path is excellent is preferable.

## Files

- `index.html` — static shell and versioned stylesheet/script loading.
- `styles.css` — base visual system and component styling.
- `v2.css` — proof-to-pay refinements, start/pre-start states, editable-before-photo UI, teal progression styling, and customer-view green halo.
- `flow.css` — intake/quote, condition review, proof-coverage, proof override, customer confirmation/payment, and rebooking styles.
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
4. Preserve the semantic start boundary: **pre-job walkaround → before record → Start job → active work**.
5. Never use “locked” for before photos while they remain editable. If evidence integrity matters, represent timestamps/audit history rather than pretending UI immutability.
6. Keep customer pages visibly different from the internal worker app; currently that is a green halo plus the customer-view strip.
7. Keep customer/operator state separated. Use explicit demo-only bridge controls when the mockup needs to jump devices.
8. Render relevant states at **390×844** after edits and inspect screenshots for clipping, hierarchy, whitespace, accidental density, and misleading state labels.
9. Exercise the full interaction path after structural changes, including adding/removing a before photo, confirming conditions, customer approve/decline confirmation, finish coverage, proof override, payment, and rebooking.
10. Prefer changing `app.js`/the underlying flow over adding another overlay or monkey-patch script.

Useful direct mockup states for visual inspection include query parameters such as:

```text
?screen=quote
?screen=quoteCustomer
?screen=today
?screen=active
?screen=active&before=4&conditions=3
?screen=active&before=4&conditions=3&work=1&workshots=4
?screen=conditions&before=4
?screen=customer&before=4&conditions=3&work=1&workshots=4&approval=pending
?screen=proofcheck&before=4&conditions=3&work=1&workshots=4
?screen=proofcheck&before=4&conditions=3&work=1&workshots=4&finishshots=2
?screen=complete&before=4&conditions=3&work=1&workshots=4&finishshots=2&approval=approved
?screen=pay&before=4&conditions=3&work=1&workshots=4&finishshots=2&approval=approved
?screen=rebook&before=4&conditions=3&work=1&workshots=4&finishshots=2&approval=approved&paid=1
```

These are mockup-only shortcuts. A production implementation should use real customer/job records, media objects, audit events, capture timestamps and separate customer/operator sessions.

## Product guardrails

The most important competitive warning from the research is that **photos + invoices + scheduling + approvals are not themselves differentiation**. Established products already offer those features.

CoastOps is only interesting if the complete workflow is materially easier:

> **request → price → walk around → shoot freely → start job → photograph an issue → confirm the suggested change → customer approves → finish check catches missing proof → merchant reviews the default proof → payment and rebooking are already assembled**

The product should prove that a worker can create a trustworthy job record with almost no administrative work.

The validation metric should therefore be behavioral, not aesthetic: measure **time spent touching software, taps/fields, and workflow interruptions per job** against the operator's existing process and direct competitors.

## Run locally

Open `index.html` directly, or run any static file server from the repository root, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

`main` deploys through `.github/workflows/pages.yml`. No build step is required.
