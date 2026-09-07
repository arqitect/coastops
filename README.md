# CoastOps

Mobile-first interactive product mockup for a **proof-to-pay workflow** aimed initially at very small mobile detailing businesses.

Live demo: https://arqitect.github.io/coastops/

## Product thesis

CoastOps should **not** become a generic all-in-one field-service CRM. Jobber, Urable, QuoteIQ, Square, Housecall Pro, and other incumbents already cover most obvious feature checklists.

The working differentiation is a field workflow where the worker interacts with software as little as possible:

> **Take photos naturally; CoastOps turns the job into documentation, scope approval, billing, and customer-facing proof.**

The strongest initial ICP is an owner-operated mobile detailer with roughly 1–5 workers who currently uses some mixture of text messages, phone photos, calendar, Square/QuickBooks, or a disliked FSM.

Do not market the product as an “AI app.” Machine assistance should mostly be invisible: photo organization, issue detection, suggested add-ons/pricing context, and proof selection can happen behind the scenes while the merchant remains in control.

See [`research/original-deep-research.md`](research/original-deep-research.md) for the original market/product research that led to this direction.

## Current demo flow

The focused demo is intentionally narrow:

1. **Today** — Sarah Chen is the next job.
2. **Start walkaround** — enters pre-service mode; the job is **not started yet**.
3. **Before walkaround** — take photos continuously with no category selection.
   - before photos are editable before the job starts;
   - the worker can add more or remove the last photo;
   - capture order/timestamps provide stronger evidence than asking AI to guess “before vs. after.”
4. **Start job** — after the before set is ready, this is the actual operational start boundary.
5. **Job photos** — keep shooting while working; CoastOps organizes afterward.
6. **Detected extra work** — example: pet hair in the rear cargo area, with a suggested $40 add-on based on the merchant’s own history.
7. **Customer approval** — shareable customer link, no app/account required.
8. **Approval audit trail** — request, photo, price, response, and timestamp stay associated with the job.
9. **Review & finish** — CoastOps assembles a proof package.
10. **Customer proof + payment** — before/after proof, final total, payment, and rebooking handoff.

### Interaction semantics

- **Teal filled buttons are the primary progression action.** A user should be able to scan the screen and know what advances the workflow.
- Entering the before walkaround does **not** mark a job as started.
- The job becomes **IN PROGRESS** only when the user taps **Start job** after before photos.
- Before photos are **editable until that boundary**. Avoid “locked” language for the editable pre-service set.
- Customer-facing routes have a visible **green halo** and a `CUSTOMER VIEW · Shareable link · no app needed` indicator.
- The camera is a single continuous capture surface. Do not reintroduce front/rear/interior/etc. category taps before each photo.
- Rapid shutter tapping must not trigger browser double-tap zoom.

## UX principles

The target is a mature, low-friction field utility rather than a generic SaaS/AI aesthetic.

- Mobile first; primary review viewport is **390×844**.
- One screen = one primary question + one primary action.
- Preserve whitespace when it reduces cognitive load; do not fill empty space simply because it exists.
- Prefer ordinary rows, dividers, and system typography over nested rounded cards and pills.
- Use the teal accent selectively for progression/state/navigation.
- Photo capture is first-class and should remain faster than manually using a CRM attachment flow.
- The worker should complete the **job**, not “complete the software.”
- Customer-facing output should make a tiny detailing company look unusually professional.
- Do not broaden the mockup just to make every bottom-nav tab real. A smaller demo where the core path is excellent is preferable.

## Files

- `index.html` — static shell and stylesheet/script loading.
- `styles.css` — original visual system and component styling.
- `v2.css` — focused proof-to-pay refinements and teal progression styling.
- `app.js` — core demo state machine/screens.
- `state-ui.js` — current interaction/semantic layer: pre-service vs. started state, customer-view halo, editable before-photo behavior, rapid-tap camera behavior, and resume states.
- `research/original-deep-research.md` — original deep research report.
- `.github/workflows/pages.yml` — GitHub Pages deployment.

There is deliberately no framework or build step; the mockup is plain HTML/CSS/JS so it can be changed and visually tested quickly.

## Notes for future agents

Before changing product scope, read this README and the research report. The repo is a **sales/validation mockup**, not a production architecture proposal.

When making UX changes:

1. Preserve the proof-to-pay thesis and single-camera workflow.
2. Avoid adding broad CRM features unless the user explicitly asks for them.
3. Keep all primary progression CTAs teal and visually dominant.
4. Maintain the semantic start boundary: **walkaround first → Start job second**.
5. Treat customer pages as a visibly different mode from the internal worker app.
6. Render the relevant states in headless Chromium at 390×844 after edits and inspect screenshots for clipping, hierarchy, whitespace, accidental density, and misleading state labels.
7. Check the full flow, not just the edited screen.
8. Prefer modifying the underlying implementation over stacking fragile visual patches when a change becomes structural.

### Demo state implementation

`state-ui.js` currently uses session storage to keep the demo’s started/pre-service state coherent across navigation:

- `coastops-demo-started`
- `coastops-demo-before-count`

This is mockup-only state. A production implementation should use real job/audit records and capture timestamps rather than session storage.

## Product guardrails

The most important competitive warning from the research is that **photos + invoices + scheduling + approvals are not themselves differentiation**. Established products already offer those features.

CoastOps is only interesting if the complete workflow is materially easier:

> **walk around → shoot freely → start work → photograph an issue → confirm the suggested change → customer approves → finish → proof and payment are already assembled**

The product should prove that a worker can create a trustworthy job record with almost no administrative work.

## Run locally

Open `index.html` directly, or run any static file server from the repository root, for example:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## GitHub Pages

`main` deploys through `.github/workflows/pages.yml`. No build step is required.
