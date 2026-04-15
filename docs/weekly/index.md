---
layout: default
title: Weekly Rollup
nav_order: 3
has_children: false
---

{% assign weekly_pages = site.pages | where_exp: "p", "p.dir == '/weekly/'" | sort: "name" | reverse %}

<div class="archive-shell">
  <section class="archive-hero">
    <div class="landing-kicker">Archive hub</div>
    <h1>Weekly Rollup</h1>
    <p>
      Review longer-horizon weekly summaries built from the saved daily snapshots.
    </p>
    <div class="report-link-row">
      <a class="landing-button secondary" href="{{ '/' | relative_url }}">Home</a>
      <a class="landing-button secondary" href="{{ '/daily/' | relative_url }}">Daily archive</a>
      <a class="landing-button secondary" href="{{ '/monthly/' | relative_url }}">Monthly overview</a>
    </div>
  </section>

  <section class="archive-grid">
    {% for page in weekly_pages %}
    {% unless page.name == "index.md" %}
    <article class="archive-card">
      <div class="archive-card-kicker">Weekly rollup</div>
      <h2><a href="{{ page.url | relative_url }}">{{ page.title }}</a></h2>
      <p class="archive-card-text">Read the trend analysis, highest-scoring papers, and job highlights for the week.</p>
      <div class="archive-actions">
        <a class="landing-button secondary" href="{{ page.url | relative_url }}">Open rollup</a>
      </div>
    </article>
    {% endunless %}
    {% endfor %}
  </section>
</div>
