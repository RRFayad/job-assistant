# Persist Job Opportunity and Company data only when an Application is confirmed

**Status:** superseded by [0008](./0008-cut-application-tracking-and-cover-letter-from-v1.md) — Application and Company no longer exist in v1.0, so this ADR's trigger doesn't apply; kept here for history.

Candidates will paste many job URLs while exploring fit; most won't be pursued. We don't persist Job Opportunity content, or create/update a Company record, during exploratory matching — only once the Candidate confirms intent to apply. This avoids storing data for jobs never pursued and keeps exploratory matching lightweight, while guaranteeing that once an Application exists, its Job Opportunity snapshot and generated documents are fully traceable together.
