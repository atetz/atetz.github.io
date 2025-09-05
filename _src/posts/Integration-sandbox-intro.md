---
title: I built a sandbox to test integration platforms
date: 2025-09-05
---
Say you're in the market for a new integration solution and you want to try a few out before committing. Nearly every platform offers demos or trials. But what then? How are you going to decide whether to fully invest (time, money, training) based on a limited trial experience that may not reflect real-world usage?

In my experience demos are polished to look good, but nothing beats hands-on experience. For trials to succeed you need something meaningful to test. Setting up proper test environments often requires at least VPN access, permissions for other environments or cloud services and IT approvals. This can be challenging and time consuming. So it's tempting to fall back on 'foo', 'bar' examples or the Pokemon API. But will this paint a clear enough picture?

### The integration sandbox 
This challenge has led me to build an [integration sandbox](https://github.com/atetz/integration-sandbox). The sandbox provides the mock endpoints to test against, so I can test integration flows immediately. My goal was to evaluate how platforms handle common integration patterns:
- Receiving and sending messages via APIs/webhooks
- Data transformation and mapping
- Conditional routing
- Batch processing
- Scheduling
- Error handling
- Authentication

By testing these features I expect to gain insight into a platform's general usability:
- Learning Curve: How quickly can someone become productive?
- Developer Experience: How pleasant is the platform for day-to-day work? Think of debugging, data mapping, error messages, documentation.
- Implementation Speed: Time from trial start to working integration.
- Security Basics: Authentication handling, endpoint security, secrets management

*Note: This leaves out performance and scalability. Any serious performance testing would require enterprise-scale infrastructure and realistic data volumes beyond this evaluation's scope.*

### Use case
To test these features in a real world (but somewhat simplified) example, I thought of a use case in _Transport and Logistics_. Specifically the integration between a __Shipper__ and a __Broker__.  

Imagine you are a Shipper with a TMS that needs to send orders to a Carrier. The Carrier requires all communication to go through their preferred Broker (visibility platform).
The integration platform sits in the middle, translating the TMS data to the Broker and vice versa.

<pre class="mermaid">
	sequenceDiagram
	participant TMS as TMS / Shipper
	participant IP as Integration platform
	participant VP as Broker / Visibility platform
	
	box transparent Sandbox
	participant TMS
	end
	box transparent Sandbox
	participant VP
	end

	TMS->>IP: New shipment
	IP->>VP: Create order
	VP->>IP: New event
	IP->>TMS: Create event
</pre>

The sandbox mocks both the TMS and Broker ends of the integration use case and has REST API endpoints to authenticate, seed, trigger, get and create either TMS shipments or Broker events. It's the job of the integrator to make both mock systems work together. Here's an example of a process flow that you can integrate:

<pre class="mermaid">
flowchart TD
A@{ shape: circle, label: "start" } --> B
B@{ shape: rect, label: "get new shipments" } --> C
subgraph for each shipment
	C@{shape: lean-r, label: "transform to order"} --> D
	D@{shape: rect, label: "post order"} --> E
	E@{shape: rect, label: "log result"}
end
E --> F@{shape: diam, label: "success?"}
		F --> |Yes| G@{shape: framed-circle, label: "End"}
		F --> |No| H@{shape: rect, label: "Handle errors"}
 
</pre>

1. Scheduler starts the process
2. Get new shipments from the /tms/shipments endpoint
3. Split shipments payload into a sequence of single shipments (for each)
	1. Perform a data mapping to the broker format
	2. Create the order with the /broker/order endpoint
	3. Log the result
4. Check the aggregated results for errors and handle if necessary.

### Technical
I designed the sandbox with simplicity in mind. It should also be easy to maintain and test for a single developer. I wanted to run it in a container and have the possibility to deploy and use it anywhere. At this stage I'm not really concerned about high performance. 

The mock APIs are built with Python and [FastAPI](https://fastapi.tiangolo.com/). I chose FastAPI because it goes hand in hand with Pydantic dataclasses and has a complete set of features like security, easy serialisation and deserialisation of json and the automatic generation of swagger docs. The TMS and Broker endpoints both use different JSON payloads that are generated using the [Faker](https://faker.readthedocs.io/en/master/) library. The generated data is saved in a SQLite database so that I can later validate the incoming transformations against a set of business rules. Users will get a corresponding HTTP response code with the result of their requests. If something fails users get detailed error messages.

### Get started
Want to try it yourself? The sandbox is available as a Docker image:
`docker run -d -p 8000:8000 atetz/integration-sandbox:latest`

Once running, you can access the API documentation at `http://localhost:8000/docs` and start building your integration flows immediately. The mapping specifications can be found in the [repo](https://github.com/atetz/integration-sandbox/tree/main/docs/integrations)!
I also have it running in AWS Lightsail with minimal effort.

### What's next?
In the next weeks I'm going to put it to the test with [Fluxygen](https://fluxygen.com/), [Azure Logic Apps](https://azure.microsoft.com/en-us/products/logic-apps/) and [n8n](https://n8n.io/).

What do you think? I'd love to [hear your thoughts](https://data-integration.dev/contact/), experiences, or even just a quick hello!