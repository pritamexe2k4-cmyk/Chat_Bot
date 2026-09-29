# Phase 0 — product and safety blueprint

## Status

This document is the agreed design contract before Phase 1 changes the application. It is not a claim that the current chatbot provides mental-health care.

## Product statement

Build a mobile-first wellbeing companion for adults (18+) in India, initially for college students and early-career working professionals.

It helps a person slow down, name what is happening, reflect, and choose one small practical next step for everyday stress, overwhelm, loneliness, work pressure, or study pressure.

It is not therapy, a diagnostic tool, medical advice, crisis intervention, or a replacement for a qualified mental-health professional or human relationships.

## V1 promise

The first release will feel calm, private, and useful on a phone. A person can:

1. Talk through a difficult moment.
2. Complete a short check-in.
3. Choose one grounding, reflection, work-reset, study-reset, or sleep-wind-down exercise.
4. Find urgent-help information without searching through a chat.

The assistant gives short, clear responses. It asks one useful question at a time and offers one small next step instead of long lectures.

## Who it is for

| Included in V1 | Excluded from V1 |
| --- | --- |
| Adults aged 18 or older | Anyone known to be under 18 |
| Students, early-career professionals, or people between work and study | Clinical treatment or clinical decision support |
| Everyday wellbeing concerns | Diagnosis, medication, or treatment recommendations |
| English first; Hindi/Hinglish is a later, tested expansion | A claim to manage an emergency or keep someone safe |

## Context Card

The app will offer a gentle, optional onboarding card. Every answer is skippable and editable.

| Question | Suggested choices | How it may change the conversation |
| --- | --- | --- |
| What would you like help with today? | Study pressure; work stress; relationships or loneliness; overthinking; something else | Chooses the opening framing only |
| What does your day look like? | Student; working professional; both/between things; prefer not to say | Makes examples more relevant |
| How would you like me to speak with you? | Calm and gentle; direct and practical; reflective; a mix | Adjusts tone, never safety rules |
| What usually helps when things feel heavy? | Writing; small action plan; grounding; talking; not sure | Suggests an exercise, never assumes a diagnosis |
| Which perspectives are welcome? | Psychology and science; philosophy/life wisdom; faith/spirituality; practical only | Enables only user-selected perspective cards |

For V1, Context Card answers and chat history exist only in the current browser session. They are not silently saved as a long-term psychological profile.

## Values Lens

Psychology and practical, evidence-informed support are the default. Philosophy, life wisdom, and faith or spirituality are optional perspectives selected by the user.

The assistant may say, "Some people find this perspective helpful," and invite the user to accept or decline it. It must not:

- Claim to speak for God or know a person's fate.
- Use spiritual language to guilt, shame, or pressure a user.
- Treat faith as a substitute for emergency, medical, or professional care.
- Present a perspective card as scientific evidence unless it has an appropriate source.

## Safety Card

The product must plainly state that it is AI support, not emergency or clinical care. A persistent **Get urgent help** control must be visible in the mobile experience.

When a person says they may be in immediate danger, cannot keep themselves safe, or may harm themselves or someone else, ordinary coaching stops. The urgent-help view should calmly offer:

- **Emergency in India: call 112.**
- **Mental-health support in India: Tele-MANAS 14416.**
- A prompt to contact a trusted person nearby now.

V1 does not claim that a human is watching messages, does not promise a response time, and does not attempt emergency dispatch. High-risk detection, exact wording, multilingual coverage, and escalation review are Phase 3 work and require qualified clinical review before public launch.

## V1 mobile flows

1. **Welcome and Context Card** — brief explanation, age gate, optional preferences.
2. **Home** — three calm choices: Talk it through; Quick reset; Write privately.
3. **Conversation** — short chat, one question at a time, visible urgent-help control.
4. **Quick reset** — a short grounding or practical reset exercise.
5. **Urgent help** — immediate India-specific support information; no chat required.

## Privacy rule

V1 does not add a database, account system, permanent journal, hidden profile, or location tracking. The existing browser-session chat model remains the only context store.

Any later decision to remember preferences or store journals requires explicit opt-in, a view/edit/delete control, retention rules, and a privacy/legal review before implementation.

## Budget guardrail

The initial budget cap is INR 500. Phase 1 must remain within the existing deployment and use no new paid Azure service.

- Use one economical text model only.
- Set per-session message and response-length limits.
- Add an API-spend limit before inviting testers.
- Do not add a database, Redis, Front Door, API Management, mobile app-store distribution, or a second Azure region in V1.
- Pause spending and review before any expense beyond the INR 500 cap.

## Release criteria for Phase 1

Phase 1 is ready for private testing only when:

1. The mobile layout works comfortably on a narrow phone screen.
2. The product boundary and urgent-help control are visible.
3. Context Card answers are optional and remain session-only.
4. The assistant policy avoids diagnosis, medical advice, crisis promises, and religious certainty.
5. No new paid cloud service has been added.

## Phase 1 scope

Phase 1 changes only the current web experience and server policy:

- Mobile-first UI redesign for the five flows.
- Context Card held in browser session memory.
- Visible safety boundary and urgent-help page.
- A conservative wellbeing-support instruction set.
- Message and response-size limits to protect budget.

It does not add clinical assessment, user accounts, permanent memory, payments, push notifications, a database, or a new Azure product.
