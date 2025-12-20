---
title:  "Cross-cloud data pipeline: Synchronizing AWS application data with Azure Data Lake"
thumbnail: /assets/images/projects/aws2azure-case.png
---
{% gallery "drawing" %}
{% galleryImg "/assets/images/projects/aws2azure-case.png", "Drawing", 1000 %}
{% endgallery %}

What if you have a private application running in AWS while at the same time your business intelligence platform is running in Azure? How will you ensure that you will get reliable data from AWS to Azure in a consistent and secure way? A daily dump was an easy starting point but it turned out to not scale so well.

As a data engineer at my former employer this was one of the challenges we faced for a client in the private sector. Together with an analytics partner and managed services colleague I built a cross-cloud data pipeline that synchronized data from an AWS RDS database into a Azure Data Lake storage. I was responsible for developing and implementing the pipeline in AWS glue and setting up alerting using a combination of Python, Docker and Terraform. 

{% contactMe true %}