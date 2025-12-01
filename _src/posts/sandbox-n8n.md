---
title: Testing the integration sandbox with n8n
date: 2025-11-26
---
## Intro
This weeks test subject is the [n8n](https://n8n.io/) workflow automation platform. N8n claims it's simple enough to ship in hours and sophisticated enough to scale. This made me eager to try out what it's all about and see how it works with my [integration sandbox](https://data-integration.dev/posts/Integration-sandbox-intro/).

N8n is a [fair-code](https://faircode.io/) workflow automation platform aimed to give *technical teams* the flexibility of code with the speed of no-code. Fair-code meaning that it's generally free to use, open source and restricted for other companies to commercialise. Customers can self-host or use their [cloud offering](https://app.n8n.cloud/login).

The platform lets you build automations with the help of a visual editor that provides the building blocks (called nodes) to use and develop integrations. It comes with a big collection of ready to use connections to specific cloud services. Think of services like Slack, Google sheets or Jira. And they are what they call *AI native*, making it easy to interact with AI models and agents. Developers can also [build their own nodes](https://docs.n8n.io/integrations/creating-nodes/build/declarative-style-node/) or use a code node to add custom code. They also have an active community were users can share automation [templates](https://n8n.io/workflows/). 

As I've written in my previous posts, integration architecture still requires thinking through data flows, error handling, and business logic. The platform gives you the tools, but doesn't do the thinking for you.

Under the hood n8n is built in modern TypeScript and it deploys a master and worker nodes style architecture that can be scaled if necessary.

Let's see how it all comes together in n8n!
## Processes walkthrough
<details name="processes_walkthrough" open>
<summary>Details of processes. Click to hide.</summary>
<small>If you have read my previous posts about the sandbox, you can probably skip this section. In contrast to the last posts, I have added a OAuth client_credentials grant capability.  </small>

There are two processes in the sandbox that I want to integrate:
- TMS shipment to Broker order
- Broker event to TMS event
  
As mentioned in the docs, the APIs are secured. We'll handle this globally for both the processes. Let's have a look at an overview of the processes that we're going to integrate:
#### Authentication
The sandbox's APIs are secured by *OAuth2 authentication* that provides a JWT (JSON Web Token). It's possible to use a password grant and a client_credentials grant. These tokens expire every 15 minutes, so we'll need to make sure these credentials are refreshed automatically. Luckily for me, we'll see later how this is handled automatically!
#### TMS shipment to Broker order
The TMS shipments will be pulled periodically from the TMS API and then transformed and delivered to the Broker API. 
<pre class="mermaid">
flowchart TD
A@{ shape: circle, label: "start" } --> B
B@{ shape: rect, label: "get new shipments" } --> C0
C0@{shape: diam, label: "any \nshipments?"}
		C0 --> |Yes| C
		C0 --> |No| C2@{shape: framed-circle, label: "end"}
subgraph for each shipment
	C@{shape: lean-r, label: "transform to order"} --> D
	D@{shape: rect, label: "post order"} --> E
	E@{shape: rect, label: "log result"}
end
E --> F@{shape: diam, label: "success?"}
		F --> |Yes| G@{shape: framed-circle, label: "end"}
		F --> |No| H@{shape: rect, label: "handle errors"}
 
</pre>
1. Scheduler starts the process
2. Get new shipments from the /tms/shipments endpoint
3. Check for shipments in response
4. Split shipments payload into a sequence of single shipments (for each)
	1. Perform a data mapping to the broker format
	2. Create the order with the /broker/order endpoint
	3. Log the result
5. Check the aggregated results for errors and handle if necessary.
  
#### Broker event to TMS event
The broker events are sent to a webhook which will transform and deliver them to the TMS API:
<pre class="mermaid">
flowchart TD
A@{ shape: circle, label: "start" } --> B
B@{ shape: rect, label: "check api key" } --> C
C@{shape: diam, label: "valid?"}
		C --> |Yes| D
		C --> |No| E@{shape: rect, label: "return HTTP 401"}
D@{shape: lean-r, label: "transform to tms event"} --> F
F@{shape: rect, label: "post event"} --> G
G@{shape: diam, label: "success?"}
		G --> |Yes| H@{shape: framed-circle, label: "End"}
		G --> |No| I@{shape: rect, label: "handle errors"}
</pre>
1. Inbound HTTP message starts the process
2. The incoming webhook API token is validated. `X-API-KEY` 
3. Perform a data mapping to the tms format
4. Create the event with the tms/event/shipment_id endpoint
5. Log the result
</details>

## Integrating with n8n
Now that we have laid our groundwork we can actually start integrating. If you want to follow along, you can register for a [free trial](https://app.n8n.cloud/register) or use the [docker installation](https://docs.n8n.io/hosting/installation/docker/). 
### A quick overview
During my exploration of n8n I found the [docs](https://docs.n8n.io/video-courses/) to be the best starting point to quickly get started. If you have some experience in the integration field already, I think you should manage just fine reading the core concepts and cherry-pick as you go from then.

On the homescreen users are greeted with 5 main options (depending on the version / license):

02-n8n-1-homescreen.png

1. Workflows - an overview of the workflows. Workflows are the heart of n8n it's the place where users define the collections of nodes that are necessary to automate a process;
2. Credentials - used for creating, managing, and sharing credentials;
3. Executions - a detailed log overview of all executions per workflow;
4. Variables - a place to manage global variables that can be accessed from any workflow;
5. Data tables- a place to create data tables that let you create, read, update and delete data in tabular format from any workflow.

There are also some less prominent options that take you to the admin panel, let you use templates (predefined workflows), open the help page and view insights.

**Workflows, nodes and data that is passed**
We already know that automations in n8n are defined in workflows. And that workflows are built using the canvas by defining the logic with nodes. 

Each node receives and processes data and passes the processed data on to the next node(s) in the workflow. All data 

```json
[
	{
		// For most data:
		// Wrap each item in another object, with the key 'json'
		"json": {
			// Example data
			"apple": "beets",
			"carrot": {
				"dill": 1
			}
		},
		// For binary data:
		// Wrap each item in another object, with the key 'binary'
		"binary": {
			// Example data
			"apple-picture": {
				"data": "....", // Base64 encoded binary data (required)
				"mimeType": "image/png", // Best practice to set if possible (optional)
				"fileExtension": "png", // Best practice to set if possible (optional)
				"fileName": "example.png", // Best practice to set if possible (optional)
			}
		}
	},
]
```
<small>source: https://docs.n8n.io/data/data-structure/ </small>

### Setting up authentication and defining variables



### Building the TMS shipment to Broker order flow


### Building the Broker event to TMS event flow

## Wrapping up
In this post I walked you through the integration processes available in the [integration sandbox](https://github.com/atetz/integration-sandbox). Then I explained how to implement them in Fluxygen. First I built a scheduled flow that handled getting, transforming and sending new shipments. And I explained why and how I use each component. 

At the end I showed an example of a flow that can receive events. Here I explained that most of the patterns used are similar. If you followed along, we've covered the basics of:
- Scheduling / batch processing 
- Receiving and sending messages via APIs/webhooks 
- Data transformation and mapping
- Conditional routing
- Error handling
- Authentication

### What's next? 
In the next weeks I'm going to test the sandbox with [Azure Logic Apps](https://azure.microsoft.com/en-us/products/logic-apps/). 

What do you think of this kind of content? I'd love to [hear your thoughts](https://data-integration.dev/contact/), experiences, or even just a quick hello!