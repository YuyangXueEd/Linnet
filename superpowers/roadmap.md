# Linnet — Roadmap

This file tracks product direction, planned work, and known debt.

---

## Product direction (locked)

These decisions are settled and should guide all implementation choices.

### Positioning
- Primary audience: information-overloaded knowledge workers, not researchers first.
- Core promise: `your personal AI morning briefing`.
- Product framing: sell an elite-feeling daily briefing workflow, not an aggregator.
- Narrative frame: "your AI secretary prepares a quality briefing before you start the day" — not "a configurable content pipeline."
- Setup Wizard role: the main product entry point, not a helper page.

### Funnel stance
- Current GitHub-first setup is acceptable only as a short-term bridge.
- Near term: hide technical friction behind guided onboarding, strong demo output, and explicit hand-holding.
- Long term: move toward a lighter SaaS-like flow instead of `fork + secrets + Actions` as the main public funnel.
- Near-term bridge tactic: polished 1-2-3 visual guidance; leave room for a `1-minute setup` video.
- Conversion warning: `fork + add secret + run workflow` is a dead-end for mainstream users if shown as the primary journey.
- Setup Wizard success criterion: the first 30 seconds should create an "Aha" moment before users feel they are doing configuration work.

### Proof and packaging
- Use founder dogfooding as the first credibility source.
- Show polished real outputs before talking about architecture.
- Keep the current simple starter-mode design for now; do not add more templates until proof examples show a clear need.
- Treat open source and deep customisation as trust/infrastructure, not the hero message.
- Practice "restrained openness" — hide extension, sink, and theme complexity behind advanced paths.

### Brand direction
- Desired feel: scholarly, calm, efficient, premium-minimal.
- Typography: serif for high-impact headlines and digest presentation; clean sans-serif for support text.
- Colour: paper/off-white background, slate-gray body text, restrained dark red or refined gold accent.
- Avoid: all-sans layouts, pure black/white, bright developer-tool blues as the dominant signal.

### Distribution hooks (P2)
- HN / Reddit / V2EX: anti-noise, self-hosted, open, data-in-your-control angle.
- Xiaohongshu / Jike: aesthetic, efficient, "AI secretary" angle with polished visual output.
- Channel rule: the story should change by platform even if the product stays the same.

---

## Now

These are the highest-leverage items for the next execution window.

### 1. Improve proof and public packaging
- [ ] Expand the proof section with concrete founder-run use cases and captions, not only screenshots.
- [ ] Add direct links for any repos/snippets where code or UI was substantially adapted.

Definition of done:
- Homepage and README show real examples of what Linnet produces.
- Public-facing copy keeps the current starter-mode design stable unless real proof examples create demand for more modes.

### 2. Add low-cost distribution basics
- [ ] Draft the first launch post for one primary channel.
  Recommended first candidate: `Show HN: Linnet – self-hosted AI research digest via GitHub Actions`.

Definition of done:
- At least one launch-ready written post exists in-repo or in docs drafts.

---

## Next

These are the next product and UX improvements once the current funnel feels stable.

### 1. Sink delivery ergonomics
- [ ] Add optional `delivery_mode: single | sectioned` config for sinks.
- [ ] For Slack: consider `sectioned` as default because Block Kit has field/block limits.
- [ ] For ServerChan: keep `single` as the conservative default.
- [ ] Add `max_jobs` config parity to the Slack sink.
- [ ] Add tests covering single vs multi-message delivery behaviour.

Definition of done:
- Sink behaviour is predictable across Slack and ServerChan.
- Delivery splitting is configurable and tested.

### 2. Documentation IA
- [ ] Enable GitHub Wiki for newcomer-friendly onboarding and FAQs.
- [ ] Add first-wave Wiki pages: Home, Quick Start for Beginners, Glossary, Troubleshooting, Use Cases.
- [ ] Link the Wiki from `README.md`, `README_zh.md`, and setup surfaces.

Definition of done:
- README stays focused.
- Troubleshooting and beginner docs live in one place instead of being scattered.

### 3. Future-proof the onboarding narrative
- [ ] Prepare the site for future non-GitHub onboarding.
  Write copy and structure that can survive a SaaS-like deployment flow without a full rewrite.
- [ ] Prepare copy and layout for a future lightweight web onboarding flow.
  Leave a clean path for `sign in → enter key → deploy/run` without rewriting the public narrative.

Definition of done:
- The public story no longer depends on GitHub being the permanent main funnel.

---

## Later

These remain useful, but should follow after onboarding, proof, and docs are in a better place.

### Growth & promotion
- [ ] Reddit `r/selfhosted` — "I built a self-hosted daily research digest using GitHub Actions + LLM".
- [ ] Reddit `r/MachineLearning` or `r/LocalLLaMA` — arXiv + AI summary angle.
- [ ] dev.to or hashnode article — technical walkthrough.
- [ ] 知乎文章 — 面向中文学术圈。
- [ ] Showcase page (`docs/showcase.md`) listing forks with live sites.
- [ ] RSS output so users can subscribe via any RSS reader.
- [ ] Confirm GitHub Discussions is enabled.
- [ ] Pin one "Share your setup" discussion thread.

### Feature backlog

#### Email sink `[P0]`
- [ ] Add an email sink using SendGrid, Mailgun, or SMTP.
- [ ] Support plain-text digest + HTML version.
- [ ] Add config shape for `sinks.email.enabled` and `SENDGRID_API_KEY` / `SMTP_*` secrets.

#### Discord sink `[P1]`
- [ ] Add an incoming webhook sink using Discord embeds.

#### Telegram sink `[P1]`
- [ ] Add a Bot API sink using `sendMessage` with Markdown.
- [ ] Support `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID`.

#### Generic RSS / RSSHub extension `[BACKLOG]`
- [ ] Add a generic RSS extension backed by `feedparser`.
- [ ] Support named feeds and `max_items_per_feed`.
- [ ] Let the LLM summarise entries in `process()`.

### LLM follow-ups
- [ ] Add native Anthropic/Gemini adapters beyond OpenAI-compatible endpoints if real demand appears.

### Performance
Implement after the visual redesign is stable.

- [ ] Add `astro-critters` for critical CSS inlining.
- [ ] Add `@playform/compress` for HTML/CSS/JS minification at build.
- [ ] Make Google Fonts non-blocking with the `media="print" onload` pattern.
- [ ] Add `font-display: swap` to all `@font-face` declarations.
- [ ] Preload the LCP hero image with `fetchpriority="high"`.
- [ ] Defer third-party scripts until user interaction when possible.

---

## Human decisions needed

- [ ] Approve the strongest real digest screenshots and proof examples for the homepage.
- [ ] Decide whether to record the `1-minute setup` video now or after the next homepage rewrite.
- [ ] Decide when to prioritise the long-term SaaS-like onboarding path over GitHub-only setup.
