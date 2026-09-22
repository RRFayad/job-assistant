# v1 excludes browser automation, deep company research, outreach mapping, and multi-resume merging

Several adjacent features were discussed and explicitly deferred to keep v1 disciplined. v1 does **not** include: a Chrome extension or any automated form-filling; company research beyond basic firmographic facts (mission/culture/recent news are out); people/contact mapping for outreach (e.g. via Apollo/Snov.io); or merging multiple uploaded resume files into one Profile (v1 parses a single upload per Profile; additional Profiles are created by duplicating an existing one, not by merging separate source documents). Each is a materially larger feature in its own right; recording the "no"s here prevents them from being silently assumed in or out later.

The Chrome extension exclusion is a sequencing choice, not a permanent one: it's the intended first major post-v1 feature, tentatively v1.1, with its own scoping pass still to come. See [ROADMAP.md](../../ROADMAP.md).

Application tracking and Cover Letter are also excluded from v1.0 — see [ADR-0008](./0008-cut-application-tracking-and-cover-letter-from-v1.md) for that decision and its reasoning.
