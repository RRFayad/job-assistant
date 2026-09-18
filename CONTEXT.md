# Job Assistant

An AI application assistant that understands a Candidate's professional background, analyzes Job Opportunities against it, and produces grounded, tailored application materials.

This glossary covers v1.0. For the longer-term product direction, see [ROADMAP.md](./ROADMAP.md).

## Language

### Candidate & Profile

**Candidate**:
The job-seeker using the platform to search for and apply to roles. Distinct from `User`, the SaaS-level Clerk-synced auth identity owned by the Next.js layer.
_Avoid_: User (in domain context), applicant, job seeker

**Profile**:
The Candidate's master pool of verified facts — work experience, education, skills, and projects — extracted from an uploaded resume and/or entered manually. The single source of truth for Grounding claims about the Candidate.
_Avoid_: resume data, CV data

**Baseline**:
One of up to three Candidate-defined angles on the same Profile, each pairing a resume document and a cover letter document built from the shared Templates and framed toward a particular role (e.g. Frontend vs. Full-Stack vs. Full-Stack AI). All Baselines draw from the same Profile; they differ in framing, not in underlying facts.
_Avoid_: career track, career goal, resume version

**Resume Template / Cover Letter Template**:
The single, universal empty Word document scaffold each Baseline's resume and cover letter are built on. One of each ships with the product; not user- or profession-specific in v1.
_Avoid_: format, layout

**Preferences**:
Candidate-level (not Baseline-level) job-search criteria used in matching: compensation range, company size, location, and sponsorship requirement.
_Avoid_: filters, settings

### Job Application Flow

**Job Opportunity**:
A specific job posting identified by a URL the Candidate pastes, fetched once with no recurring monitoring. Exploratory Job Opportunities are not persisted; one is only saved once the Candidate confirms an Application against it.
_Avoid_: job posting, listing, job (ambiguous)

**Match Assessment**:
The AI's analysis of fit between a Job Opportunity and the Candidate's Preferences and a specific Baseline, including the AI's suggested Baseline pick. Ephemeral — never persisted unless the Candidate proceeds to confirm an Application.
_Avoid_: match score, analysis (ambiguous alone)

**Company**:
A persisted entity (name, country, size/total employees, industry, source platform) representing an employer, created or updated when an Application is confirmed and deduplicated across multiple Applications to the same employer. Basic firmographic facts may be enriched via a single lookup; deep qualitative research is out of v1 (see ADR-0003).
_Avoid_: employer

**Application**:
Created when the Candidate confirms intent to apply to a Job Opportunity. Snapshots the Job Opportunity, links to its Company and the Baseline used, and tracks progress through a status pipeline: Applied → Screening → Technical Interview(s) → Offer → Negotiation → {Accepted, Rejected, Withdrawn, Ghosted}. Carries the Tailored Resume and Tailored Cover Letter generated for it, plus fields like salary range, position name, and last follow-up date.
_Avoid_: job tracker, pipeline entry

### Artifacts

**Tailored Resume**:
A Baseline's resume document, AI-edited for one specific Job Opportunity, delivered as a Word file with Track Changes on by default (see ADR-0004).
_Avoid_: adjusted resume, final resume

**Tailored Cover Letter**:
A Baseline's cover letter document, AI-edited for one specific Job Opportunity, incorporating Grounded Company facts. Delivered the same way as the Tailored Resume: Word file, Track Changes on by default.
_Avoid_: application letter

**Grounding**:
The rule that any fact an AI-tailored document asserts must trace to a fetched source: the Profile for claims about the Candidate, the Job Opportunity content or a Company lookup for claims about the employer. Never fabricated (see ADR-0005).
_Avoid_: hallucination-free, fact-checking
