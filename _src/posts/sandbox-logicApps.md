---
title: Testing the integration sandbox with Azure Logic Apps
date: 2026-02-06
---

## Intro

[Azure Logic Apps](https://azure.microsoft.com/en-us/products/logic-apps/) has been on my list to revisit for quite some time. It's Microsoft Azure's primary solution for building integration workflows. I even felt a bit of FOMO after missing a previous opportunity to work with it professionally. So I'm glad to finally try it out with my [integration sandbox](https://data-integration.dev/posts/Integration-sandbox-intro/).

Logic Apps is part of Azure's [Integration Services](https://azure.microsoft.com/en-us/products/category/integration/), which is a suite of services that enable enterprises to integrate applications, data, and processes. In other words: if you want to build / manage / orchestrate integration workflows, data pipelines, APIs, messaging or serverless functions. This is the category for you.

Being part of the Azure platform, there is a steeper learning curve than the integration tools that I wrote about previously. In return you get all the fine grain control and scalability options any bigger enterprise could desire. Having said that, I also found myself rediscovering that there is a "Microsoft way" of doing things.

For this blog post I'm going to focus on solely Logic Apps. The platform claims to "enable businesses to orchestrate workflows and multi-agent business processes at Azure scale". Just like the other tools we've seen so far, it has a visual workflow designer in the browser. It also has 1400+ connectors -which is the highest we've seen so far- and it has options to build your own. If all fails, it's also possible to add custom code in Python, C#, PowerShell, or JavaScript.

And maybe my favourite new shiny object to try out: the VSCode extension for building workflows and data mappings!

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

Once the processes are clear we can start integrating. If you want to follow along, you must have an [Azure account](https://azure.microsoft.com/en-us/pricing/purchase-options/azure-account). Newcomers can register for a 30 day trial period with $200 of credits.

Not all services are supported in this trial. I started out with the consumption hosting option of Logic Apps but along the way I switched to standard hosting, which isn't supported. I switched because I noticed that the VSCode plugins of the consumption model weren't up to date, the built in managed identity was not supported for the keyvault component and data mappings required an expensive "Integration account" costing ~$300 per month. If you forget to check the costs (like I did) it will make a nice dent in those credits!

So if you follow everything to the T, you will have some minor costs (<10$). Just make sure to clean up your resources after you're done.

## Resources to get going

Usually I write a quick overview but this is Microsoft Azure we're dealing with here. There is no such thing as a quick overview. Instead I'm going to share some of my favourite resources I used to get up to speed and shamelessly assume that you are familiarised with the Azure portal.

I found Steven W. Thomas from the Microsoft Azure Developers channel to provide an [excellent intro](https://youtu.be/4eCY79aJFt4?si=eExCfmF9ptKnQlHu) / refresher on Logic Apps including creating the first app and setting up VSCode. [How to build and manage Azure Logic Apps](https://www.youtube.com/watch?v=4Q2gHwYWW-M) by Luke Saunders is another great introduction that goes a bit more in depth working with the Logic Apps portal. If you like integration content, be sure to check his channel out!

Then from there I found the _How-to guides -> Develop_ section in the [official docs](https://learn.microsoft.com/en-us/azure/logic-apps/) to be very useful. In my opinion there's an art to navigating the Microsoft docs. Sometimes I find myself chasing down circular referenced links, but when I eventually find the page I need, the information is mostly solid.

A couple specific searches led me to a [blog series](https://turbo360.com/blog/tag/tips-and-tricks) by Sandro Pereira from Turbo360 covering _Logic App best practices, tips and tricks_.

Setting up the Azure connection with VSCode did give me some headache though. For some reason I could use my account with the plugins and browse my Azure resources, but anything else required me to sign in again and resulted in the following error:

```We're unable to complete your request

unauthorized_client: The client does not exist or is not enabled for consumers. If you are the application developer, configure a new application through the App Registrations in the Azure Portal at https://go.microsoft.com/fwlink/?linkid=2083908.
```

Consumer in this context turned out to refer to a [personal / consumer account](https://learn.microsoft.com/en-gb/answers/questions/5690717/i-am-trying-to-open-my-ms-foundry-agent-workflow-i). Even though I used my professional email and I had created an Azure account with it, Microsoft picked it up as a personal account because I also had used that e-mail to create a Microsoft account for the free version of Microsoft Teams. I ended up creating a new _Entra ID user_ account under my subscription and used that to sign in which resolved the issue.

### Setting up the authentication workflow

Being a bit spoiled by n8n's approach to OAuth the previous time, I was hoping for something similar in Azure. I looked into the option of creating my own component that uses the OpenAPI definition but it turns out that the OpenAPI definition 3.1. of my sandbox is [not yet supported](https://learn.microsoft.com/en-us/connectors/custom-connectors/define-openapi-definition). The highest supported version is 2.0. Too bad!

A manual attempt to create the component stranded because I had to configure a callback URL. Unfortunately this meant that my new `client_credentials` flow was not supported. So I ended up choosing to build a separate Logic App that would refresh the credentials on a schedule and store the new Bearer token in an _Azure Key vault_.

Key Vault is a service that lets users manage secrets in a secure way without saving them in the Logic App project. It does require some minor preparation. I Created a new key vault in the same resource group as my Logic Apps and created new secrets for storing the Bearer token, client secret and webhook key. This didn't work at first as I expected, even though I am the admin, I still had to assign myself the "Key Vault Administrator" role to be able to create secrets.

With VSCode ready to go in a fresh workspace it's very easy to create a new workflow by opening the command box (`CMD + SHIFT + P` on Mac) and type _workflow_ and hit enter.

{% image "/assets/images/logicApps-sandbox/01-auth-command-new-workflow.png", "command new workflow"%}

Because I wanted to keep track of the inputs and outputs of previous events I chose a _stateful_ workflow and gave it the name _Authentication_.
<small>Stateless means in essence the inverse of this. Want to know more details between stateless and stateful? Make sure to read this [article](https://learn.microsoft.com/en-us/azure//logic-apps/single-tenant-overview-compare#stateful-stateless).</small>

The command created a new folder with a workflow.json file. Once this file is selected it's possible to run the _Open Designer_ command to open the workflow designer.

{% image "/assets/images/logicApps-sandbox/02-auth-open-designer.png", "command open designer" %}

This is what I came up with:

{% image "/assets/images/logicApps-sandbox/03-auth-overview.png", "Overview" ,"450"%}

1. The workflow is trigged every 10 minutes by a scheduler.
2. A _Key Vault get secret action_ gets the client_secret secret out of the Key Vault.
   1. I chose to _sign in with Entra_ for creating the connection.
   2. Later on I built a script that allows me to change the connection to a managed system identity before deploying to the Azure cloud so that the implementation was not tied to my user account.

3. A _HTTP action_ named _Get token_ calls the sandbox's _/token_ url with the _client_credentials_ grant payload to request the Bearer token.
   1. I added static variables like the base url and client\*id to the _parameters.json_ so that I can reuse these in other workflows.
   2. A small lightning icon appears in the Body field of the action once it is active. This feature let's me easily add the parameters and data from the previous steps.
      {% image "/assets/images/logicApps-sandbox/04-auth-post-token.png", "post token","350,700" %}

4. Two _scope_ actions are added. Scopes are a great way to define a dedicated branch of the process that should run after a certain condition is met.
   1. In this case the _Has failed_ scope is set to run after the _Get token_ action has failed (HTTP error code) or timed out. Enabling us to add some logic to handle this error.
      {% image "/assets/images/logicApps-sandbox/05-auth-has-failed.png", "has failed scope", %}

   2. The _Is Successful_ scope is set to run after the _Get token_ action is successful.
      {% image "/assets/images/logicApps-sandbox/06-auth-is-success.png", "is successfull scope", %}

5. Within the _successful scope_ I first parse the json response of the API. This enables me to access the data of the json further down stream.
   {% image "/assets/images/logicApps-sandbox/07-auth-parse-json.png", "parse json", %}

6. Last I use a _HTTP action_ that calls the Key Vault API to update the Bearer token. There is no Key Vault action to update secrets form Logic Apps, but fortunately we can [use the REST API to do this](https://learn.microsoft.com/en-us/rest/api/keyvault/secrets/set-secret/set-secret?view=rest-keyvault-secrets-2025-07-01&tabs=HTTP). The _Set secret_ action will create a new version for a given secret or create a secret if it does not already exist with that name.
   1. To get this going locally I had to create [service principal](https://learn.microsoft.com/en-us/dotnet/azure/sdk/authentication/local-development-service-principal?tabs=azure-portal%2Cvs-code%2Ccommand-line) and make it a member of a group that has the _Key Vault Secrets Officer_ Role.
   2. Going to the secret in the Azure portal gives you the option to copy the _Secret Identifier_ which is the URI of the secret. To be able to acces the secret via the API you will need to remove the secret version from the URI and add the API version. The end result will look something like this: `{vaultBaseUrl}/secrets/{secret-name}?api-version=2025-07-01`

   {% image "/assets/images/logicApps-sandbox/08-auth-keyvault-put.png", "put kv" %}
   {% image "/assets/images/logicApps-sandbox/09-auth-keyvault-put-creds.png", "put kv creds", %}

#### Testing and debugging

Testing and debugging the workflow is fairly straightforward. It's possible to add breakpoints to the the workflow.json and then press F5 or run the command _Debug: Start Debugging_.

{% image "/assets/images/logicApps-sandbox/10-auth-debug-1.png", "Start debugger" %}

This will start the debugger. Then from there you can run the command _Azure Logic Apps: Overview_.

{% image "/assets/images/logicApps-sandbox/11-auth-debug-set-bp.png", "Run overview" %}

The overview shows the options for running the trigger and viewing the previous runs.

{% image "/assets/images/logicApps-sandbox/12-auth-debug-ov.png", "Overview" ,"450,900"%}
Running the Trigger will make it pause on the breakpoint.

{% image "/assets/images/logicApps-sandbox/13-auth-debug-run.png", "Run","450,900"%}

I really liked this feature because it let's me watch and inspect the current variables on that point in time. Each run can be inspected by clicking on the Identifier. Doing so will open a view similar to the designer and from there it's possible to view the inputs and outputs per action.

{% image "/assets/images/logicApps-sandbox/14-auth-debug-fail.png", "Failed run"%}

The key vault results are hidden due to security considerations.
{% image "/assets/images/logicApps-sandbox/15-auth-debug-fail-det.png", "Details failed run" %}

If all checkmarks are green, the run was successful!
{% image "/assets/images/logicApps-sandbox/16-auth-debug-success.png", "Successful run" %}

### Building the TMS shipment to Broker order workflow

After seeding 1000 new shipments in the sandbox, I created a workflow called _ShipmentsToOrders_.

{% gallery "ShipmentsToOrders" 3 %}
{% galleryImg "/assets/images/logicApps-sandbox/17-s2o-overview1.png", "s2o overview 1", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/18-s2o-overview2.png", "s2o overview 2", 500 %}
{% galleryImg "/assets/images/logicApps-sandbox/19-s2o-overview3.png", "s2o overview 3", 500 %}

{% endgallery %}

1. The workflow starts with a scheduler that triggers every hour.
2. Immediately after the trigger of the flow a new array variable _resultArray_ is initialised that will be used further down the workflow to store the response status of the individual order creation.

{% image "/assets/images/logicApps-sandbox/21-s2o-arrayvar.png", "new array variable" %}

3. A _Key Vault get secret action_ gets the bearer token out of the Key Vault.
4. A _HTTP action_ gets the new shipments from the API.
   1. For testing purposes I set the limit to 10 which allows me to process 10 shipments at a time.

{% image "/assets/images/logicApps-sandbox/22-s2o-get-shipments.png", "get shipments" %}

5. Two scopes are added to handle either successful or failed responses from the _Get new shipments action_.
6. The response body of the shipments API will be empty if there are no new shipments. A conditional _Has shipments_ action is added to prevent any empty payload from being processed further.

{% image "/assets/images/logicApps-sandbox/23-s2o-has-shipments.png", "has shipments" %}

7. Next, the shipments JSON is parsed to an object which will allow me to process each individual item in a _For each action_.

{% image "/assets/images/logicApps-sandbox/24-s2o-for-each.png", "for each shipment" %}

8. The shipment payload is transformed to the broker format using a [Liquid](https://learn.microsoft.com/en-us/azure/logic-apps/logic-apps-enterprise-integration-liquid-transform?source=recommendations&tabs=consumption) _JSON to JSON action_.
   1. Wait? No data mapper? At first I dismissed using the mapper since I read **Data Mapper XSLT** and my brain immediately thought XML transformations. So for this mapping I went ahead and wrote a liquid template. Later when tinkering with it I discovered that it also works with JSON. And in fact that it is possible to work with [JSON in XSLT](https://www.w3.org/TR/xslt-30/#json).

{% image "/assets/images/logicApps-sandbox/25-s2o-liquid-map.png", "liquid map" %}

9. The transformed payload is posted to the order API.

{% image "/assets/images/logicApps-sandbox/26-s2o-post-order.png", "Post order" %}

10. The shipmentId and HTTP status code are added to the _resultArray_ using an _Append to array variable_ action.

{% image "/assets/images/logicApps-sandbox/27-s2o-add-arrayvar.png", "add array variable" %}

11. After the loop a _Filter array_ action is used to filter out any unsuccessful status codes.

{% image "/assets/images/logicApps-sandbox/28-s2o-filter-errors.png", "filter errors" %}

12. The resulting array is then checked with a condition. If the length of the body is 0 then we have no errors, otherwise errors are captured for handling.

{% image "/assets/images/logicApps-sandbox/29-s2o-body-null.png", "body length 0" %}

Et voila! Executing the workflow results in 10 processed shipments that are validated by the sandbox!

#### Liquid data mapping

Let's dive a bit deeper into the data mapping that I brushed over earlier.
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
- **Combine date and time fields**
  - Merge planned_date with time_window_start/end to create ISO datetime strings
- **Calculate total gross weight** - Sum the package_weight × total_packages across all line items - Using a inline JavaScript reduce

All other fields were mapped using _dot notation_.

Et voila! After building and testing the data mapping, executing the workflow results in 10 processed shipments that are validated by the sandbox!

### Building the broker event to TMS event workflow

Now that auth is working, let's build the shipment to order workflow. For processing the incoming broker events for the TMS I built the following workflow:

<small>My trial expired during writing this article so I ended up running the workflows with docker.</small>

The first node is a Webhook trigger named _Incoming events_. I configured it to:

- accept the _POST_ http method
- set the Authentication to the _Header Auth_ with the X-API-KEY of the Sandbox
- respond immediately with a HTTP 204.

After clicking the _Listen for test event_ button, I triggered a couple of _ORDER_CREATED_ events from the sandbox to the webhook URL.

Next up in the workflow is a filter node that prevents empty objects from passing through (just like in the shipments flow). Up until now the json that is passed through nodes is seen as 1 single webhook object which has seperate keys for the incoming headers, params, query and body. To grab the array of events from the incoming message body I added a _Split Out_ and set it to the body field.

Now that I have an array of events, I can start mapping the broker data to TMS data with an _Edit Fields_ node. This mapping is a lot simpler and uses the same methods as in the shipment flow. Because the TMS event endpoint needs the shipmentId in the URL, I wrapped the event in an object that has the event data and the shipmentId.

Normally I would have stored this in a variable but I could not find a simple way to do this. There is also the option to acces the input of a previous node, which meant I could have accessed the data from before the mapping. But I prefer to work with the current state of the data and therefore added it. I made the end result available [here](/assets/n8n/broker-to-tms-mapping.txt).

Finally a _HTTP node_ at the end sends the event to the TMS event API. The shipment id in the URL is set using dot notation {% raw %}`http://sandbox:8000/api/v1/tms/event/{{ $json.shipment_id }}` and the json body is defined as `{{ $json.event.toJsonString() }}`{% endraw %}.
Using `toJsonString()` ensures that the object is correctly transformed to a string. Like JavaScript's `JSON.stringify`.

After some testing the final result executed perfectly!

## Easy peasy! What about Error handling?

Handling what should happen after the process has diverted from the _happy flow_ is a very important aspect of integration. The business needs to be able to trust the automation and when things fail they need to be resolved quickly. Especially when automations grow complexer and handle more and more cases. This is a whole article worthy subject by itself so I wont dive into the details here, but I do have a small example for handling only certain HTTP status codes.

Workflows can throw errors when something goes wrong in a node. Or users can add a _Stop and Error node_ to manually throw an error. The most basic error handling like a retry, stop and fail or continue can be set on the node itself.

It's [recommended](https://docs.n8n.io/flow-logic/error-handling/) to build a dedicated _Error handling_ workflow that can do something when an error is triggered. Like for example send a notification when a certain condition is met (without blasting too many notifications). Then from the settings of the main workflow point to that specific _Error handling_ workflow and your centralised error handling is configured. It's also good to know that _Error workflow_ executions are [not counted](https://docs.n8n.io/insights/#which-executions-do-n8n-use-to-calculate-the-values-in-the-insights-banner-and-dashboard) as a production execution in the licensing model.

In some cases we want to handle an error differently. Let say we are sending data to our TMS API. Retrying _any_ HTTP status error code will not be very efficient. If we for example get a HTTP status 422 (Unprocessable content) then a retry of the same content will just result in the same error over and over until the retry limit is reached. But a HTTP 429 (too many requests) might benefit from a delayed retry. Take a look at the example below:

The TMS Shipment to broker order flow has now been extended to handle HTTP 429 status codes differently:

- The HTTP node _On Error_ setting is set to _Continue (using error output)_.
- The IF node checks _if the HTTP status is 429_ AND _the runIndex is less than 3_. The runIndex is an [internal n8n counter](https://docs.n8n.io/code/builtin/n8n-metadata/) that tracks how many times n8n has executed the current node. So this works as a retry count of 3.
- If True, the workflow goes on to a _Wait node_ followed by a _Edit Fields node_ that removes the error the data before going back to the _HTTP node_ to try again.
- If False, we aggregate the individual shipment errors into 1 message with all the relevant info. This is done by using an _Edit fields_ node to set the data and an _Aggregate node_ to collect all failed messages into 1. Last we throw the error with a _Stop and Error node_.
- The _Stop and Error node_ then sends the custom error message of to the _Error workflow._

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
