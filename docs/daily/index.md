---
layout: default
title: Daily Digest
nav_order: 2
has_children: false
---

{% assign daily_pages = site.pages | where_exp: "p", "p.dir == '/daily/'" | sort: "name" | reverse %}

<div class="archive-shell">
  <section class="archive-hero">
    <div class="landing-kicker">Archive hub</div>
    <h1>Daily Archive</h1>
    <p>
      Browse the generated daily issues in one place instead of a plain directory list.
      Each page is a published snapshot of that day's research briefing.
    </p>
    <div class="report-link-row">
      <a class="landing-button secondary" href="{{ '/' | relative_url }}">Home</a>
      <a class="landing-button secondary" href="{{ '/weekly/' | relative_url }}">Weekly rollup</a>
      <a class="landing-button secondary" href="{{ '/monthly/' | relative_url }}">Monthly overview</a>
    </div>
  </section>

  <section class="archive-grid">
    {% for page in daily_pages %}
    {% unless page.name == "index.md" %}
    <article class="archive-card">
      <div class="archive-card-kicker">Daily issue</div>
      <h2><a href="{{ page.url | relative_url }}">{{ page.title }}</a></h2>
      <p class="archive-card-text">Open the full daily briefing with papers, stories, repos, and other enabled sections.</p>
      <div class="archive-actions">
        <a class="landing-button secondary" href="{{ page.url | relative_url }}">Open digest</a>
      </div>
    </article>
    {% endunless %}
    {% endfor %}
  </section>
</div>
