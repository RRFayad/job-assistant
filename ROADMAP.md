# Job Assistant — Product Roadmap

Long-term direction for Job Assistant, kept separate from `CONTEXT.md` (established domain language) and `docs/adr/` (individual decisions already made). Everything past v1.1 is direction only — not specified, not scheduled, not scoped. Do not treat any of it as a requirement until it gets its own domain-modeling and scoping pass.

## v1.0 — Understand & Prepare (current)

The core loop: Candidate creates a Profile (up to three) → paste a Job Opportunity URL → Match Assessment (what matches, what doesn't) → Candidate confirms intent to tailor → Tailored Resume. That's the whole v1.0 value: a grounded, tailored resume for a specific job, as lean and fast to ship as possible.

See `CONTEXT.md` for the definitions of these terms and `docs/adr/0003-v1-scope-exclusions.md` for what's deliberately left out.

## Deferred from v1.0 (not yet scheduled)

Two pieces explored in real depth during domain modeling, then deliberately cut to keep v1.0 lean — see [ADR-0008](./docs/adr/0008-cut-application-tracking-and-cover-letter-from-v1.md):

- **Tailored Cover Letter** — a second artifact alongside the Tailored Resume, grounded in Candidate facts plus a "why this company" section. Needs its own dedicated conversational flow to do well; not a small addition.
- **Application tracking** — a CRM-style status pipeline (Applied → Screening → Technical Interview(s) → Offer → Negotiation → outcome) with a Company entity and fields like salary range and follow-up dates. Cut entirely from v1.0, not merely postponed within it — nothing about it is assumed for later.

A likely near-term addition once Job Opportunity input exists: letting the Candidate correct a Match Assessment conversationally (e.g. "I don't have Jira listed but don't think it's needed" / "I have this skill, add it"). Per Grounding (ADR-0005), any such correction updates the relevant Profile, never the Tailored Resume directly — the same propose-then-accept pattern already built for the Profile's "Ask AI" assistant.

## v1.1 — Apply (tentative, not yet scoped)

The intended first major post-v1 feature: a Chrome extension that reduces friction on the actual application step. Direction, not a spec:

- Open the real application page
- Inspect the application form's fields
- Resolve known factual answers from the Candidate's Profile
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
- **Discover** — help discover Job Opportunities across multiple sources, matched/ranked against the Candidate's Profiles and Preferences
- **Interview** — assist with interview preparation using the Candidate Profile, Job Opportunity, Company context, and Application history

## Standing principle

AI helps the Candidate understand, prepare, and eventually execute the job-search workflow, but important factual claims must remain grounded (`docs/adr/0005-grounding-principle-fetched-sources-only.md`), and consequential actions preserve human control. AI suggestions never silently overwrite stored data — every suggestion is a proposal the Candidate explicitly accepts, whether that's Track Changes on a document (`docs/adr/0004-track-changes-default-for-tailored-documents.md`) or a suggestion from the Profile's "Ask AI" assistant (`docs/adr/0006-ai-suggestions-never-silently-overwrite-data.md`). In particular, v1.1 browser automation stops before final application submission — the Candidate remains responsible for reviewing and submitting the application.
