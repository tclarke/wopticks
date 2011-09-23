/**
 * @author r_rupp01 The OpenLayers.Format.GML has to be manipulated
 */

OpenLayers.Format.GML.prototype.parseGeometry.point = function(node) {
    /**
	 * Three coordinate variations to consider: 1) <gml:pos>x y z</gml:pos> 2)
	 * <gml:coordinates>x, y, z</gml:coordinates> 3) <gml:coord><gml:X>x</gml:X><gml:Y>y</gml:Y></gml:coord>
	 */
    var nodeList, coordString;
    var coords = [];

    // look for <gml:pos>
    var nodeList = this.getElementsByTagNameNS(node, this.gmlns, "pos");
    if(nodeList.length > 0) {
        coordString = nodeList[0].firstChild.nodeValue;
        coordString = coordString.replace(this.regExes.trimSpace, "");
        coords = coordString.split(this.regExes.splitSpace);
    }

    // look for <gml:coordinates>
    if(coords.length == 0) {
        nodeList = this.getElementsByTagNameNS(node, this.gmlns,
                                               "coordinates");
        if(nodeList.length > 0) {
            coordString = nodeList[0].firstChild.nodeValue;
            coordString = coordString.replace(this.regExes.removeSpace,
                                              "");
            coords = coordString.split(",");
        }
    }

    // look for <gml:coord>
    if(coords.length == 0) {
        nodeList = this.getElementsByTagNameNS(node, this.gmlns,
                                               "coord");
        if(nodeList.length > 0) {
            var xList = this.getElementsByTagNameNS(nodeList[0],
                                                    this.gmlns, "X");
            var yList = this.getElementsByTagNameNS(nodeList[0],
                                                    this.gmlns, "Y");
            var zList = this.getElementsByTagNameNS(nodeList[0],
            										this.gmlns, "Z");
            if(zList && zList.length > 0) {
            	coords[2] = zList[0].firstChild.nodeValue;
            }
            if(xList.length > 0 && yList.length > 0) {
                coords = [xList[0].firstChild.nodeValue,
                          yList[0].firstChild.nodeValue];
            }
        }
    }
        
    // preserve third dimension
    if(coords.length == 2) {
        coords[2] = null;
    }
    
    if (this.xy) {
        return new OpenLayers.Geometry.Point(coords[0], coords[1],
                                         coords[2]);
    }
    else{
        return new OpenLayers.Geometry.Point(coords[1], coords[0],
                                         coords[2]);
    }
	
}

/*
 * Override the linestring function, so that it searches for "<coords>" in the
 * node
 */
OpenLayers.Format.GML.prototype.parseGeometry.linestring = function(node, ring) {
	/**
	 * Two coordinate variations to consider: 1) <gml:posList dimension="d">x0
	 * y0 z0 x1 y1 z1</gml:posList> 2) <gml:coordinates>x0, y0, z0 x1, y1, z1</gml:coordinates>
	 * 3) <gml:coord><gml:X>x</gml:X><gml:Y>y</gml:Y></gml:coord>
	 */
	var nodeList, coordString;
	var coords = [];
	var points = [];

	// look for <gml:posList>
	nodeList = this.getElementsByTagNameNS(node, this.gmlns, "posList");
	if (nodeList.length > 0) {
		coordString = this.getChildValue(nodeList[0]);
		coordString = coordString.replace(this.regExes.trimSpace, "");
		coords = coordString.split(this.regExes.splitSpace);
		var dim = parseInt(nodeList[0].getAttribute("dimension"));
		// ##### TODO: fix this static setting!
		if(isNaN(dim)){
			dim = 2;
		}
		// ###################################
		var j, x, y, z;
		for ( var i = 0; i < coords.length / dim; ++i) {
			j = i * dim;
			x = coords[j];
			y = coords[j + 1];
			z = (dim == 2) ? null : coords[j + 2];
			if (this.xy) {
				points.push(new OpenLayers.Geometry.Point(x, y, z));
			} else {
				points.push(new OpenLayers.Geometry.Point(y, x, z));
			}
		}
	}

	// look for <gml:coordinates>
	if (coords.length == 0) {
		nodeList = this.getElementsByTagNameNS(node, this.gmlns, "coordinates");
		if (nodeList.length > 0) {
			coordString = this.getChildValue(nodeList[0]);
			coordString = coordString.replace(this.regExes.trimSpace, "");
			coordString = coordString.replace(this.regExes.trimComma, ",");
			var pointList = coordString.split(this.regExes.splitSpace);
			for ( var i = 0; i < pointList.length; ++i) {
				coords = pointList[i].split(",");
				if (coords.length == 2) {
					coords[2] = null;
				}
				if (this.xy) {
					points.push(new OpenLayers.Geometry.Point(coords[0],
							coords[1], coords[2]));
				} else {
					points.push(new OpenLayers.Geometry.Point(coords[1],
							coords[0], coords[2]));
				}
			}
		}
	}

	// look for <gml:coord>
	if (coords.length == 0) {
		nodeList = this.getElementsByTagNameNS(node, this.gmlns, "coord");
		if (nodeList && nodeList.length > 0) {
			for ( var i = 0; i < nodeList.length; i++) {
				var xList = this.getElementsByTagNameNS(nodeList[i],
						this.gmlns, "X");
				var yList = this.getElementsByTagNameNS(nodeList[i],
						this.gmlns, "Y");
				var zList = this.getElementsByTagNameNS(nodeList[i],
						this.gmlns, "Z");
				if (xList && yList && xList.length > 0 && yList.length > 0) {
					for ( var j = 0; j < xList.length; j++) {
						if (!zList || zList.length == 0) {
							coords[2] = null;
						} else {
							coords[2] = zList[j].firstChild.nodeValue;
						}
						if (this.xy) {
							points.push(new OpenLayers.Geometry.Point(
									xList[j].firstChild.nodeValue,
									yList[j].firstChild.nodeValue, coords[2]));
						} else {
							points.push(new OpenLayers.Geometry.Point(
									yList[j].firstChild.nodeValue,
									xList[j].firstChild.nodeValue, coords[2]));
						}
					}
				}
			}
		}
	}

	var line = null;
	if (points.length != 0) {
		if (ring) {
			line = new OpenLayers.Geometry.LinearRing(points);
		} else {
			line = new OpenLayers.Geometry.LineString(points);
		}
	}
	return line;

}

