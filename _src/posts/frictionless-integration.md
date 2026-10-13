---
title: Integration should be frictionless for agents to build and for you to manage
date: 2026-10-12
linkedin: https://www.linkedin.com/pulse/integration-should-frictionless-agents-build-you-manage-adam-tetz-bqube/
---

Lately I have been thinking about integration in the light of AI. It goes without saying that AI would be quite limited without proper integration. All the tooling needed in agentic workflows relies on proper integration patterns under the hood. At the same time I think that integration solutions will also become limited if they can't be leveraged by AI fully. Meaning that the platform's visual designer becomes something you use to look at a workflow and not to build it. The platform itself gives you the oversight, monitoring and tools for fine-tuning but most of the building itself gets done by agents and deterministic tools around those agents.

Since our domain is a subset of software engineering it's inevitable that agentic development is coming for integration work too. And it doesn't matter what platform or technology you're using. The ones that will work frictionlessly with AI are the ones that are going to stay.

So what does this new era mean for our integration domain? I came across a [very interesting talk](https://www.youtube.com/watch?v=28C8LU7KlBU) from Integrate 2026 by Rob Hofman. In a nutshell, the integration developer becomes an architect and stays firmly in the driver's seat while the agents do the building. How? By writing down the integration conventions we know and applying agentic development standards to them. In his talk Rob shares his workflow that covers the whole stack on Azure.

Another example is [n8n's skills](https://github.com/n8n-io/skills#official-n8n-skills) that let users create workflows with their favourite harness via the MCP server. And in the Apache Camel space I came across [camel-kit](https://github.com/luigidemasi/camel-kit) that guides users along the full integration lifecycle: from designing the integration, through implementation and testing, to runtime verification.

The underlying pattern is generally the same: write down the conventions and let the agents build. I cross-referenced camel-kit and n8n's skills, and the flow they share looks a bit like this:

<img
  src="/assets/images/frictionless/agent-delivery-lifecycle-flow.png"
  alt="MRA screenshot"
  eleventy:widths="500"
  class="centerImage"
/>

1. Understand the goal - an agent interviews or grills the idea relentlessly until it's clear.
2. You confirm the goal
3. Break it down - The goal gets broken down into small verifiable pieces
4. Get ready - set up the tools and access.
5. You provide access
6. Build - one piece at a time.
7. Check - Does it do what we agreed?
8. You give the go-ahead when all checks have passed.
9. Release it
10. Hand it over - how to use and manage it.

So the AI agents only start building once the idea and goal are understood and agreed upon. Then they work towards that goal in small manageable steps. If a check fails then the cause needs to be fixed. And if the cause is that the goal itself was unclear to begin with, the flow restarts at step 1. Even though the agents do most of the work there's a human in the loop for the most important parts: deciding the goal, giving access, deciding when it goes live.

In the next post I'm going to share what happened when I let [camel-kit](https://github.com/luigidemasi/camel-kit) loose on my [integration sandbox](https://github.com/atetz/integration-sandbox).

Have you been leveraging AI to build integrations? Let me know what your experiences are!

<small>This article was written with the assistance of AI. </small>
