---
title: Testing the integration sandbox with n8n
date: 2025-11-26
---
## Intro
This week's test subject is the [n8n](https://n8n.io/) workflow automation platform. N8n claims to be simple enough to ship in hours and sophisticated enough to scale. This made me eager to try out what it's all about and see how it works with my [integration sandbox](https://data-integration.dev/posts/Integration-sandbox-intro/).

N8n is a [fair-code](https://faircode.io/) workflow automation platform aimed to give *technical teams* the flexibility of code with the speed of no-code. Fair-code meaning it's generally free to use and open source, but restricted to prevent other companies from commercializing it. Customers can self-host or use their [cloud offering](https://app.n8n.cloud/login).

The platform lets you build automations with the help of a visual editor that provides the building blocks (called nodes) to use and develop integrations. It comes with a big collection of ready to use connections to specific cloud services. Think of services like Slack, Google sheets or Jira. They market themselves as AI native, which in practice means that they have pre-built nodes to interact with popular AI models like Anthropic and OpenAI. I haven't tested these features since they are out of scope of my sandbox test. Developers can also [build their own nodes](https://docs.n8n.io/integrations/creating-nodes/build/declarative-style-node/) or use a code node to add custom code. They also have an active community where users can share automation [templates](https://n8n.io/workflows/). 

As I've written in my previous posts, integration architecture still requires thinking through data flows, error handling, and business logic. The platform gives you the tools, but doesn't do the thinking for you.

Under the hood n8n is built in TypeScript and it deploys a master and worker nodes style architecture that can be scaled if necessary.

Let's see how it all comes together in n8n!
## Processes walkthrough
<details name="processes_walkthrough" open>
<summary>Click to hide section.</summary>
<small>If you have read my previous posts about the sandbox, you can probably skip this section. In contrast to the last posts, I have added a OAuth client_credentials grant capability.  </small>

There are two processes in the sandbox that I want to integrate:
- TMS shipment to Broker order
- Broker event to TMS event
  
As mentioned in the docs, the APIs are secured. We'll handle this globally for both the processes. Let's have a look at an overview of the processes that we're going to integrate:
#### Authentication
The sandbox's APIs are secured by *OAuth2 authentication* that provides a JWT (JSON Web Token). It's possible to use a password grant and a client_credentials grant. These tokens expire every 15 minutes, so we'll need to make sure these credentials are refreshed automatically. We'll see later how this is handled automatically.

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
Now that we have laid our groundwork we can actually start integrating. If you want to follow along, you can register for a [free trial](https://app.n8n.cloud/register) or use the [docker installation](https://docs.n8n.io/hosting/installation/docker/). For readers going the docker route I have an example docker-compose file that will spin up n8n and the sandbox:

<details name="processes_walkthrough" closed>
<summary>Click to view docker-compose.yaml.</summary>

```yaml
services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    ports:
      - 5678:5678
    networks:
    - n8n
    volumes:
      - n8n_data:/home/node/.n8n
    environment:
      # Adjust to your timezone
      - GENERIC_TIMEZONE=Europe/Paris
      - TZ=Europe/Paris
      - N8N_ENFORCE_SETTINGS_FILE_PERMISSIONS=true
      - N8N_RUNNERS_ENABLED=true
  sandbox:
    image: atetz/integration-sandbox:v1.0.5
    ports:
      - 8000:8000
    networks:
      - n8n
    env_file:
     # check the github repo for the .env options
      - .env

volumes:
  n8n_data:

networks:
   # Creates a shared network named n8n. This way the n8n and sandbox containers can communicate with each other
  n8n: {}
```
</details>

### A quick overview
During my exploration of n8n I found the official [docs](https://docs.n8n.io/video-courses/) to be the best starting point to quickly get started. If you have some experience in the integration field already, I think you should manage just fine reading the core concepts and cherry-pick content as you go from there on.

On the homescreen users are greeted with 5 main options (depending on the version / license):

02-n8n-1-homescreen.png

1. Workflows - an overview of the workflows. Workflows are the heart of n8n it's the place where users orchestrate the nodes that are necessary to automate a process;
2. Credentials - used for creating, managing, and sharing credentials;
3. Executions - a detailed log overview of all executions per workflow;
4. Variables - a place to manage global variables that can be accessed from any workflow;
5. Data tables- a place to create data tables that let you create, read, update and delete data in tabular format from any workflow.

There are also some less visually prominent options that take you to the admin panel, let you use templates (predefined workflows), open the help page or let you view insights.

**Data structure and flow**
Each node receives and processes data in json format. N8n uses the following example in their docs:

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
The output of the first node is the input of the second node and so on. Except of course the first node, also known as a trigger node. This node only produces an output based on the trigger settings like a scheduler or webhook. 
### Setting up authentication and working with OAuth challenges
At the start of my test I quickly found out that my sandbox's OAuth *password grant* is not supported. There were only options for Authorization Code, Client Credentials or PKCE. 

Since I implemented the basic OAuth 2 from the FastAPI documentation I wondered why. After doing some digging in the community resources I found the answer on discord: *"The password grant type is legacy and not part of OAuth 2.1 which is what we support"*.

Ah too bad! But how hard can it be to implement this myself? I have done it before!
The easiest way to implement this is by refreshing the JWT on a schedule. Which means that I only need a place to *store and update* my JWT. Also I thought, going this route introduced two more challenges:
- The pro trial I signed up for is limited to 1000 executions. If I want to refresh my JWT on a 10-15 min schedule then I would use up ~100-150 executions a day for just refreshing my credentials!
- I didn't really find an out of the box option to update a variable that is accessible from another flow. 

The pro variable feature only let's users update the variable data from outside the workflow. I had to either use a community node, data tables, database or some other external source like a key value store. Another option I found was that I could build a *sub* workflow that checks and refreshes the token with the help of the [workflowStaticData](https://docs.n8n.io/code/cookbook/builtin/get-workflow-static-data/) feature. I could then use this sub flow every time before a post to my sandbox. 

[01-sandbox-docs-1.png]

None of those options sounded appealing to me so I decided to upgrade my sandbox and make it compatible with the OAuth 2.1 client credentials grant. Which boiled down to adding alias field names for *username* and *password*. Namely *client_id* and *client_secret*. And adding support for getting the token with *Basic Authentication* in addition to the *x-www-form-urlencoded*. This is by no means a great implementation of OAuth, but for testing purposes it gets the job done and lets us use the builtin functionality. 

With the new functionality in the sandbox, setting up the authentication was very easy. I created an *OAuth2 API* credential and filled in the form:
[02-n8n-2-credential-token.png]

I also added the X-API-KEY as a *Header Auth* credential that is used to secure the incoming connections:
[02-n8n-3-credential-api-key.png]
### Building the TMS shipment to Broker order flow
After seeding 100 new shipments in the sandbox, I created a workflow called *new tms shipment to broker order*. 

[01-sandbox-docs-seed.png,02-n8n-shipment-to-broker-overview.png]

The workflow starts with a *When clicking 'Execute workflow'* trigger. Which means that the workflow will trigger as soon as the *Execute workflow* button is pressed. This is an ideal way to develop and test the workflow quickly. 

[02-n8n-5-shipment-to-broker-http.png]

Next I added a *HTTP Request node* that will get the new shipments from the API. The settings of a node open a screen showing the input and output that passes through. Giving a clear image of what's going on with the data. There's also a *Execute step* button that will populate the input and output if there's cached data available. I like this idea a lot!

In the above image I've set the method, URL and authentication. Because I setup the OAuth credentials, the authentication details were already available in the dropdown menu. I also added a query parameter *limit* with the value of *10* that let's me only process 10 shipments per each test. 

[02-n8n-6-shipment-to-broker-filter.png]

After the *HTTP Request node* I added a *Filter node* and set a condition that checks if {% raw %} `{{ $json.id }}` {% endraw %} exists. Meaning that if there is no *id* field in the input then the flows does not continue.

**Data mapping**

The next node is *Edit Fields*. This node is used to define the data mapping from the TMS to the broker payload. And this is where things start to get really interesting. 

[02-n8n-7-shipment-to-broker-editfields.png, 02-n8n-8-shipment-to-broker-editfields-manmapping.png, 02-n8n-9-shipment-to-broker-editfields-jsmapping.png]
The settings of this node has two main modes: 
- Manual mapping
- JSON

The **manual mapping** mode lets users build up the output message structure with a drag and drop interface. Users can define fields manually in the center and then fill them with fixed data or data from an expression. An expression can be either *[dot notation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.set/#support-dot-notation), [JMESPath](https://docs.n8n.io/code/cookbook/jmespath/) or JavaScript*. Dragging a field from the left will automatically use *dot notation*.

The **JSON** mode gives users a similar experience to a templating engine where the payload can be defined in plain text in combination with expressions.

I chose to go the JSON mode route because there is an example of the expected output available in the [mapping requirements](https://github.com/atetz/integration-sandbox/blob/main/docs/integrations/tms-to-broker.md), which meant I could paste in the json and build out the mapping by templating and testing each field immediately. The requirements also determine a rule for un-nesting aggregated line_items to individual handlingUnits. To get this working I wrote a JavaScript expression that returns the custom array. I shamelessly admit that I switched to a small project in VSCode to write and debug this part.

The end result of the data mapping does the following: 
- **Generate message metadata**
	- Set messageDate to current timestamp with {% raw %} ` "messageDate":"{{DateTime.now().toISO() }}",` {% endraw %}
	- Set custom messageReference with {% raw %} `  "messageReference":"{{DateTime.now().toMillis()}}-{{ $json.id }}"` {% endraw %}
	- Add fixed senderId and messageFunction.
- **Stops to separate pickUp and consignee objects**
	- Split the stops array into separate pickUp and consignee objects based on the type field (PICKUP vs DELIVERY). 
	- This is done using a JMESpath filter `$json.stops,"[?type=='DELIVERY']`
	- For example: {% raw %} `"address1":"{{ $jmespath($json.stops,"[?type=='DELIVERY'].location.address.address | [0]") }}"` {% endraw %}
- **Concatenate goods descriptions**
	- Join all line_item descriptions with a pipe separator into a single goodsDescription field.
	{% raw %} `{{ $jmespath($json.line_items,"join('|',[*].description)") }}` {% endraw %}
- **Un-nest line items to handling units**
	- Each line_item gets replicated by its total_packages count. So 3 line items with 4, 1, and 3 packages become 8 individual handlingUnits.
	- Transform TMS  package types to broker packagingQualifier.

```javascript
(() => {
 const packageMapping = {
  "BALE":"BL",
  "BOX":"BX",
  "COIL":"CL",
  "CYLINDER":"CY",
  "DRUM":"DR",
  "OTHER":"OT",
  "PLT":"PL",
  "CRATE":"CR"
 }

 const result = [];
 for (const item of $json.line_items) {
   for (let i = 0; i < item.total_packages; i++) {
     result.push({
       grossWeight: item.package_weight,
       height: item.height,
       length: item.length,
       width: item.width,
       packagingQualifier: packageMapping[item.package_type]
     }); 
```

- **Combine date and time fields**
	- Merge planned_date with time_window_start/end to create ISO datetime strings


{% raw %} 
```javascript
{{ 
	$jmespath($json.stops,"[?type=='PICKUP'].planned_date | [0]") + "T" +
	$jmespath($json.stops,"[?type=='PICKUP'].planned_time_window_end | [0]") + "Z"
}}
```
{% endraw %}

- **Calculate total gross weight**
	- Sum the package_weight × total_packages across all line items
	- Using a inline JavaScript reduce 
{% raw %} 
```javascript
{{ 
Number(
  $json.line_items.reduce(
    (sum, item) => sum + item.package_weight * item.total_packages,
    0
  )
).toFixed(2);
}}
```
{% endraw %}
All other fields were mapped using *dot notation*.

The [end result](/assets/n8n/tms-to-broker-mapping.txt) turned out to be quite unreadable at first sight. But, it works and debugging is fairly easy in the expression editor. At the same time I can imagine that when you are working in a team with multiple people, there must be some guidelines in place to make these kinds of mappings manageable. In hindsight, it might have been more readable from the UI if I had defined the mappings per field in the **manual mapping** mode.

The last node in the workflow is a *HTTP Request node* which sends the newly transformed payload to the broker/order endpoint. 
[02-n8n-10-shipment-to-broker-editfields-post.png]

Because I want the node to send a request per order I set the batching to *1 items per batch* with an interval of *500ms*.
### Building the Broker event to TMS event flow


{% raw %}
Data mapping notes
- javascript needed to create/duplicate handlingunits items per quantity
	- IIFE (Immediately Invoked Function Expression).
	- Used a small project in vscode to write and debug my function.
- Used $jmespath to get values with a filter. it returns an array `{{ $jmespath($json.stops,"[?type=='PICKUP'].location.address.country | [0]") }}`
- Used reduce javascript for sum of grossweight
{% endraw %}

Event:
- Split out needed before the Edit fields node. 
- If you want the output to be an array, you should not use the Set node in "raw" mode with "JSON Output", because this mode only accepts a JSON object, not an array. This is a limitation of the Set node in raw mode.

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