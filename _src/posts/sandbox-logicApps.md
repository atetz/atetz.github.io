---
title: Testing the integration sandbox with Azure Logic Apps
date: 2026-02-06
---

## Intro

[Azure Logic Apps](https://azure.microsoft.com/en-us/products/logic-apps/) has been on my list to revisit for quite some time. It's Microsoft Azure's primary solution for building integration workflows. I even felt a bit of FOMO after missing a previous opportunity to work with it professionally. So I'm glad to finally try it out with my [integration sandbox](https://data-integration.dev/posts/Integration-sandbox-intro/).

Logic Apps is part of Azure's [Integration Services](https://azure.microsoft.com/en-us/products/category/integration/), which is a suite of services that enable enterprises to integrate applications, data, and processes. In other words; if you want to build / manage / orchestrate integration workflows, data pipelines, API's, messaging or serverless functions. This is the category for you.

Being part of the Azure platform, there is a steeper learning curve than the integration tools that I wrote about previously. In return you get all the fine grain control and scalability options any bigger enterprise could desire. Having said that, I also found myself rediscovering that there is a "Microsoft way" of doing things.

For this blog post I'm going to focus on solely Logic Apps. The platform claims to "enable businesses to orchestrate workflows and multi-agent business processes at Azure scale". Just like the other tools we've seen so far, it has a visual workflow designer in the browser. It also has 1400+ out-of-the-box connectors -which is the highest we've seen so far- and it has options to build your own. If all fails, it's also possible to add custom code in Python, .NET, PowerShell, or JavaScript. And maybe my favourite new shiny object to try out: the VSCode extension for building workflows and data mappings!

As I've written in my previous posts, integration architecture still requires thinking through data flows, error handling, and business logic. The platform gives you the tools, but doesn't do the thinking for you.

Let's see how it all comes together!

## Processes walkthrough

<details name="processes_walkthrough" open>
<summary>Click to hide section.</summary>
<small>If you have read my previous posts about the sandbox, you can probably skip this section.</small>

There are two processes in the sandbox that I want to integrate:

- TMS shipment to Broker order
- Broker event to TMS event

As mentioned in the docs, the APIs are secured. We'll handle this globally for both the processes. Let's have a look at an overview of the processes that we're going to integrate:

#### Authentication

The sandbox's APIs are secured by _OAuth2 authentication_ that provides a JWT (JSON Web Token). It's possible to use a password grant and a client_credentials grant. These tokens expire every 15 minutes, so we'll need to make sure these credentials are refreshed automatically.

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

## Integrating with Logic Apps

With the groundwork done, we can start integrating. If you want to follow along, you must have an [Azure account](https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account). Newcomers can register for a 30 day trial period with $200 of credits. There are some exceptions to this however. Microsoft gives you the opportunity to test the consumption hosting option of Logic Apps for free.

This is wat I started out with but along the way I switched to standard hosting, which isn't supported in the trial. I switched because I noticed that the VSCode plugins of the consumption model weren't up to date, the built in managed identity was not supported for the keyvault component and data mappings required an expensive "Integration account" costing ~$300 per month. If you forget to check the costs (like I did) it will make a nice dent in those credits!

So if you follow everything to the T, you will have some minor costs (<10$). Just make sure to clean up your resources after your done or when you take a longer break of a couple of days.

## Resources to get going

Usually I write a quick overview but this is Microsoft Azure we're dealing with here. There is no such thing as a quick overview. Instead I'm going to share some of my favourite resources I used to get up to speed and shamelessly assume that you are familiarised with the Azure portal.

I found Steven W. Thomas from the Microsoft Azure Developers channel to provide an [excellent intro](https://youtu.be/4eCY79aJFt4?si=eExCfmF9ptKnQlHu) / refresher on Logic Apps including creating the first app and setting up VSCode. [How to build and manage Azure Logic Apps](https://www.youtube.com/watch?v=4Q2gHwYWW-M)by Luke Saunders is another great introduction that goes a bit more in depth working with the Logic Apps portal. If you like integration content, be sure to check his channel out!

Then from there I found the _How-to guides -> Develop_ section in the [official docs](https://learn.microsoft.com/en-us/azure/logic-apps/)to be very useful. In my opinion theres an art to navigating the Microsoft docs. Sometimes I find myself chasing down circular referenced links, but when I do end up to find the page I need, the information is mostly solid.

A couple specific searches led me to a [blog series](https://turbo360.com/blog/tag/tips-and-tricks) by Sandro Pereira from Turbo360 covering _Logic App best practices, tips and tricks_.

Setting up the Azure connection with VSCode did give me some headache though. For some reason I could sign my account in the plugins, even browse my Azure resources, but anything else required me to sign in again and resulted in the following error:

```We're unable to complete your request

unauthorized_client: The client does not exist or is not enabled for consumers. If you are the application developer, configure a new application through the App Registrations in the Azure Portal at https://go.microsoft.com/fwlink/?linkid=2083908.
```

Consumer in this context turned out to refer to a [personal / consumer account](https://learn.microsoft.com/en-gb/answers/questions/5690717/i-am-trying-to-open-my-ms-foundry-agent-workflow-i). Even though my domain is professional and I had created a Azure account with it, Microsoft picked it up as a personal account because I also had used that e-mail to create a Microsoft account for the free version of Microsoft Teams. I ended up creating a new _Entra ID user_ account under my subscription and used that to sign in.

### Setting up the authentication workflow

Being a bit spoiled by n8n's approach to OAuth the previous time I was hoping for something similar in Azure. I looked into the option of creating my own component that uses the OpenAPI definition but it turns out that the OpenAPI definition 3.1. of my sandbox is [not yet supported](https://learn.microsoft.com/en-us/connectors/custom-connectors/define-openapi-definition). The highest supported version is 2.0. Too bad!

A manual attempt to create the component stranded because I had to configure a callback URL. Unfortunately this meant that my new `client_credentials` flow was not supported. So I ended up choosing to build a separate Logic App that would refresh the credentials on a schedule and store the new Bearer token in an _Azure Key vault_.

Key Vault is the service to manage secrets in a secure way without saving them in the Logic App project. It does require some minor preparation. I Created a new key vault in the same resource group as my Logic Apps and created new secrets for storing the Bearer token, client secret and webhook key. This first didn't work as I expected, even though I am the admin, I still had to assign myself the "Key Vault Administrator" role to be able to create secrets.

With VSCode ready to go in a fresh workspace it's very easy to create a new workflow by opening the command box (`CMD + SHIFT + P` on Mac) and type _workflow_ and hit enter. Because I wanted to keep track of the inputs and outputs of previous events I chose a _stateful_ workflow and gave it the name _Authentication_.
<small>Stateless means in essence the inverse of this. Want to know more details between stateless and stateful? Make sure to read this [article](https://learn.microsoft.com/en-us/azure//logic-apps/single-tenant-overview-compare#stateful-stateless).</small>

The command created a new folder with a workflow.json file. Once this file is selected it's possible to run the _Open Designer_ command to open the workflow designer.

{% gallery "Auth" %}
{% galleryImg "/assets/images/logicApps-sandbox/01-auth-command-new-workflow.png", "command new workflow", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/02-auth-open-designer.png", "command open designer", 500 %}
{% endgallery %}

This is what I came up with:

1. The workflow is trigged every 10 minutes by a scheduler.
2. A _Key Vault get secret action_ gets the client_secret secret out of the Key Vault.
   1. For local development I chose to _sign in with Entra_ for the connection. Later on I built a script that allows me to change the connection to a managed system identity that I can run before delpoying to the Azurew cloud so that the implementation was not tied to my user account.
3. A _HTTP action_ named _Get token_ calls the sandbox's _/token_ url with the _client_credentials_ grant payload to request the Bearer token.
   1. I added static variables like the base url and client_id to the parameters.json so that I can reuse these in other workflows.
   2. A small lightning icon appears in the Body field of the action once it is active. This feature let's me easily add the parameters and data from the previous steps.
4. Two _scope_ actions are added. Scopes are a great way to define a dedicated branch of the process that should run after a certain condition is met.
   1. In this case the _Has failed_ scope is set to run after the _Get token_ action has failed (HTTP error code) or timed out. Enabling us to add some logic to handle this error.
   2. The _Is Successful_ scope is set to run after the _Get token_ action is successful.
5. Within the _successful scope_ I first parse the json response of the API. This enables me to access the data of the json further down stream.
6. Last I use a _HTTP action_ that calls the Key Vault API to update the Bearer token. There is no Key Vault action to update secrets form Logic Apps, but fortunately [we can use the API to do this](https://learn.microsoft.com/en-us/rest/api/keyvault/secrets/update-secret/update-secret?view=rest-keyvault-secrets-2025-07-01&tabs=HTTP#security).
   1. To get this going locally I had to create [service principal](https://learn.microsoft.com/en-us/dotnet/azure/sdk/authentication/local-development-service-principal?tabs=azure-portal%2Cvs-code%2Ccommand-line) and make it member of a group that has the _Key Vault Secrets Officer_ Role.
   2. Going to the secret in the Azure portal gives you the option to copy the _Secret Identifier_ which is the URI of the secret. To be able to acces the secret via the API you will need to add the API version. My URI looks something like:
      `{vaultBaseUrl}/secrets/{secret-name}/{secret-version}?api-version=2025-07-01`

{% gallery "AuthOverview" %}
{% galleryImg "/assets/images/logicApps-sandbox/03-auth-overview.png", "Overview ", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/04-auth-post-token.png", "post token ", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/05-auth-has-failed.png", "has failed scope ", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/06-auth-is-success.png", "is successfull scope ", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/07-auth-parse-json.png", "parse json", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/08-auth-keyvault-patch.png", "patch kv", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/09-auth-keyvault-patch-creds.png", "patch kv creds", 500 %}
{% endgallery %}

#### Testing and debugging

Testing and debugging the workflow is fairly straightforward. It's possible to add breakpoints to the the workflow.json and then press F5 or run the command _Debug: Start Debugging_. This will start the debugger. Then from there you can run the command _Azure Logic Apps: Overview_.

The overview shows the options for running the trigger and viewing the previous runs.
Running the Trigger wil make it pause on the breakpoint. I really liked this feature because it let's me watch and inspect the current variables on that point in time.

Each run can be inspected by clicking on the Identifier. Doing so will open a view similar to the designer and from there it's possible to view the inputs and outputs per action. Some actions are hidden due to security considerations.

So triggering the flow will halt the If all checkmarks are green, the run was successful!

{% gallery "AuthDebugging" %}
{% galleryImg "/assets/images/logicApps-sandbox/10-auth-debug-1.png", "Start debugger", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/11-auth-debug-set-bp.png", "Set breakpoint", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/12-auth-debug-ov.png", "Overview", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/13-auth-debug-run.png", "Run", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/14-auth-debug-fail.png", "Failed run", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/15-auth-debug-fail-det.png", "Details failed run", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/16-auth-debug-success.png", "Successful run", 500 %}
{% endgallery %}

## test image remove

{% image "/assets/images/logicApps-sandbox/16-auth-debug-success.png", "alttxt","centerImage" %}

### Building the TMS shipment to Broker order workflow

After seeding 100 new shipments in the sandbox, I created a workflow called _new tms shipment to broker order_.

{% gallery "Seed" %}
{% galleryImg "/assets/images/n8n-sandbox/01-sandbox-docs-seed.png", "sandbox seed", 500 %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-4-shipment-to-broker-overview.png", "overview TMS to broker", 500 %}
{% endgallery %}

The workflow starts with a _When clicking 'Execute workflow'_ trigger. Which means that the workflow will trigger as soon as the _Execute workflow_ button is pressed. This is an ideal way to develop and test the workflow quickly.

Next I added a _HTTP Request node_ that will get the new shipments from the API. The details of a node open a screen showing the input and output that passes through which gives a clear image of what's going on with the data. There's also a _Execute step_ button that will populate the input and output if there's cached data available. I like this idea a lot!

{% gallery "TMS2BRHttp" %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-5-shipment-to-broker-http.png", "HTTP", 500 %}
{% endgallery %}

In the above image I've set the method, URL and authentication. The authentication details were already available in the dropdown menu because I setup the OAuth credentials. I also added a query parameter _limit_ with the value of _10_ that let's me only process 10 shipments per each test. Which means I can test 10 times before seeding new shipments.

{% gallery "TMS2BRfilter" %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-6-shipment-to-broker-filter.png", "Filter", 500 %}
{% endgallery %}

After the _HTTP Request node_ I added a _Filter node_ and set a condition that checks if {% raw %} `{{ $json.id }}` {% endraw %} exists. This prevents the workflow from processing an empty list of items by checking if there is an _id_ field in the input. If the array is empty, the first item won't have an ID and stop the flow.

#### Data mapping

The next node is _Edit Fields_. This node is used to define the data mapping from the TMS to the broker payload. And this is where things start to get really interesting.

{% gallery "TMS2BREditFields" 3 %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-7-shipment-to-broker-editfields.png", "edit fields", 500 %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-8-shipment-to-broker-editfields-manmapping.png", "manual mapping", 500 %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-9-shipment-to-broker-editfields-jsmapping.png", "javascript mapping", 500 %}
{% endgallery %}

The settings of this node has two main modes:

- Manual mapping
- JSON

The **manual mapping** mode lets users define the output message structure with a drag and drop interface. Users can drag and drop complete fields from left to right and finetune them, or define fields manually and then fill them with fixed data or data from an expression. An expression can be either _[dot notation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.set/#support-dot-notation), [JMESPath](https://docs.n8n.io/code/cookbook/jmespath/) or JavaScript_. Dragging a field from the left will automatically use _dot notation_.

The **JSON** mode gives users a similar experience to a templating engine where the payload can be defined in plain text in combination with expressions.

I chose to go the JSON mode route because there is an example of the expected output available in the [mapping requirements](https://github.com/atetz/integration-sandbox/blob/main/docs/integrations/tms-to-broker.md), which meant I could paste in the json and build out the mapping by templating and testing each field immediately. The requirements also determine a rule for _un-nesting aggregated line_items to individual handlingUnits._ To get this working I wrote a JavaScript expression that returns the custom array. I shamelessly admit that I switched to a small project in VSCode to write and debug this part.

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
  - Transform TMS package types to broker packagingQualifier.

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
{
  {
    $jmespath($json.stops, "[?type=='PICKUP'].planned_date | [0]") +
      "T" +
      $jmespath(
        $json.stops,
        "[?type=='PICKUP'].planned_time_window_end | [0]",
      ) +
      "Z";
  }
}
```

{% endraw %}

- **Calculate total gross weight** - Sum the package_weight × total_packages across all line items - Using a inline JavaScript reduce
  {% raw %}

```javascript
{
  {
    Number(
      $json.line_items.reduce(
        (sum, item) => sum + item.package_weight * item.total_packages,
        0,
      ),
    ).toFixed(2);
  }
}
```

{% endraw %}
All other fields were mapped using _dot notation_.

The [end result](/assets/n8n/tms-to-broker-mapping.txt) turned out to be quite unreadable at first sight. But it works and debugging is fairly easy in the expression editor. At the same time I can imagine that when you are working in a team with multiple people, there must be some guidelines in place to make these kinds of mappings manageable. In hindsight, it might have been more readable if I had defined the mappings per field in the **manual mapping** mode.

The last node in the workflow is a _HTTP Request node_ which sends the newly transformed payload to the broker/order endpoint. Because I want the node to send a request per order I set the batching to _1 items per batch_ with an interval of _500ms_.

{% gallery "TMS2BRHTTPRequest" %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-10-shipment-to-broker-post.png", "HTTP request", 500 %}
{% endgallery %}

Et voila! After building and testing the data mapping, executing the workflow results in 10 processed shipments that are validated by the sandbox!

{% gallery "TMS2BROverview" %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-11-shipment-to-broker-result.png", "Result", 800 %}
{% endgallery %}

### Building the broker event to TMS event workflow

For processing the incoming broker events for the TMS I built the following workflow:

{% gallery "BR2TMSResult" %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-12-event-overview.png", "Result", 800 %}
{% endgallery %}

<small>My trial expired during writing this article so I ended up running the workflows with docker.</small>

The first node is a Webhook trigger named _Incoming events_. I configured it to:

- accept the _POST_ http method
- set the Authentication to the _Header Auth_ with the X-API-KEY of the Sandbox
- respond immediately with a HTTP 204.

After clicking the _Listen for test event_ button, I triggered a couple of _ORDER_CREATED_ events from the sandbox to the webhook URL.

{% gallery "BR2TMSWebhook" 2 %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-13-event-webhook.png", "Result", 500 %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-14-event-testmessage.png", "Result", 500 %}
{% endgallery %}

Next up in the workflow is a filter node that prevents empty objects from passing through (just like in the shipments flow). Up until now the json that is passed through nodes is seen as 1 single webhook object which has seperate keys for the incoming headers, params, query and body. To grab the array of events from the incoming message body I added a _Split Out_ and set it to the body field.

{% gallery "BR2TMSSplit" %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-15-event-split-out.png", "Split out", 500 %}
{% endgallery %}

Now that I have an array of events, I can start mapping the broker data to TMS data with an _Edit Fields_ node. This mapping is a lot simpler and uses the same methods as in the shipment flow. Because the TMS event endpoint needs the shipmentId in the URL, I wrapped the event in an object that has the event data and the shipmentId.

Normally I would have stored this in a variable but I could not find a simple way to do this. There is also the option to acces the input of a previous node, which meant I could have accessed the data from before the mapping. But I prefer to work with the current state of the data and therefore added it. I made the end result available [here](/assets/n8n/broker-to-tms-mapping.txt).

{% gallery "BR2TMSEditFields" %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-16-event-editfields.png", "Set event payload", 500 %}
{% endgallery %}

Finally a _HTTP node_ at the end sends the event to the TMS event API. The shipment id in the URL is set using dot notation {% raw %}`http://sandbox:8000/api/v1/tms/event/{{ $json.shipment_id }}` and the json body is defined as `{{ $json.event.toJsonString() }}`{% endraw %}.
Using `toJsonString()` ensures that the object is correctly transformed to a string. Like JavaScript's `JSON.stringify`.

{% gallery "BR2TMSPostEvent" %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-17-event-post.png", "Event post", 500 %}
{% endgallery %}

After some testing the final result executed perfectly!

{% gallery "BR2TMSResult" %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-18-event-result.png", "Result", 1000 %}
{% endgallery %}

## Easy peasy! What about Error handling?

Handling what should happen after the process has diverted from the _happy flow_ is a very important aspect of integration. The business needs to be able to trust the automation and when things fail they need to be resolved quickly. Especially when automations grow complexer and handle more and more cases. This is a whole article worthy subject by itself so I wont dive into the details here, but I do have a small example for handling only certain HTTP status codes.

Workflows can throw errors when something goes wrong in a node. Or users can add a _Stop and Error node_ to manually throw an error. The most basic error handling like a retry, stop and fail or continue can be set on the node itself.

{% gallery "EHNodeOptions" %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-19-error-node-options.png", "EH Node options", 250 %}
{% endgallery %}

It's [recommended](https://docs.n8n.io/flow-logic/error-handling/) to build a dedicated _Error handling_ workflow that can do something when an error is triggered. Like for example send a notification when a certain condition is met (without blasting too many notifications). Then from the settings of the main workflow point to that specific _Error handling_ workflow and your centralised error handling is configured. It's also good to know that _Error workflow_ executions are [not counted](https://docs.n8n.io/insights/#which-executions-do-n8n-use-to-calculate-the-values-in-the-insights-banner-and-dashboard) as a production execution in the licensing model.

In some cases we want to handle an error differently. Let say we are sending data to our TMS API. Retrying _any_ HTTP status error code will not be very efficient. If we for example get a HTTP status 422 (Unprocessable content) then a retry of the same content will just result in the same error over and over until the retry limit is reached. But a HTTP 429 (too many requests) might benefit from a delayed retry. Take a look at the example below:

{% gallery "EHResult" %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-20-error-handling-429.png", "EH Result", 1000 %}
{% endgallery %}

The TMS Shipment to broker order flow has now been extended to handle HTTP 429 status codes differently:

- The HTTP node _On Error_ setting is set to _Continue (using error output)_.
- The IF node checks _if the HTTP status is 429_ AND _the runIndex is less than 3_. The runIndex is an [internal n8n counter](https://docs.n8n.io/code/builtin/n8n-metadata/) that tracks how many times n8n has executed the current node. So this works as a retry count of 3.
- If True, the workflow goes on to a _Wait node_ followed by a _Edit Fields node_ that removes the error the data before going back to the _HTTP node_ to try again.
- If False, we aggregate the individual shipment errors into 1 message with all the relevant info. This is done by using an _Edit fields_ node to set the data and an _Aggregate node_ to collect all failed messages into 1. Last we throw the error with a _Stop and Error node_.
- The _Stop and Error node_ then sends the custom error message of to the _Error workflow._

{% gallery "EHDetails" 4 %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-21-error-handling-if.png", "EH IF", 150 %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-22-error-handling-meta.png", "EH Meta", 150 %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-23-error-handling-aggregate.png", "EH Aggregate", 150 %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-24-error-handling-stop.png", "EH stop", 150 %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-25-error-handling-remove-err-data.png", "EH remove data", 150 %}
{% galleryImg "/assets/images/n8n-sandbox/02-n8n-26-error-handling-result.png", "EH result", 150 %}
{% endgallery %}

## Wrapping up

In this post I walked you through the integration processes available in the [integration sandbox](https://github.com/atetz/integration-sandbox). Then I explained how to implement them in n8n. First I built a flow that handled getting, transforming and sending new shipments. Then a flow that handles incoming events. All while explaining why and how I use each node along the way.

If you followed along, we've covered the basics of:

- Authentication
- Scheduling / batch processing
- Receiving and sending messages via APIs/webhooks
- Data transformation and mapping
- Conditional routing
- Error handling

### What's next?

In the next weeks I'm going to test the sandbox with [Azure Logic Apps](https://azure.microsoft.com/en-us/products/logic-apps/). I also read that n8n is going to release a new version soon. So I might revisit this article in a little while!

What do you think of this kind of content? I'd love to [hear your thoughts](https://data-integration.dev/contact/), experiences, or even just a quick hello!
