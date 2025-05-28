---
title: How I used a MyRouteApp gpx with my Beeline moto II
date: 2025-05-28
---

<details name="TLDR">
  <summary>In a hurry? Click here for a TLDR</summary>
  <p>Testing out my new Beeline Moto II motorbike navigation, I ran into some compatibility issues with my routes created with the MyRouteApp. Upon inspecting both files I noticed a difference in the gpx file structure. Since a gpx is defined in XML I created small tool using JavaScript and XSLT to convert the MyRouteApp file to a Beeline compatible file. You can find the tool <a href="/utils/MyRouteApp-to-beeline" target = "_self">here</a></p>
</details>

### Intro
<img
  src="/assets/images/mra-beeline-bike.jpeg"
  alt="Triumph Bonneville T120"
  eleventy:widths="300"
  class="floatRight"
/>One of my favourite ways to enjoy the French outdoors is by riding my motorbike.
I make it a sport to create a twisty route with nice elevations and new viewpoints that preferably pass a couple of picnic spots along the way. My preferred method was creating a route in [MyRouteApp](https://www.MyRouteApp.com/en) and using my QuadLock mounted phone for navigation. And this worked quite well. 

But, I wanted a more minimalistic device in my cockpit and I liked the idea of having my phone in my pocket instead of on my bike in case of an emergency. 
So after some *"very deep research"* on YouTube and Google, I naturally found (or was influenced towards...) the Beeline Moto II. 

Fast forward to unboxing and using the Beeline. I was __super hyped__. I exported my gpx file from MyRouteApp and hit the road. And all went surprisingly well. 


### Problem
<img
  src="/assets/images/mra-beeline-device.jpeg"
  alt="Beeline device without navigation"
  eleventy:widths="200"
  class="floatLeft"
/>Until.... I hit into a familiar yellow French sign named déviation (a diversion)! As soon as I got off the track, my Beeline showed a white arrow further diving into a black abyss. No roads were visible, no directions, only a white arrow and a dotted line showing how far I was off the track. 

*What on earth?* Why is my newest piece of navigation technology not navigating? So I stopped, grabbed my phone and opened the Beeline app. Skipping a waypoint wasn't an option because I only had 1 waypoint. Hmm... I opened my maps app and after memorizing some villages I got back on track and my turn by turn navigation was restored. Sweet!

On my way home my inner problem solver was already working. *Did I export my file wrong? Did I forget to check a box on importing?*

Soon I learned that other users had similar issues combining MyRouteApp and Beeline, and that their forum topics hit a dead end. They noted that their route seemed to be converted to a track, and only had a start- and end-point. I also learned that it was impossible to import a Beeline gpx in the MyRouteApp. I tried a couple of things on the MyRouteApp end without success. Then on the Beeline support page I found an [article](https://support.beeline.co/en/articles/10570038-importing-and-exporting-gpx-routes) on importing and exporting a gpx with this note:

<blockquote>Please note: you can only edit GPX-imported routes within the Beeline app if you are using the "Waypoints only" import mode. You can learn more about that mode in the article listed above.
  <footer>
    <cite>— Beeline support</cite>
  </footer>
</blockquote>

__Waypoints only import mode? I didn't see that option at all!__ But surely my gpx had waypoints? During the creation of my route I added 30 or so...

You might be thinking: _Why aren't you using the Beeline app anyway?_ While the Beeline app comes with a route creation functionality, I find the feature set of MyRouteApp superior. I want to skip dirt roads, maximize twisty roads, maximize elevation, toggle different points of interest along the way like petrol stations etc.

Carrying on with my problem, I created a small test route in the Beeline app and exported a gpx file. Since the gpx file is actually a xml file, I shouldn't have any trouble figuring out what the differences are.

This is a snippet of the Beeline gpx export without the xml declaration and namespaces:
```
.....
<!-- The route waypoints -->
  <wpt lat="47.765573749816014" lon="4.5727777081385605"/>
  <wpt lat="47.76747611439015" lon="4.570651287011771"/>
  <wpt lat="47.84947693295322" lon="4.568749244689883"/>
  .....
  <!-- The route -->
  <rte>
    <rtept lat="47.76591" lon="4.57288"/>
    <rtept lat="47.76595" lon="4.5726"/>
    <rtept lat="47.76597" lon="4.57253"/>
    <rtept lat="47.766" lon="4.57248"/>
    <rtept lat="47.76614" lon="4.57222"/>
    .....
```

Alright, now let's have a look at the MyRouteApp gpx that I'm importing:

```
.....
<rte>
        <name>test</name>
        <rtept lat="47.767945375567" lon="4.5705699920654">
            <name>12 Route de la Jonction, 21400 Nod-sur-Seine, Frankrijk</name>
            <extensions>
                <trp:ViaPoint />
            </extensions>
        </rtept>
        ......
    </rte>
    <trk>
        <name>Track-test</name>
        <trkseg>
            <trkpt lon="4.570600" lat="47.767940" />
            <trkpt lon="4.570710" lat="47.768370" />
            <trkpt lon="4.570720" lat="47.768510" />
            <trkpt lon="4.570710" lat="47.768550" />
            <trkpt lon="4.570710" lat="47.768600" />
.....
```

A few things are going on here:
- The Beeline gpx has waypoint `<wpt>` nodes while the MyRouteApp has not.
- The MyRouteApp gpx provides more information in the route segment `<rte>`.
- The MyRouteApp gpx has a track segment `<trk>`.
- The Beeline gpx `<rte>` segment suspiciously looks a lot like the MyRouteApp `<trkseg>` because the coordinates are very close to each-other.

Both seem to have a different interpretation of the [GPX 1.1 Schema Documentation](http://www.topografix.com/GPX/1/1/#type_wptType). Looking at the definitions I note 3 things:
- `wptType` wpt represents a waypoint, point of interest, or named feature on a map.
- `rteType` rte represents route - an ordered list of waypoints representing a series of turn points leading to a destination.  
- `trkType` trk represents a track - an ordered list of points describing a path.  

Given the definitions and examples above. I find that the Beeline app should be using the `rteType` instead of individual waypoints for a route. Because that is what it's designed for. Also, the `trkType` is meant for tracks and it seems Beeline is using `rteType` for that. 

As a good user, I obviously raised a ticket with Beeline, providing as much details as possible. I was then gracefully thanked for my suggestions and informed that my feedback was forwarded up the chain. Great! But knowing that technical feedback like this often gets dismissed as subjective interpretation rather than standards compliance, I knew I had to work on a solution in the meantime.
### Solution
Knowing the differences between the formats, the workaround was relatively straightforward: I _only_ had to transform the MyRouteApp gpx to a Beeline gpx. To make my MyRouteApp gpx compatible with the Beeline app I decided to:
- transform the MyRouteApp  `<rtept>` nodes to `<wpt>` nodes. 
- transform the MyRouteApp `<trkseg>` to a `<rte>`.

My first test file was hacked together using some good old copy, paste search and replaces. 

__Et voila!__ Upon importing my newly created gpx I was greeted by another option: _"Points de cheminement uniquem..."_.
Which translates to the "Waypoints only import mode" mentioned by Beeline above. 
<img
  src="/assets/images/mra-beeline-screenshot.jpeg"
  alt="Phone screenshot"
  eleventy:widths="250"
  class="centerImage"
/>
<small>P.S. Pardon my French, I set my phone to French as a part of my language learning process. </small>

### Sound great? There's just one caveat
This methods imports the waypoints added in the MyRouteApp but _will re-calculate_ the route in between them. If you want the Beeline to calculate the same or near similar route, I advise you to take an extra 15 min to add waypoints on every main road change. My approach looked like this:

<img
  src="/assets/images/mra-beeline-mra-screenshot.png"
  alt="MRA screenshot"
  eleventy:widths="600"
  class="centerImage"
/>

### Automated solution
Obviously I wasn't planning on manually editing gpx files every time I wanted to use one of my routes. 
So I decided to make a tool that will transform the file for me. And since there are other users with the same issue, I thought it would be nice to share my solution and make it available to anyone that can benefit from it. The solution is simple:
- A small webform takes a gpx file as input and let's the user download the transformed result.
- The transformation is done by a script written in JavaScript that executes a XSLT (eXtensible Stylesheet Language Transformations). For those unfamiliar but curious: Check out this [Introduction](https://www.w3schools.com/xml/xsl_intro.asp) on XSLT.
- This all runs within the users browser. Which means I only have to host the static files and don't need worry about running a service.

You can find the result [here](https://data-integration.dev/utils/MyRouteApp-to-beeline)

### Thats it!
My short road side frustration turned into a deep dive into gpx files and how to integrate the MyRouteApp format with my Beeline. While I hope that Beeline will eventually improve their compatibility, in the meantime my tool will provide a practical solution. If you're facing similar issues, give the tool a try and let me know how it works for your routes. *Happy riding!*