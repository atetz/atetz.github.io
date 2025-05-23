---
title: All posts in descending order
layout: post.njk
eleventyNavigation:
  key: Posts
---

{% for post in collections.post %}

<article>
<hgroup>
  <h1>{{ post.data.title }}
<h6>{{post.date}}</h6>
</hgroup>
  <p>{{post.content}}</p>
</article>
{% endfor %}