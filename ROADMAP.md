# Job Assistant — Product Roadmap

Long-term direction for Job Assistant, kept separate from `CONTEXT.md` (established domain language) and `docs/adr/` (individual decisions already made). Everything past v1.1 is direction only — not specified, not scheduled, not scoped. Do not treat any of it as a requirement until it gets its own domain-modeling and scoping pass.

## v1.0 — Understand, Prepare, Track (current)

The core loop: Candidate Profile → Baselines → paste a Job Opportunity URL → Match Assessment → Candidate decides whether to apply → Tailored Resume → Tailored Cover Letter → Application tracking.

See `CONTEXT.md` for the definitions of these terms and `docs/adr/0003-v1-scope-exclusions.md` for what's deliberately left out.

## v1.1 — Apply (tentative, not yet scoped)

The intended first major post-v1 feature: a Chrome extension that reduces friction on the actual application step. Direction, not a spec:

- Open the real application page
- Inspect the application form's fields
- Resolve known factual answers from the Candidate's Profile/Application
- Generate grounded, job-specific answers where AI is useful
- Flag unknown or ambiguous answers for the Candidate
- Fill the form and attach the appropriate Tailored Resume
- Stop before submission — the Candidate reviews and submits manually

Exact scope and implementation are undecided until this gets its own scoping pass.

## Later directions (vision only)

No scope, no requirements — named here so the v1.0 exclusions in `docs/adr/0003-v1-scope-exclusions.md` aren't mistaken for "not planned":

- **Research** — deeper Company research beyond v1.0's basic firmographic facts
- **Connect** — find relevant people at the Company (e.g. Apollo/Snov.io or similar)
- **Outreach** — assist with personalized email/LinkedIn outreach, grounded in Candidate, Job Opportunity, and Company facts
- **Follow Up** — track follow-up dates, suggest follow-ups, using Application/contact history as context
- **Discover** — help discover Job Opportunities across multiple sources, matched/ranked against the Candidate's Profile, Baselines, and Preferences
- **Interview** — assist with interview preparation using the Candidate Profile, Job Opportunity, Company context, and Application history

## Standing principle

AI helps the Candidate understand, prepare, and eventually execute the job-search workflow, but important factual claims must remain grounded (`docs/adr/0005-grounding-principle-fetched-sources-only.md`), and consequential actions preserve human control. In particular, v1.1 browser automation stops before final application submission — the Candidate remains responsible for reviewing and submitting the application.
