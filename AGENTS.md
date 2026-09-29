# Still — project working agreement

## Product boundary

- Build a mobile-first wellbeing companion for adults (18+) in India.
- It supports reflection, grounding, and small practical next steps. It is not therapy, diagnosis, medical advice, crisis intervention, or an emergency service.
- Keep urgent help visible. For an immediate risk disclosure, stop ordinary coaching and direct the person to call 112, Tele-MANAS at 14416, and a trusted person nearby.

## Product and privacy rules

- Treat context-card answers and chat history as sensitive wellbeing data.
- Until a later, explicitly approved privacy design, keep them session-only: no database, hidden profile, analytics tracking, or permanent memory.
- Never put secrets, API keys, passwords, or service-account JSON in source code, documentation, browser code, git history, or agent memory.
- Never claim a human is monitoring messages or promise a safety response.

## Delivery rules

- Work one approved phase at a time. State the outcome and "done when" check before implementation.
- The initial budget ceiling is INR 500. Do not add a paid service or a new Azure product without Preetam's explicit approval.
- Prefer the smallest reversible implementation. Do not remove code, data, or configuration without explaining the exact target and receiving approval.
- Pushes run CI only. Production Azure deployment must remain a deliberate manual GitHub Actions action.
- Before saying a phase is complete, run the relevant checks and report what was and was not verified.

## Current direction

- Phase 2 begins with a calm first-minute UX blueprint before code changes.
- Google sign-in via Firebase and an installable PWA are candidates for Phase 2, not already implemented.
- The Context Card should support bounded multi-select answers where useful; validate every submitted value on the server before using it in model instructions.

## Source of truth

- Read `docs/project-state.md` before planning or changing this project.
- Read `docs/phase-0-product-safety-blueprint.md` before work that affects product safety, context, or privacy.
