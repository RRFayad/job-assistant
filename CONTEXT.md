# Job Assistant

An AI application assistant that understands a Candidate's professional background, analyzes Job Opportunities against it, and produces grounded, tailored application materials.

This glossary covers v1.0. For the longer-term product direction, see [ROADMAP.md](./ROADMAP.md).

## Language

### Candidate & Profile

**Candidate**:
The job-seeker using the platform to search for and apply to roles. Distinct from `User`, the SaaS-level Clerk-synced auth identity owned by the Next.js layer.
_Avoid_: User (in domain context), applicant, job seeker

**Profile**:
One of up to three full resume/cover-letter entities a Candidate maintains — each with its own header, ordered sections, and theme colors — created by uploading a resume, starting from a blank Template, or duplicating an existing Profile as a starting point. Profiles are independent once created: editing one does not update the others. The single source of truth for Grounding claims about the Candidate for whichever Profile is in use.
_Avoid_: Baseline, career track, career goal, resume version, resume data, CV data

**Resume Template**:
The Word document defining the exported resume's visual design (fonts, colors, spacing, section styling) — not a scaffold each export is filled into directly. A Profile's variable-length, reorderable sections don't fit its fixed layout, so pieces (section heading, job title, bullet, header banner, ...) are cloned from its Word XML and reassembled per-Profile instead; an alternate header banner for Profiles with no photo lives on its own page within the same file (see ADR-0009). Each cloned piece carries a native Word comment explaining what it's used for — read those before changing the file's layout. Ships with the product; not user- or profession-specific in v1. Stored at `backend/templates/resume_template.docx`. A Cover Letter Template follows once Cover Letter itself is built (see ROADMAP.md — deferred past v1.0).
_Avoid_: format, layout, CV, fixed template, scaffold

**Preferences**:
Candidate-level (not Profile-level) job-search criteria used in matching: compensation range, company size, location, and sponsorship requirement.
_Avoid_: filters, settings

### Job Matching & Tailoring

**Job Opportunity**:
A specific job posting identified by a URL the Candidate pastes, fetched once with no recurring monitoring. Exploratory Job Opportunities are not persisted. Exactly what persists once the Candidate confirms intent to tailor is still being defined — v1.0 has no Application or Company entity to key that persistence off of (see ADR-0008); this gets resolved in the Job Matching/Tailoring scoping pass.
_Avoid_: job posting, listing, job (ambiguous)

**Match Assessment**:
The AI's analysis of fit between a Job Opportunity and the Candidate's Preferences and a specific Profile — including which parts match, which don't, and the AI's suggested Profile pick. Ephemeral — never persisted unless the Candidate proceeds with tailoring.
_Avoid_: match score, analysis (ambiguous alone)

### Artifacts

**Tailored Resume**:
A Profile's resume document, AI-edited for one specific Job Opportunity, delivered as a Word file with Track Changes on by default (see ADR-0004). The only tailored artifact v1.0 produces — see ADR-0008 for what's deferred.
_Avoid_: adjusted resume, final resume

**Grounding**:
The rule that any fact an AI-tailored document asserts must trace to a fetched source — the relevant Profile for claims about the Candidate, the Job Opportunity content for claims about the role. Never fabricated (see ADR-0005).
_Avoid_: hallucination-free, fact-checking
