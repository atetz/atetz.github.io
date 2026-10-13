# Adam's teasers

His own LinkedIn posts announcing blog articles, verbatim, newest first. Reference for voice and rhythm, read
together with [style.md](style.md). Two things differ from the current rules: these point to a link or to the
comments, and the older ones don't give the conclusion. Follow style.md where they disagree.

## 2026-09-07 · Was my AI document matching solution in n8n too rigid?

A reader reached out to me and wondered if I hadn't been a bit too rigid in my n8n document matching solution.

He built the alternative with Claude Code using my blog posts and testfiles as input to prove an LLM could handle the parts I originally scripted.

An LLM can do everything. But should I let it?

I rebuilt the idea inside n8n and looked at where an LLM earns its place. Spoiler alert! The token spend and execution time told a different story and I still think the original wasn't too rigid.

Curious why? Full article linked in the comments.

#docling #documentextraction #dataintegration #automation #ollama #localllm #n8n

## 2026-06-29 · How reliably can AI assist in document extraction? Part 3

How reliably can an LLM based system for document extraction reduce the need for human intervention when the template changes? That's the question I set out to answer in this 3-part series.

In the final part, I used n8n to orchestrate docling and a local LLM into one automated document extraction pipeline. It can self-heal simple OCR errors and cross-reference the result against a purchase order, with no cloud services involved.

The answer is yes, it reduces the need for human intervention, but it doesn't eliminate it.

Full article linked in the comments!

#docling #documentextraction #dataintegration #automation #ollama #localllm #n8n

## 2026-05-26 · How reliably can AI assist in document extraction? Part 2.

Armed with the extracted docling data from the previous part I explored how a local LLM can be used to produce structured and reliable output.

The short answer is: fairly reliable but not perfect! Along the way I learned that it's relatively simple to work with a local LLM and optimise its results. First I created a model of the desired structured output and then worked towards finding and testing the right combination of LLM model, prompt & settings.

This led to a working proof of concept in Python that sets the stage for what comes after: translating it to something usable in production!

You can read the full article here: [link]

#docling #documentextraction #integration #python #automation #ollama #LocalLLM #AI

## 2026-02-18 · Testing the integration sandbox with Azure Logic Apps

Azure Logic Apps has been on my list to revisit for quite some time. It's Microsoft Azure's primary solution for building integration workflows. I even felt a bit of FOMO after missing a previous opportunity to work with it professionally. So I'm glad I finally tried it out with my integration sandbox.

Did you know that Microsoft's Data Mapper uses XSLT to transform JSON? In this article I walk through integrating with Logic Apps and VSCode. I start with a quick recap of the processes in the sandbox first and share my favourite resources to get started.

Along the way I explain why and how I use each component and which challenges I faced. There are some nice gems here that could be very helpful for anyone looking into Logic Apps. Like working with Key Vault, Liquid templates, the Data Mapper and custom XSLT functions.

Sounds cool? Read the article here: [link]

By the way, I'm currently available for 3 day/week projects.

#integration #DataIntegration #azure #AzureLogicApps

## 2025-12-11 · Testing the integration sandbox with n8n

This week's test subject is the n8n workflow automation platform. N8n claims to be simple enough to ship in hours and sophisticated enough to scale. This made me eager to try out what it's all about and see how it works with my integration sandbox.

In this article I walk through integrating two processes with n8n. I start with a refresher of the business processes of the sandbox. Then I explain the high level basics of n8n and dive into building a workflow for getting and transforming shipments to orders and another workflow for receiving events.

Like last time, I walk through authentication, data mapping, filtering, routing and error handling. And I share some useful links and files to get you started.

Sounds cool? You can read the article here: [link]

Next up is Azure Logic Apps! Which platform would you like to see after that?

#n8n #integration #DataIntegration #ipaas
