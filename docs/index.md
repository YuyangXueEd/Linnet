---
layout: home
title: Home
nav_order: 1
---

<div class="landing-shell">
  <section class="landing-hero">
    <div class="landing-kicker">Live digest demo</div>
    <h1>One research briefing, refreshed every day.</h1>
    <p>
      This site is a live example of what your own <strong>MyDailyUpdater</strong>
      digest looks like after forking the repo, adding one API key, and letting
      GitHub Actions do the rest. New papers, tech stories, trending repos, and
      optional extras are collected, filtered, summarized, and published here
      automatically.
    </p>

    <div class="landing-actions">
      <a class="landing-button primary" href="{{ '/setup/' | relative_url }}">Open Setup Wizard</a>
      <a class="landing-button secondary" href="{{ '/setup/zh/' | relative_url }}">中文设置入口</a>
      <a class="landing-button secondary" href="https://github.com/YuyangXueEd/MyDailyUpdater">Fork on GitHub</a>
      <a class="landing-button secondary" href="{{ '/support/' | relative_url }}">Support the project</a>
    </div>

    <div class="landing-stat-grid">
      <div class="landing-stat">
        <strong>Daily</strong>
        <span>Fresh arXiv, Hacker News, GitHub Trending, weather, and extras.</span>
      </div>
      <div class="landing-stat">
        <strong>Weekly</strong>
        <span>A rollup view for the last seven days, built from your saved data.</span>
      </div>
      <div class="landing-stat">
        <strong>Monthly</strong>
        <span>A wider trend summary for the whole month, published automatically.</span>
      </div>
      <div class="landing-stat">
        <strong>Forkable</strong>
        <span>The site you see here is generated directly from the same public repo.</span>
      </div>
    </div>
  </section>

  <section class="landing-grid">
    <article class="landing-card">
      <h2>Browse the digest</h2>
      <p>The generated site keeps the daily stream and the longer rollups in one place.</p>
      <ul class="landing-list">
        <li><a href="{{ '/daily/' | relative_url }}">Daily digest</a> for today’s papers, stories, and repos</li>
        <li><a href="{{ '/weekly/' | relative_url }}">Weekly rollup</a> for the last seven days</li>
        <li><a href="{{ '/monthly/' | relative_url }}">Monthly overview</a> for the broader trend view</li>
      </ul>
    </article>

    <article class="landing-card">
      <h2>How setup works</h2>
      <p>The wizard now follows the same product feel as the public site: guided, lightweight, and explicit about secrets.</p>
      <ul class="landing-list">
        <li>Choose and order your feed sources</li>
        <li>Configure only the extensions you selected</li>
        <li>Set weekly and monthly preferences</li>
        <li>Choose notification sinks without writing secrets into YAML</li>
      </ul>
    </article>

    <article class="landing-card">
      <h2>Audience-specific paths</h2>
      <p>Different users can start from different entry points without changing the underlying repo structure.</p>
      <div class="landing-chip-row">
        <span class="landing-chip">English setup → Slack-first guidance</span>
        <span class="landing-chip">中文入口 → Server酱-first guidance</span>
        <span class="landing-chip">Manual config remains available</span>
      </div>
    </article>

    <article class="landing-card">
      <h2>Support ongoing maintenance</h2>
      <p>If this project helps your research workflow, you can support continued maintenance and polish.</p>
      <div class="landing-actions">
        <a class="landing-button secondary" href="{{ '/support/' | relative_url }}">Open support page</a>
        <a class="landing-button secondary" href="https://github.com/sponsors/yuyangxueed">GitHub Sponsors</a>
        <a class="landing-button secondary" href="https://ko-fi.com/guesswhat_moe">Ko-fi</a>
      </div>
    </article>
  </section>

  <section class="landing-highlight">
    <h2>What the demo represents</h2>
    <div class="landing-dual">
      <div>
        <p>
          The topics shown here are just one person’s configuration. Fork the
          repo, swap in your own keywords, city, and sources, and the same site
          structure becomes your own research dashboard.
        </p>
        <div class="landing-note">
          <strong>Fastest route</strong>
          Start with the <a href="{{ '/setup/' | relative_url }}">Setup Wizard</a> if you want generated config files in minutes.
        </div>
      </div>
      <div>
        <p>
          Prefer to see the whole repo first? The README explains the overall
          pipeline, and the generated pages here show exactly what the final
          output looks like after the workflows run.
        </p>
        <div class="landing-note">
          <strong>Chinese-friendly entry</strong>
          If you are onboarding in Chinese, use the
          <a href="{{ '/setup/zh/' | relative_url }}">中文设置入口</a> first.
        </div>
      </div>
    </div>
  </section>

  <section class="landing-cta-strip">
    <div class="landing-kicker">Build your own</div>
    <h2>Your digest can look like this in one fork.</h2>
    <p>
      The same repository that generates this demo can generate your own site.
      Start with the wizard, or go straight to the repo if you already know the
      structure you want.
    </p>
    <div class="landing-actions">
      <a class="landing-button primary" href="{{ '/setup/' | relative_url }}">Start setup</a>
      <a class="landing-button secondary" href="https://github.com/YuyangXueEd/MyDailyUpdater">Open repository</a>
    </div>
  </section>
</div>
