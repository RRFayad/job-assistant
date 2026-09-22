# Single Profile with up to three Baseline angles, not a three-layer Career Track model

**Status:** superseded by [0007](./0007-collapse-baseline-into-profile.md) — building the actual Profile editor showed the Profile/Baseline split was never realized in practice; kept here for history.

Candidates targeting adjacent roles (e.g. Frontend, Full-Stack, Full-Stack AI) don't have fundamentally different careers — just different framings of the same experience. We considered modeling this as Profile → Career Track → Baseline, with each Career Track carrying its own identity and seniority range, but rejected it as unnecessary complexity. Instead: one Profile (master facts) with up to three Baselines, each a resume+cover-letter angle built from that Profile, with no separate Career Track entity.