/*
 * Override the parseAttributes function, so that the envelope is parsed
 * correctly
 */
OpenLayers.Format.GML.prototype.parseAttributes = function(node, ring) {
    var attributes = {};
    // assume attributes are children of the first type 1 child
    var childNode = node.firstChild;
    var children, i, child, grandchildren, grandchild, name, value;
    while(childNode) {
        if(childNode.nodeType == 1) {
            // attributes are type 1 children with one type 3 child
            children = childNode.childNodes;
            for(i=0; i<children.length; ++i) {
                child = children[i];
                if(child.nodeType == 1) {
                    grandchildren = child.childNodes;
                    if(grandchildren.length == 1) {
                        grandchild = grandchildren[0];
                        if(grandchild.nodeType == 3 ||
                           grandchild.nodeType == 4) {
                            name = (child.prefix) ?
                                    child.nodeName.split(":")[1] :
                                    child.nodeName;
                            value = grandchild.nodeValue.replace(
                                            this.regExes.trimSpace, "");
                            attributes[name] = value;
                        }
                    } else if(grandchildren.length == 2){ 				// WPS
																		// OL
																		// Client
																		// patch
																		// Raphael
																		// Rupprecht
                    	// TODO:
                    } else {
                        // If child has no childNodes (grandchildren),
                        // set an attribute with null value.
                        // e.g. <prefix:fieldname/> becomes
                        // {fieldname: null}
                        attributes[child.nodeName.split(":").pop()] = null;
                    }
                }
            }
            break;
        }
        childNode = childNode.nextSibling;
    }
    return attributes;
}

/*
 * Override the box function, so that the Bounds are correct
 */
OpenLayers.Format.GML.prototype.parseGeometry.box = function(node) {
	var nodeList = this.getElementsByTagNameNS(node, this.gmlns, "coordinates");
	var coordString;
	var coords, beginPoint = null, endPoint = null;
	
	// setting the beginPoint and endPoint
	if (nodeList.length > 0) {
		coordString = nodeList[0].firstChild.nodeValue;		//"x1,y1 x2,y2"
		coords = coordString.split(" ");					//["x1,y1"] , ["x2,y2"]
		if (coords.length == 2) {
			beginPoint = coords[0].split(",");				//["x1"],["y1"]
			endPoint = coords[1].split(",");				//["x2"],["y2"]
		}
	} else {										// OL WPS Client patch by Raphael Rupprecht
		// nodeList is empty, try this:
		try{
			var envelope = node.childNodes[0];
			var lowercorner = envelope.childNodes[0];
			var uppercorner = envelope.childNodes[1];
			
			beginPoint = lowercorner.textContent.split(" ");	//["x1"],["y1"]
			endPoint = uppercorner.textContent.split(" ");		//["x2"],["y2"]
		} catch(e){
			alert("Exception: OpenLayers.Format.GML.parseGeometry.box function " +
					"was not able to find bounds in the boundedby node.");	
		}
	}
	
	
	if (beginPoint !== null && endPoint !== null) {
		return new OpenLayers.Bounds(parseFloat(beginPoint[0]),
				parseFloat(beginPoint[1]),
				parseFloat(endPoint[0]),
				parseFloat(endPoint[1]) );
	}
}
