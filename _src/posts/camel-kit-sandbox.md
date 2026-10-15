---
title: Building Camel integrations with AI agents and camel-kit!
date: 2026-10-15
---
A tool that caught my eye recently is [camel-kit](https://github.com/luigidemasi/camel-kit) by [Luigi De Masi](https://github.com/luigidemasi), an Apache Camel committer. It promises to guide users along the full lifecycle of building [Apache Camel](https://camel.apache.org/) integrations: from designing the integration, through implementation and testing, to runtime verification. 

DISCLAIMER: I was very biased to try this out because of two reasons:
- I've been using and liking Camel's patterns for years, so I was curious to find out what the result would be
- The project's logo is a beacon to my inner child (Knight Rider's KITT!)

<img src="/assets/images/camel-kit-sandbox/camel-kit.gif" alt="camel-kit logo" width="629" height="525" class="centerImage" eleventy:ignore />

How does it work? In a nutshell camel-kit is a CLI tool that installs agent skills into your project. You can then use your favourite coding agent like Claude Code or IBM Bob to start building. There are two main paths to follow:
- Guided migration of existing MuleSoft/BizTalk/Fuse/Camel integrations.
- Start a new greenfield integration project.

### Setting up the experiment
For this experiment I wanted to start fresh and test how camel-kit would handle building integrations for my [integration sandbox](https://github.com/atetz/integration-sandbox) so I chose to follow the greenfield path. 

<small>A quick refresher: the integration sandbox is a REST API that lets users test two integration flows:
- Pull, transform and send outbound orders.
- Receive, transform and send inbound events.
The API endpoints validate if the user is authenticated and if the message was correctly transformed.
</small>

After [installing](https://github.com/luigidemasi/camel-kit/tree/3b796c31db85ecab524ad761f4b45f0105cfe119#install-041-camel-jbang-plugin) camel-kit 0.4.1 as a JBang plugin I fired it up in a new project directory:

`camel kit init greenfield --ai claude`

And then I started Claude Code with Opus 5.5 in the same directory and triggered the `/camel-brainstorm` skill to kick off the greenfield path. 

I asked it to build integrations for my integration sandbox project, pointed it to a locally running instance of the container and pasted in the [integration documentation](https://github.com/atetz/integration-sandbox/tree/main/docs/integrations). It immediately found the OpenAPI spec and pulled in all endpoint metadata. 

What followed was an interview of 14 questions that gathered the details of the landscape, requirements and design decisions. Think of questions like: 
- What's the business purpose of this integration?
- What problem does it solve? 
- Who benefits from the solution? 

And deeper technical questions about a specific flow like:
- After Flow 1 gets `202` from `POST /broker/order`, what clears the shipment's `new` state?

After 14 question rounds, of which 4 were sent back for clarification, I got a [design spec](https://github.com/atetz/ck-integration-sandbox/blob/main/docs/camel-kit/001-tms-shipments-broker-orders/design-spec.md) to review and approve. 

Funnily enough it also tried to browse to my repository folder outside of the project that contains the source code of the APIs. **Sorry boss!** We rarely have access to source code of the APIs we're integrating in the real world. I had to deny that request...

The design looked alright, but I noticed that Claude had put credentials directly in the config:
```
Claude: Do you approve this design?
Adam: Should credentials not be in env vars?

Claude: A fair challenge. The spec _said_ env vars in prose, but the properties block still listed `sandbox.client.id=CHANGEME` — which invites exactly the mistake of filling it in and committing it. 
```

When that was cleared and I approved the spec, it carried on breaking the design down into manageable tasks with `/camel-plan`. It then generated the code with `/camel-execute` and verified the quality with `/camel-validate`.

### The result
So what did it produce? Per flow it created: 
- a YAML file containing the Camel routes, including the error handling
- a data mapper in Groovy (which I requested)
- [Citrus](https://citrusframework.org/) integration tests

{% gallery "camelKitFlows" 4 %}
{% galleryImg "/assets/images/camel-kit-sandbox/order-flow.png", "TMS shipment to broker order flow.", 400 %}
{% galleryImg "/assets/images/camel-kit-sandbox/order-flow-err.png", "TMS shipment to broker order error handling.", 400 %}
{% galleryImg "/assets/images/camel-kit-sandbox/broker-flow.png", "Broker event to TMS event flow.", 400 %}
{% galleryImg "/assets/images/camel-kit-sandbox/broker-flow-err.png", "Broker event to TMS event error handling.", 400 %}
{% endgallery %}

Screenshots are from the [Kaoto](https://kaoto.io/) designer, which also comes as a VS Code plugin. 

I spot-checked the Groovy mappers and the Citrus test suite. They were readable and looked good to me. The Citrus tests ran as part of the process, so by the time I got the code they were already passing. I still ran the routes against the sandbox myself:

```bash
jbang camel@apache/camel run \
  tms-shipment-to-broker-order.camel.yaml \
  broker-event-to-tms-event.camel.yaml \
  ShipmentToBrokerOrderMapper.groovy RejectedShipments.groovy BrokerEventToTmsEventMapper.groovy \
  --camel-version=4.22.1 \
  --properties=application.properties
```

And I used the sandbox's seed and trigger features to check whether it worked:
- first seed 3 shipments
- after they were processed I triggered 3 events

{% gallery "terminalOutput" %}
{% galleryImg "/assets/images/camel-kit-sandbox/terminal-output.png", "Terminal output of the running routes.", 800 %}
{% endgallery %}

**Cool!** And all it took was 14 questions and 283.2k tokens and about 2-3h of my time. But most of that time was spent reading up on camel-kit, digging into the skill files and helicoptering Claude.

### Would I use it in production? 
I don't know. I think it depends on the environment and the team, but I would definitely give it a trial given the opportunity since my demo only scratched the surface. I do have some questions though: 

How are we going to handle small changes? Are we going to use the skills to regenerate part of the spec and code? Or *guide* the changes manually with some precision? 
I tried implementing a small change with the skills (renaming a variable in the application.properties) and it used around the same amount of tokens just for that (chore/update-tms-to-broker-payload branch). So I think there are some lessons to be learned on when to use it. 

Can someone other than me read and understand the specs, routes and decisions? Will we experience drift if something gets re-derived from the `design-spec.md`?

If I were an organisation looking to migrate from BizTalk or Mule I'd definitely add it to my list of options to research.

### The future
All in all I think this is a great project. The interview style appealed to me because it came up with questions like: what clears a shipment's new state? Immediately challenging the design I pasted in and addressing a hole I left. And I think it shows where our industry is heading. Does this mean that any non-technical user can develop integrations now? I don't think so. camel-kit holds your hand and asks you all the questions, but you still need to provide the answers. You also need to provide the environment where the integrations run. And that is a whole other story. 

It might even be a story that we can investigate with the help of some agents…

What do you think of this kind of content? I'd love to [hear your thoughts](https://data-integration.dev/contact/)! And if your team could use a hand with an integration project, I'm available for freelance work.
