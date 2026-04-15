---
layout: default
title: Monthly Overview
nav_order: 4
has_children: false
---

{% assign monthly_pages = site.pages | where_exp: "p", "p.dir == '/monthly/'" | sort: "name" | reverse %}

<div class="archive-shell">
  <section class="archive-hero">
    <div class="landing-kicker">Archive hub</div>
    <h1>Monthly Overview</h1>
    <p>
      Step back and inspect the broader monthly trend view generated from the daily archive.
    </p>
    <div class="report-link-row">
      <a class="landing-button secondary" href="{{ '/' | relative_url }}">Home</a>
      <a class="landing-button secondary" href="{{ '/daily/' | relative_url }}">Daily archive</a>
      <a class="landing-button secondary" href="{{ '/weekly/' | relative_url }}">Weekly rollup</a>
    </div>
  </section>

  <section class="archive-grid">
    {% for page in monthly_pages %}
    {% unless page.name == "index.md" %}
    <article class="archive-card">
      <div class="archive-card-kicker">Monthly overview</div>
      <h2><a href="{{ page.url | relative_url }}">{{ page.title }}</a></h2>
      <p class="archive-card-text">Open the broader summary with monthly paper leaders, keyword heat, and jobs.</p>
      <div class="archive-actions">
        <a class="landing-button secondary" href="{{ page.url | relative_url }}">Open overview</a>
      </div>
    </article>
    {% endunless %}
    {% endfor %}
  </section>
</div>
