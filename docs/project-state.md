# Still — project state

**Last verified:** 2026-09-29  
**Status:** Phase 1 is deployed for private testing. Phase 2.0 (UX blueprint) is next.

## Product promise

Still is a mobile-first wellbeing companion for adults (18+) in India, especially students and early-career professionals. It helps someone pause, name what feels difficult, and choose one small next step. It is not therapy, diagnosis, medical advice, crisis intervention, or an emergency service.

## Current live release

- **Live URL:** `https://preetam-chatbot-2026-bjgwafbhcge5cwdq.centralindia-01.azurewebsites.net`
- **Last implemented commit:** `1ff58f9 feat: add mobile wellbeing companion phase 1`
- **Deployment model:** Git pushes run CI. Azure deployment is manually started from GitHub Actions with `DEPLOY_PRODUCTION` confirmation.
- **Live smoke check completed:** `/health` responded successfully and the Phase 1 mobile experience was visible. A live authenticated chat reply has not been re-verified after the Phase 1 deployment.

## What exists now

- Password-protected Node/Express web app with OpenAI calls kept server-side.
- Mobile-first Phase 1 interface: welcome, optional Context Card, home choices, chat, quick reset, and urgent-help screen.
- Urgent-help information for India: emergency **112** and Tele-MANAS **14416**.
- Context answers and chat history exist only for the active browser session; refresh or logout clears them.
- Browser sends the current Context Card object with each chat request. The server allowlists accepted values, then uses them only to tailor the model instruction for that request.
- Input and response limits are in place to protect the initial INR 500 budget.

## Decisions already locked

- Mobile-first web app now; installable PWA before a Play Store app.
- Google authentication is the preferred Phase 2 path, using Firebase Authentication with server-side ID-token verification.
- Do not copy another product's UI. Borrow only calm, low-cognitive-load interaction patterns.
- Psychology and practical support are the default lens. Philosophy, life wisdom, and faith/spirituality are optional user-selected perspectives, never presented as certainty.
- No new paid cloud service, database, permanent journal, tracking, push notifications, or app-store release within the INR 500 cap unless Preetam approves it.

## Next outcome — Phase 2.0

Lock the exact "first safe minute" flow before editing code:

1. Gentle check-in with a 0–10 self-reflection slider.
2. Immediate safety branch for a high number: ask whether the person is in immediate danger, without treating the slider as diagnosis or risk scoring.
3. Multi-select (bounded) "what feels closest" choices.
4. Multi-select (bounded) "what would help in the next two minutes" choices.
5. A calm full-screen conversation with one question at a time and an always-available urgent-help control.
6. A short reset and optional "how heavy now?" check-out.

**Done when:** the screen order, each prompt, answer rules, editable/back behaviour, and safety branch wording are written down and approved. No code or provider change is required for Phase 2.0.

## Known gaps and deliberately deferred work

- No Google/Firebase authentication yet.
- No PWA manifest, service worker, app icon, or app-store distribution yet.
- No database or opt-in long-term user memory.
- No formal privacy policy, deletion flow, consent flow, or clinical review.
- No automated test coverage yet; `npm.cmd test` currently completes with zero tests.
- No production-grade crisis classifier or multilingual safety coverage. The current model instruction provides a conservative response path only.
- No load testing, rate-limit observability, dashboards, backups, or multi-region architecture. Those are later work, not appropriate within the current budget.

## Verification routine for future phases

1. Run syntax checks and relevant tests locally.
2. Check the diff is scoped to the approved phase.
3. Commit and push only after local verification.
4. Confirm CI succeeds.
5. Deploy manually only when Preetam explicitly asks to deploy that phase.
6. After deployment, smoke-test the live URL and record the result here.
