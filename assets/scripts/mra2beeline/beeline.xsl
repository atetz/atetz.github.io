<?xml version="1.0" encoding="UTF-8"?>


<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:xs="http://www.w3.org/2001/XMLSchema"
                xmlns="http://www.topografix.com/GPX/1/1"
                xmlns:gpx="http://www.topografix.com/GPX/1/1"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" exclude-result-prefixes="#all" expand-text="yes" version="3.0">
    
    <xsl:output method="xml" indent="yes"/>
    <xsl:mode on-no-match="fail"/>
    
    <xsl:template match="/">
        
        <gpx xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd" version="1.1" creator="Data-integration.dev">
            <xsl:text>&#xa;</xsl:text>
            <xsl:comment>Beeline compatible waypoints below are converted from rtept nodes from the MyRouteApp gpx 1.1</xsl:comment>
            <xsl:text>&#xa;</xsl:text>
            
            <xsl:for-each select="/gpx:gpx/gpx:rte/gpx:rtept">
                <wpt lat="{@lat}" lon="{@lon}"/>
            </xsl:for-each>
            
            <xsl:text>&#xa;</xsl:text>
            <xsl:comment>Beeline compatible track points below are converted from the trkpt nodes from the MyRouteApp gpx 1.1</xsl:comment>
            <xsl:text>&#xa;</xsl:text>
            
            <rte>
                <xsl:for-each select="/gpx:gpx/gpx:trk/gpx:trkseg/gpx:trkpt">
                    <rtept lat="{@lat}" lon="{@lon}"/>
                </xsl:for-each>
            </rte>
            
        </gpx>
    </xsl:template>
</xsl:stylesheet>