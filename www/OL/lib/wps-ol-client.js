/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/
/**
 * Class: WOC
 *     Main class of the WPS Client for OpenLayers.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
var WOC = {};
/**
 * Constant: WOC.OWS_NAMESPACE
 * {String} Namespace for the OWS.
 */
WOC.OWS_NAMESPACE = "http://www.opengis.net/ows/1.1";
/**
 * Constant: WOC.OWS_PREFIX
 * {String} Namespace prefix for the OWS.
 * 
 * Note:
 *     This prefix is used if the browser can not use the namespace!
 */
WOC.OWS_PREFIX = "ows";
/**
 * Constant: WOC.WPS_NAMESPACE
 * {String} Namespace for the WPS.
 */
WOC.WPS_NAMESPACE = "http://www.opengis.net/wps/1.0.0";
/**
 * Constant: WOC.WPS_PREFIX
 * {String} Namespace prefix for the WPS.
 *
 * Note:
 *     This prefix is used if the browser can not use the namespace!
 */
WOC.WPS_PREFIX = "wps";
/**
 * Constant: WOC.OGC_NAMESPACE
 * {String} Namespace for the OGC.
 */
WOC.OGC_NAMESPACE = "http://www.opengis.net/ogc";

/**
 * Constant: WOC.SOAP_ENVELOPE_NAMESPACE
 * {String} Namespace for the SOAP Envelope.
 */
WOC.SOAP_ENVELOPE_NAMESPACE = "http://www.w3.org/2003/05/soap-envelope";

/**
 * Constant: WOC.SOAP_ENVELOPE_PREFIX
 * {String} Namespace prefix for the SOAP Envelope.
 *
 * Note:
 *     This prefix is used if the browser can not use the namespace!
 */
WOC.SOAP_ENVELOPE_PREFIX = "soap";

/** 
 * Function: WOC.getElementsByTagNameNS
 *     Returns the elements of the tag based on the name and namespace.
 *
 * Parameters:
 * parentnode - {DOMElement} Node from where the tags are searched.
 * nsUri - {String} URI of the namespace. This is used if the 
 *     getElementsByTagNameNS() method is available.
 * nsPrefix - {String} Prefix used for the namespace. This is used if the 
 *     getElementsByTagNameNS() method is unavailable.
 * tagName - {string} Name of those tags which are searched.
 * 
 * Returns:
 * {Array} DomElements found with the given parameters.
 */
WOC.getElementsByTagNameNS = function(parentNode, nsUri, 
                                      nsPrefix, tagName) {
        var elems = null;
        if(parentNode.getElementsByTagNameNS) {
                elems = parentNode.getElementsByTagNameNS(nsUri, tagName);
        } else {
                elems = parentNode.getElementsByTagName(nsPrefix + ':' + tagName);
        }
        // If the element is still null lets try without a namespace ;)
        if((!elems || elems.length < 1) && parentNode.getElementsByTagName) {
                elems = parentNode.getElementsByTagName(tagName);
        }
        return elems;
};

/*
WOC.hasAttributeNS = function(node, namespace, nsprefix, localName) {
        var has = false;
        if(node.hasAttributeNS) {
                has = node.hasAttributeNS(namespace, localName);
        } else {
                has = node.hasAttribute(nsprefix + ':' + localName);
        }
        // If the element has no attribute lets try without a namespace ;)
        if(!has) {
                has = node.hasAttribute(localName);
        }
        return has;
}

WOC.getAttributeNS = function(node, namespace, nsprefix, localName) {
        var attr = null;
        if(node.getAttributeNS) {
                attr = node.getAttributeNS(namespace, localName);
        } else {
                attr = node.getAttribute(nsprefix + ':' + localName);
        }
        // If the element has no attribute lets try without a namespace ;)
        if(!attr) {
                attr = node.getAttribute(localName);
        }
        return attr;
}
*/

/**
 * Function: WOC.checkboxChecker
 *     Checks a checkbox after an image corresponding to the checkbox has been 
 *     clicked.
 *
 * Parameters:
 * event - {Event} The event that is launched by the click.
 */
WOC.checkboxChecker = function(event) {
        if(event != null) {
                var img = event.target;
                var str = img.id + "";
                var checkbox = document.getElementById(str.substring(6));
                checkbox.checked = !checkbox.checked;
                // Change the class of this label
                if(checkbox.checked) {
                        img.src = "img/tick_box.png";
                        img.alt = "Checked";
                } else {
                        img.src = "img/cross_box.png";
                        img.alt = "Unchecked";
                }
        }
}

/**
 * Function: WOC.textFieldClearing
 *     Clears a textfield after it has been clicked on.
 *
 *
 * Parameters:
 * event - {Event} The event that is launched by the click.
 */
WOC.textFieldClearing = function(event) {
        if (event && event.target) {
                event.target.focus();
                event.target.value = "";
                //event.target.text = "";
                OpenLayers.Event.stop(event);
        }
}

/**
 * Function: WOC.ignoreEvent
 *     Ignores the occuring event and stops it.
 *
 * Parameters:
 * event - {Event} The event that has occured.
 */
WOC.ignoreEvent = function(event) {
        if (event) {
                OpenLayers.Event.stop(event);
        }
}

/**
* Function: WOC.getDomDocumentFromResponse
*     Gets a DOMDocument from the response
*
* Parameters:
* response - {XMLHttpRequest} 
*
* Returns:
* {DomDocument} If the response is not an ExceptionReport, else null.
*
* Throws: 
* {NoResponseEx} If the response object does not include
* neither a successful response or an exception report.
*/
WOC.getDomDocumentFromResponse = function(response) {
        var xmlDoc = null;
        // alert("Response: " + response.responseText);
        if(response.responseText.indexOf('no results') == -1 &&
                        response.readyState==4) {
                if(response.status >= 400) {
                        // Client exceptions are in the range 400 - 499 and
                        // server side exceptions in the range 500 - 599
                        // TODO Response status is an error! UNIMPLEMENTED!

                        alert("Request failed! \nPerhaps you tried to request a server which is not in the allowed hosts list of your proxy. \nResponse status: "+response.status); // Response's status is an error! UNIMPLEMENTED!
                        
                        return null;
                } else if(response.responseXML != null) {
                        xmlDoc = response.responseXML;
                } else if(response.responseText != null && response.responseText != "") {
                        xmlDoc = Sarissa.getDomDocument();
                        xmlDoc.async = false;
                        // Before parsing we need to remove the empty spaces between 
                        // elements.
                        xmlDoc = (new DOMParser()).parseFromString(
                                        response.responseText.replace(/>\s+</g, "><"), 
                                        "text/xml");
                } else {
                        throw 'NoResponseEx';
                }
        } else {
                throw 'NoResponseEx';
        }
        return xmlDoc;
}

/**
* Method:WOC.xml2Str
*     Interprets a DOMElement into single string.
* 
* Parameters: 
* xmlNode - {DOMElement}
* 
* Throws:
* {XmlSerializerNotSupported}
*/
WOC.xml2Str = function(xmlNode) {
        try {
                // Gecko-based browsers: Safari, Opera.
                return (new XMLSerializer()).serializeToString(xmlNode);
        }catch(e) {
                try {
                        // Internet Explorer.
                        return xmlNode.xml;
                }catch (e) {
                        throw 'XmlSerializerNotSupported';
                }
        }
}

WOC.openTestHtml = function(requestXML,serviceName){
    var width  = 820;
    var height = 600;
    var left = (screen.width  - width)/2;
    var top = (screen.height - height)/2;
    var params = 'width='+width+', height='+height;
    params += ', top='+top+', left='+left;
    params += ', directories=no';
    params += ', location=no';
    params += ', menubar=no';
    params += ', resizable=yes';
    params += ', scrollbars=yes';
    params += ', status=yes';
    params += ', toolbar=yes';
    var newwin = window.open('', "_blank", params);
	
    var d = newwin.document;
		d.open("text/html","replace");
	
		newwin.document.write("<html><head>" +
	            "<title>WPS Tester</title>" +
				"<script src='http://ajax.googleapis.com/ajax/libs/jquery/1.4.2/jquery.min.js'></script>" +
	            "<script type='text/javascript'>"+
					"$(function(){"+
						"$('#replacerLink').click(function(e){"+					// when the Encode button is clicked (for URLs)
							"var textarea = document.getElementById('request');"+
							"var len = textarea.value.length;"+
							"var start = textarea.selectionStart;"+
							"var end = textarea.selectionEnd;"+
							"var sel = textarea.value.substring(start, end);"+
							"var replace = sel.replace(/\&/g,'&amp;');"+
							"textarea.value = textarea.value.substring(0,start) + replace + textarea.value.substring(end,len); " +
						"});"+
					"});"+
				"</script>" +
				"</head><body><h1>WPS Tester</h1>"+
				//"<a href='http://www.52north.org/index.php?index' target='_blank'>"+
	            //    "<img src='http://52north.org/maven/project-sites/wps/52n-wps-site/images/logo_new.gif' height='110' width='252'/>"+
	            //"</a>"+
				"<form name='form1' method='post' action=''>"+
					  "<div>"+
						"<input name='url' value='"+serviceName+"' size='90' type='text'>"+		
					  "</div>"+
	            "</form>"+
				"<font color='#ffffff' face='Verdana, Arial, Helvetica, sans-serif'><b>Request:</b></font><br />"+
				"<form name='form2' method='post' action='' enctype='text/plain'>"+
					"<div>"+
							"<textarea id='request' name='request' cols='80' rows='20'>"+ requestXML +"</textarea>"+
					"</div>"+
					"<p>"+
							"<input value='   Clear    ' name='reset' type='reset'>"+
					"</p>"+
					"<p>"+
							"<input value='   Send    ' onclick='form2.action = form1.url.value' type='submit'>"+
					"</p>"+
				"</form>"+
				"<p><span id='replacerLink' style='cursor:pointer; text-decoration:underline;'>Encode</span> (mark the URL before)</p>"+
				"</body></html>"	);
	
    newwin.document.close();
    if (window.focus) {
            newwin.focus();
    }

}

/*
* Method:WOC.xml2Str
*     Interprets a DOMElement into single string.
* 
* Parameters: 
* domObject - {DOMElement} 
* initialString - {String} 
*/
/*
WOC.xml2Str = function(domObject, initialString) {
        var str = (initialString==undefined)?'' : initialString;
        if(domObject.nodeValue==undefined) {
                var multiStr = [];
                var temp = '';
                for(var i=0; i<domObject.childNodes.length; i++) {
                        // Each repeated node
                        if(domObject.childNodes[i].nodeName.toString().indexOf('#') < 0) {
                                var nodeNameStart = '<' + domObject.childNodes[i].nodeName;
                                var nodeNameEnd = '</' + domObject.childNodes[i].nodeName + '>';
                                var attsStr='';
                                var atts = domObject.childNodes[i].attributes;
                                if(atts != undefined){
                                        for(var j=0; j<atts.length; j++) {
                                                attsStr += ' ' + atts[j].nodeName + '="' + 
                                                                atts[j].firstChild.nodeValue+'"';
                                        }
                                }
                                temp = nodeNameStart + attsStr + '>' + 
                                                WOC.domToString(domObject.childNodes[i], str) + nodeNameEnd;
                                multiStr.push(temp);
                                str = temp;
                        } else {
                                // Node value
                                str = WOC.domToString(domObject.childNodes[i], str);
                                multiStr.push(str);
                        }
                }
                str = multiStr.join('');
        } else {
                return domObject.nodeValue;
        }
        return str;
}
*/
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/
 
/**
 * Class: WOC.WPSServiceContainer
 *     The container for WPS instances.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 *
 */
WOC.WPSServiceContainer = OpenLayers.Class({
        /**
     * Constructor: WOC.WPSServiceContainer
         */
        initialize: function() {
                /*
                * Variable: services
                * {HashTable{WOC.WPSService}} The WPS service instances.
                *     The key of the table is the name of the server.
                */
                var services = new Array();
                
                /**
                 * Method: getService
                 *     Returns a service from the container based on the given URL.
                 *
                 * Parameters: 
                 * url - {String} URL of the service.
                 * 
                 * Returns:
                 * {WOC.WPSService}
                 *
                 * Throws: 
                 * {ServiceNotFoundEx} The service is not in the container.
                 */
                this.getService = function(url) {
                        if(!services[url]) {
                                throw 'ServiceNotFoundEx';
                        }
                        return services[url];
                }
                
                /**
                * Method: getServiceCount
                *     Returns the number of services in the container.
                *
                * Returns: 
                * {Integer} The number of services.
                */
                this.getServiceCount = function() {
                        var count = 0;
                        for(var i in services) {
                                count++;
                        }
                        return count;
                }
                
                /**
                * Method: addService
                *     Adds a new WPS service instance based on the given url to the 
                *     container.
                * 
                * Parameters:
                * url - {String} URL of the service instance.
                * client - {WOC.WPSClient} The WPS client.
                * 
                * Throws:
                * {ServiceExistsEx} If the service already exists in the 
                *     container.
                * {URLEx} If the URL is unvalid.
                */
                this.addService = function(url, client) {
                        // Check the existing servers. No need to add a second time!
                        if(services[url]) {
                                throw 'ServiceExistsEx';
                        }
                        // Check the URL beginning.
                        if(url.length < 8) {
                                throw 'URLEx';
                        }
                        if(url.substring(0,7) != "http://" && url.substring(0,8) != "https://") {
                                throw 'URLEx';
                        }
                        services[url] = new WOC.WPSService(url, client);
                        services[url].getCapabilities(client.getCapabilitiesMethod);
                }
                
                /**
                * Method: removeService
                *     Removes a WPS service instance from the container.
                *
                * Parameters:
                * url - {String} URL of the service instance.
                */
                this.removeService = function(url) {
                        // Check that the server exists!
                        if(services[url]) {
                                services[url] = null;
                        }
                }
        },
        CLASS_NAME:"WOC.WPSServiceContainer"
});
schema="http://schemas.opengis.net/gml/3.1.1/base/feature.xsd"/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.WPSService
 *     The WPS Service instance.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.WPSService = OpenLayers.Class({
        /**
     * Constructor: WOC.WPSService
         *
         * Parameters:
         * url - {String} The URL of the service instance.
         * wpsClient - {WOC.WPSClient} The client of the service.
     */
        initialize:function(url, wpsClient) {
                /**
                 * Variable: url
                 * {String} URL of the service.
                 */
                var url = url;
                /**
                 * Variable: version
                 * {String} Version of the service.
                 */
                var version = "1.0.0";
                /**
                 * Variable: client
                 * {WOC.WPSClient} The service's client application.
                 */
                var client = wpsClient;
                /**
                 * Variable: getCapabilitiesRequest
                 * {Object} The getCapabilities-operation's reguest.
                 *     This can be used to cancel the request!
                 */
                var getCapabilitiesRequest = null;
                /**
                 * Variable: metadata
                 * {WOC.OWServiceIdentification} The metadata about the service.
                 */
                var metadata = new WOC.OWServiceIdentification();
                /**
                 * Variable: processes
                 * {HashTable{WOC.WPSProcess}} The processes offered by the service.
                 *     The key is the process' identifier.
                 */
                var processes = [];

                // var serviceProvider
                // var operationsMetadata

                /**
                 * Variable: exceptions
                 * {Array{WOC.ExceptionReport}} Object array of exceptions.
                 *     (Each arrived response nullifies the array in the beginning!)
                 */
                var exceptions = [];

                /**
                 * Variable: warnings
                 * {Array{WOC.ExceptionReport}} Object array of warnings.
                 *      (Each arrived response nullifies the array in the beginning!)
                 */
                var warnings = [];

                /**
                 * Method: getCapabilities
                 *     Gets the capabilities of the service.
                 *
                 * Parameters:
                 * method - {String} Method to be used. Can be GET, POST or SOAP.
                 */
                this.getCapabilities = function(method) {
                        if(method == "POST") {
                                this.getCapabilitiesPOST(
                                                this.getCapabilitiesSuccess,
                                                this.getCapabilitiesFailure);
                        } else if(method == "SOAP") {
                                this.getCapabilitiesSOAP(
                                                this.getCapabilitiesSOAPSuccess,
                                                this.getCapabilitiesFailure);
                        } else {
                                // Default choice
                                this.getCapabilitiesGET(
                                                this.getCapabilitiesSuccess,
                                                this.getCapabilitiesFailure);
                        }
                }

                /**
                 * Method: popupServiceCapabilities
                 *     Gets the capabilities of the service and shows them to the user.
                 *
                 * Parameters:
                 * method - {String} Method to be used. Can be GET, POST or SOAP.
                 */
                this.popupServiceCapabilities = function(method) {
                        if(method == "POST") {
                                this.getCapabilitiesPOST(
                                                this.getCapabilitiesPopupSuccess,
                                                this.getCapabilitiesFailure);
                        } else if(method == "SOAP") {
                                this.getCapabilitiesSOAP(
                                                this.getCapabilitiesPopupSuccess,
                                                this.getCapabilitiesFailure);
                        } else {
                                // Default choice
                                this.getCapabilitiesGET(
                                                this.getCapabilitiesPopupSuccess,
                                                this.getCapabilitiesFailure);
                        }
                }

                /**
                 * Method: getCapabilitiesGET
                 *     Gets the capabilities of the service using the GET method.
                 *
                 * Parameters:
                 * targetSuccessFunction - {Function} Function, which is called after
                 *     a successful getCapabilities query.
                 * targetFailureFunction - {Function} Function, which is called after
                 *     an unsuccessful getCapabilities query.
                 */
                this.getCapabilitiesGET = function(targetSuccessFunction,
                                targetFailureFunction) {
                        var params = "?service=" + WOC.WPSService.SERVICE;
                        params += "&Request=GetCapabilities";
                        params += "&AcceptVersions=";
                        // OWS 1.1.0: Parameters values containing lists (for example,
                        // AcceptVersions and AcceptFormats in the GetCapabilities operation
                        // request) shall use the comma (",") as the separator between items
                        // in the list.
                        for(var i=0; i<WOC.WPSService.SUPPORTED_VERSIONS.length; i++) {
                                if(i != 0) {
                                        params += ",";
                                }
                                params += WOC.WPSService.SUPPORTED_VERSIONS[i];
                        }
                        // params += "&language=en-US";
                        // http://dev.openlayers.org/docs/files/OpenLayers/Ajax-js.html#loadURL
                        getCapabilitiesRequest =
                                OpenLayers.loadURL(url + params, '', this,
                                                targetSuccessFunction, targetFailureFunction);
                }

                /**
                 * Method: getCapabilitiesPOST
                 *     Gets the capabilities of the service using the POST method.
                 *
                 * Parameters:
                 * targetSuccessFunction - {Function} Function, which is called after
                 *     a successful getCapabilities query.
                 * targetFailureFunction - {Function} Function, which is called after
                 *     an unsuccessful getCapabilities query.
                 *
                 * See: http://schemas.opengis.net/wps/1.0.0/examples/10_wpsGetCapabilities_request.xml
                 */
                this.getCapabilitiesPOST = function(targetSuccessFunction,
                                targetFailureFunction) {
                        var requestXML = "<?xml version=\"1.0\" " +
                                        "encoding=\"UTF-8\" standalone=\"yes\"?>";
                        requestXML += this.getCapabilitiesRequestXML();
                        var options = new Object();
                        options.method = 'POST';
                        options.asynchronous = true;
                        options.contentType = 'text/xml';
                        options.onComplete = OpenLayers.Function.bind(
                                        targetSuccessFunction, this);
                        options.onFailure = OpenLayers.Function.bind(
                                        targetFailureFunction, this);
                        options.postBody = requestXML;
                        new OpenLayers.Ajax.Request(url, options);
                }

                /**
                 * Method: getCapabilitiesSOAP
                 *     Gets the capabilities of the service using the SOAP method.
                 *
                 * Parameters:
                 * targetSuccessFunction - {Function} Function, which is called after
                 *     a successful getCapabilities query.
                 * targetFailureFunction - {Function} Function, which is called after
                 *     an unsuccessful getCapabilities query.
                 *
                 * See:
                 * http://schemas.opengis.net/wps/1.0.0/examples/10_wpsGetCapabilities_request_SOAP.xml
                 */
                this.getCapabilitiesSOAP = function(targetSuccessFunction,
                                targetFailureFunction) {
                        var soapMessage = "<?xml version=\"1.0\" " +
                                        "encoding=\"UTF-8\" standalone=\"yes\"?>";
                        soapMessage += "<soap:Envelope " +
                                        "xmlns:soap=\"" + WOC.SOPE_ENVELOPE_NAMESPACE + "\" " +
                                        "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " +
                                        "xsi:schemaLocation=\"" +
                                        "http://www.w3.org/2003/05/soap-envelope " +
                                        "http://www.w3.org/2003/05/soap-envelope\">";
                        soapMessage += "<soap:Body>";
                        soapMessage += this.getCapabilitiesRequestXML();
                        soapMessage += "</soap:Body></soap:Envelope>";
                        var options = new Object();
                        options.method = 'POST';
                        options.asynchronous = true;
                        options.contentType = 'text/xml';
                        options.onComplete = OpenLayers.Function.bind(
                                        targetSuccessFunction, this);
                        options.onFailure = OpenLayers.Function.bind(
                                        targetFailureFunction, this);
                        // Add a user-defined header - The SOAPAction
                options.requestHeaders = new Object();
                options.requestHeaders.SOAPAction = WOC.WPS_NAMESPACE + "/" +
                                "GetCapabilities";
                        options.postBody = soapMessage;
                        new OpenLayers.Ajax.Request(url, options);
                }

                /**
                 * Method: getCapabilitiesRequestXML
                 *     Returns the wps:GetCapabilities reguest's XML content.
                 *
                 * Returns:
                 * {String} The wps:GetCapabilities reguest's XML content.
                 *
                 * See:
                 * http://schemas.opengis.net/wps/1.0.0/wpsGetCapabilities_request.xsd
                 */
                this.getCapabilitiesRequestXML=function() {
                        var xml = "<wps:GetCapabilities";
                        xml += " service=\"" + WOC.WPSService.SERVICE + "\"";
                        // xml += " language=" + language;
                        xml += " xmlns:wps=\"" + WOC.WPS_NAMESPACE + "\"";
                        xml += " xmlns:ows=\"" + WOC.OWS_NAMESPACE + "\"";
                        xml += " xmlns:xlink=\"http://www.w3.org/1999/xlink\"";
                        xml += " xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"";
                        // xsi:schemaLocation (Note! KVP)
                        xml += " xsi:schemaLocation=\"" + WOC.WPS_NAMESPACE;
                        xml += " http://schemas.opengis.net/" +
                                        "wps/1.0.0/wpsGetCapabilities_request.xsd\">";
                        // Prioritized sequence of one or more specification versions
                        // accepted by this client. ows:AcceptVersionsType
                        xml += "<ows:AcceptedVersions><ows:Version>1.0.0</ows:Version>" +
                                                "</ows:AcceptedVersions></wps:GetCapabilities>";
                        return xml;
                }

                /**
                 * Method: getCapabilitiesSuccess
                 *     This method is called after a successful getCapabilities guery.
                 *
                 * Parameters:
                 * response - {XMLHttpRequest}
                 *
                 * See: http://schemas.opengis.net/wps/1.0.0/examples/20_wpsGetCapabilities_response.xml
                 */
                this.getCapabilitiesSuccess = function(response) {
                        var xmlDoc = WOC.getDomDocumentFromResponse(response);
                        if(xmlDoc) {
                                var capabilities = WOC.getElementsByTagNameNS(
                                                xmlDoc, WOC.WPS_NAMESPACE, WOC.WPS_PREFIX,
                                                'Capabilities').item(0);
                                this.getCapabilitiesResponseHandlind(capabilities);
                        }
                }

                /**
                 * Method: getCapabilitiesSOAPSuccess
                 *     This method is called after a successful getCapabilities guery
                 *     which has been made using SOAP.
                 *
                 * Parameters:
                 * response - {XMLHttpRequest}
                 *
                 * See: http://schemas.opengis.net/wps/1.0.0/examples/20_wpsGetCapabilities_response_SOAP.xml
                 */
                this.getCapabilitiesSOAPSuccess = function(response) {
                        var xmlDoc = WOC.getDomDocumentFromResponse(response);
                        if(xmlDoc) {
                                var envelope = WOC.getElementsByTagNameNS(
                                                xmlDoc, WOC.SOAP_ENVELOPE_NAMESPACE,
                                                WOC.SOAP_ENVELOPE_PREFIX, 'Envelope').item(0);
                                var body = WOC.getElementsByTagNameNS(
                                                envelope, WOC.SOAP_ENVELOPE_NAMESPACE,
                                                WOC.SOAP_ENVELOPE_PREFIX, 'Body').item(0);
                                var capabilities = WOC.getElementsByTagNameNS(
                                                body, WOC.WPS_NAMESPACE, WOC.WPS_PREFIX,
                                                'Capabilities').item(0);
                                this.getCapabilitiesResponseHandlind(capabilities);
                        }
                }

                /**
                 * Method:getCapabilitiesResponseHandlind
                 *
                 *
                 * Parameters:
                 * capabilities - {DOMElement} The wps:Capabilities element of the
                 * GetCapabilities operation's response.
                 *
                 * See: http://schemas.opengis.net/wps/1.0.0/examples/20_wpsGetCapabilities_response.xml
                 */
                this.getCapabilitiesResponseHandlind = function(capabilities) {
                        try {
                                this.checkResponseVersionServiceLang(capabilities);
                        } catch(e) {
                                if(e == 'WrongOrMissingVersionEx') {
                                        client.updateInfoText("Service version was wrong or not " +
                                                "found in the WPS GetCapabilities-operation response!", "red");
                                } else if(e == 'WrongOrMissingServiceEx') {
                                        client.updateInfoText("Service name was wrong or not " +
                                                "found in the WPS GetCapabilities-operation response!", "red");
                                } else if(e == 'WrongOrMissingLangEx') {
                                        client.updateInfoText("Service language was wrong or not " +
                                                "found in the WPS GetCapabilities-operation response!", "red");
                                } else {
                                        client.updateInfoText("Undefined exception occured " +
                                                        "while getting the capabilities!", 'red');
                                }
                                return;
                        }
                        // var serviceIdentification = capabilities.getElementsByTagName("ServiceIdentification").item(0);
                        // Service identification
                        metadata.parseFromNode(
                                        WOC.getElementsByTagNameNS(
                                                        capabilities, WOC.OWS_NAMESPACE,
                                                        WOC.OWS_PREFIX,
                                                        'ServiceIdentification')[0]);
                        // Service Provider



                        // Operations Metadata
                        // server.operationsMetadata = xmlDoc.getElementsByTagName("OperationsMetadata");



                        // Process offerings
                        var processOfferingsNode = WOC.getElementsByTagNameNS(
                                        capabilities, WOC.WPS_NAMESPACE,
                                        WOC.WPS_PREFIX, 'ProcessOfferings').item(0);
                        var processNodes = WOC.getElementsByTagNameNS(
                                        processOfferingsNode, WOC.WPS_NAMESPACE,
                                        WOC.WPS_PREFIX, 'Process');
                        // hier werden die title, abstract und identifier für jeden Prozess gespeichert
                        for(var i=0; i<processNodes.length; i++) {
                                var wpsProcess = new WOC.WPSProcess();
                                wpsProcess.parseCapabilitiesNode(processNodes[i]);

                                processes[wpsProcess.getIdentifier()] = wpsProcess;    // processes ist also ein array aus tupel string identifier() und process?
                        }
                        client.updateCapabilities();
                }

                /**
                 * Method: getCapabilitiesPopupSuccess
                 *     This method is called after a successful getCapabilities guery
                 *     whose response the user wants to view.
                 *
                 * Parameters:
                 * response - {XMLHttpRequest}
                 */
                this.getCapabilitiesPopupSuccess = function(response) {
                        var documentRoot = WOC.getDomDocumentFromResponse(
                                        response).documentElement;
                        WOC.popupXML("WPS GetCapabilities-operation response",
                                        [documentRoot]);
                }

                /**
                 * Method: getCapabilitiesFailure
                 *     This method is called after an unsuccessful getCapabilities
                 *     guery.
                 *
                 * Parameters:
                 * response - {XMLHttpRequest}
                 */
                this.getCapabilitiesFailure = function(response) {
                        client.updateInfoText("WPS GetCapabilities-operation request failed!",
                                        "red");
                }

                /**
                 * Method: popupProcessDescriptions
                 *    This method calls the DescribeProcess-operation to show to the
                 *    user the descriptions of the wanted processes.
                 *
                 * Parameters:
                 * processIdentifiers - {Array} An array of process identifiers, whose
                 *     descriptions are to be queried.
                 * method - {String} Method to be used. Can be GET, POST or SOAP. The
                 *     default method is GET.
                 */
                this.popupProcessDescriptions = function(processIdentifiers, method) {
                        if(method == "POST") {
                                this.describeProcessPOST(processIdentifiers,
                                                this.getDescriptionPopupSuccess,
                                                this.getDescriptionFailure);
                        } else if(method == "SOAP") {
                                this.describeProcessSOAP(processIdentifiers,
                                                this.getDescriptionPopupSuccess,
                                                this.getDescriptionFailure);
                        } else {
                                // Default choice
                                this.describeProcessGET(processIdentifiers,
                                        this.getDescriptionPopupSuccess,
                                        this.getDescriptionFailure, true);
                        }
                }

                /**
                 * Method: describeProcesses
                 *    This method calls the DescribeProcess-operation to get the
                 *    descriptions of the wanted processes.
                 *
                 * Parameters:
                 * processIdentifiers - {Array} An array of process identifiers, whose
                 *     descriptions are to be queried.
                 * method - {String} Method to be used. Can be GET, POST or SOAP. The
                 *     default method is GET.
                 */
                this.describeProcesses = function(processIdentifiers, method) {
                        if(method == "POST") {
                                this.describeProcessPOST(processIdentifiers,
                                                this.getDescriptionSuccess,
                                                this.getDescriptionFailure);
                        } else if(method == "SOAP") {
                                this.describeProcessSOAP(processIdentifiers,
                                                this.getDescriptionSOAPSuccess,
                                                this.getDescriptionFailure);
                        } else {
                                // Default choice
                                this.describeProcessGET(processIdentifiers,
                                        this.getDescriptionSuccess,
                                        this.getDescriptionFailure, true);
                        }
                }

                /**
                 * Method: describeProcessGET
                 *    This method calls the DescribeProcess-operation using the
                 *    GET method.
                 *
                 * Parameters:
                 * processIdentifiers - {Array} An array of process identifiers, whose
                 *     descriptions are to be queried.
                 * targetSuccessFunction - {Function} Called after a successful
                 *     query to the service.
                 * targetFailureFunction - Called after a failed query to the service.
                 * update - {Boolean} if the WPSClient should update the process description GUI or not // by Raphael Rupprecht
                 */
                this.describeProcessGET = function(processIdentifiers,
                                targetSuccessFunction, targetFailureFunction, update) {
                        if(update){   // wenn update=true ist, ist die targetSuccessFunction eine andere (getDescriptionSuccess())
                                // Check that at least one identifier is given!
                                if(processIdentifiers.length < 1) {return;}
                                var params = "?service=" + WOC.WPSService.SERVICE;
                                params += "&request=DescribeProcess";
                                params += "&version=" + version;
                                // params += "&Language=en-US;";
                                params += "&Identifier=";
                                params += processIdentifiers[0];
                                // alert("ProcessIdentifier: " + processIdentifiers[0]);
                                for(var i=1; i<processIdentifiers.length; i++) {
                                        params += "," + processIdentifiers[i];
                                }
                                // http://dev.openlayers.org/docs/files/OpenLayers/Ajax-js.html#loadURL
                                OpenLayers.loadURL(url + params, '', this,
                                                targetSuccessFunction, targetFailureFunction);
                        }
                        // the client should not update the GUI!  rr5
                        else{
                                // Check that at least one identifier is given!
							if(processIdentifiers.length < 1) {return;}
							for(var r=0; r<processIdentifiers.length; r++){			
								if(typeof processFilter != 'undefined' && processFilter.length > 0){					// checking the global processFilter
									for(var i=0; i<processFilter.length; i++){		
										if(processFilter[i] == processIdentifiers[r]){	// only if the current process is inside the processFilter[], request the describeProcess
											var params = "?service=" + WOC.WPSService.SERVICE;
											params += "&request=DescribeProcess";
											params += "&version=" + version;
											// params += "&Language=en-US;";
											params += "&Identifier=";
											params += processIdentifiers[r];
											OpenLayers.loadURL(url + params, '', this,                     // rr6
																targetSuccessFunction, targetFailureFunction);
											break;
										}
									}
								} else {
									var params = "?service=" + WOC.WPSService.SERVICE;
									params += "&request=DescribeProcess";
									params += "&version=" + version;
									// params += "&Language=en-US;";
									params += "&Identifier=";
									params += processIdentifiers[r];
									OpenLayers.loadURL(url + params, '', this,                     // rr6
														targetSuccessFunction, targetFailureFunction);									
								}
							}
                        }
                }

                /**
                 * Method: describeProcessPOST
                 *    This method calls the DescribeProcess-operation using the
                 *    POST method.
                 *
                 * Parameters:
                 * processIdentifiers - {Array} An array of process identifiers, whose
                 *     descriptions are to be queried.
                 * targetSuccessFunction - {Function} Called after a successful
                 *     query to the service.
                 * targetFailureFunction - Called after a failed query to the service.
                 *
                 * See:
                 * http://schemas.opengis.net/wps/1.0.0/examples/30_wpsDescribeProcess_request.xml
                 * http://schemas.opengis.net/wps/1.0.0/wpsDescribeProcess_request.xsd
                 * http://schemas.opengis.net/wps/1.0.0/common/RequestBaseType.xsd
                 */
                this.describeProcessPOST = function(processIdentifiers,
                                targetSuccessFunction, targetFailureFunction) {
                        var requestXML = "<?xml version=\"1.0\" " +
                                        "encoding=\"UTF-8\" standalone=\"yes\"?>";
                        requestXML += this.describeProcessRequestXML(processIdentifiers);
                        var options = new Object();
                        options.method = 'POST';
                        options.asynchronous = true;
                        options.contentType = 'text/xml';
                        options.onComplete = OpenLayers.Function.bind(
                                        targetSuccessFunction, this);
                        options.onFailure = OpenLayers.Function.bind(
                                        targetFailureFunction, this);
                        options.postBody = requestXML;
                        new OpenLayers.Ajax.Request(url, options);
                        // alert("DescribeProcess with POST method was called! " + requestXML);
                }

                /**
                 * Method: describeProcessSOAP
                 *    This method calls the DescribeProcess-operation using the
                 *    SOAP method.
                 *
                 * Parameters:
                 * processIdentifiers - {Array} An array of process identifiers, whose
                 *     descriptions are to be queried.
                 * targetSuccessFunction - {Function} Called after a successful
                 *     query to the service.
                 * targetFailureFunction - Called after a failed query to the service.
                 *
                 * See: http://schemas.opengis.net/wps/1.0.0/examples/30_wpsDescribeProcess_request_SOAP.xml
                 */
                this.describeProcessSOAP = function(processIdentifiers,
                                targetSuccessFunction, targetFailureFunction) {
                        var soapMessage = "<?xml version=\"1.0\" " +
                                        "encoding=\"UTF-8\" standalone=\"yes\"?>";
                        soapMessage += "<soap:Envelope " +
                                        "xmlns:soap=\"" + WOC.SOPE_ENVELOPE_NAMESPACE + "\" " +
                                        "xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" " +
                                        "xsi:schemaLocation=\"" +
                                        "http://www.w3.org/2003/05/soap-envelope " +
                                        "http://www.w3.org/2003/05/soap-envelope\">";
                        soapMessage += "<soap:Body>";
                        soapMessage += this.describeProcessRequestXML(processIdentifiers);
                        soapMessage += "</soap:Body></soap:Envelope>";
                        var options = new Object();
                        options.method = 'POST';
                        options.asynchronous = true;
                        options.contentType = 'text/xml';
                        options.onComplete = OpenLayers.Function.bind(
                                        targetSuccessFunction, this);
                        options.onFailure = OpenLayers.Function.bind(
                                        targetFailureFunction, this);
                        // Add a user-defined header - The SOAPAction
                options.requestHeaders = new Object();
                options.requestHeaders.SOAPAction = WOC.WPS_NAMESPACE + "/" +
                                "DescribeProcess";
                        options.postBody = soapMessage;
                        new OpenLayers.Ajax.Request(url, options);
                }

                /**
                 * Method: describeProcessRequestXML
                 *     Returns the wps:DescribeProcess reguest's XML content.
                 *
                 * Returns:
                 * {String} The wps:DescribeProcess reguest's XML content.
                 *
                 * See:
                 * http://schemas.opengis.net/wps/1.0.0/wpsDescribeProcess_request.xsd
                 */
                this.describeProcessRequestXML = function(processIdentifiers) {
                        var xml = "<wps:DescribeProcess";
                        xml += " service=\"" + WOC.WPSService.SERVICE + "\"";
                        xml += " version=\"" + version + "\"";
                        // xml += " language=" + language;
                        xml += " xmlns:wps=\"" + WOC.WPS_NAMESPACE + "\"";
                        xml += " xmlns:ows=\"" + WOC.OWS_NAMESPACE + "\"";
                        xml += " xmlns:xlink=\"http://www.w3.org/1999/xlink\"";
                        xml += " xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"";
                        // xsi:schemaLocation (Note! KVP)
                        xml += " xsi:schemaLocation=\"" + WOC.WPS_NAMESPACE;
                        xml += " http://schemas.opengis.net/" +
                                        "wps/1.0.0/wpsDescribeProcess_request.xsd\">";
                        for(var i=0; i<processIdentifiers.length; i++) {
                                xml += "<ows:Identifier>" +
                                                processIdentifiers[i] + "</ows:Identifier>";
                        }
                        xml += "</wps:DescribeProcess>";
                        return xml;
                }

                /**
                 * Method: getDescriptionSuccess
                 *     This method is called after a successful DescribeProcess guery.
                 *
                 * Parameters:
                 * response - {XMLHttpRequest}
                 */
                this.getDescriptionSuccess = function(response) {
                        // alert(response.responseText);
                        var xmlDoc = WOC.getDomDocumentFromResponse(response);
                        if(xmlDoc) {
                                var processDescriptionsNodes = WOC.getElementsByTagNameNS(
                                                xmlDoc, WOC.WPS_NAMESPACE,
                                                WOC.WPS_PREFIX, 'ProcessDescriptions');
                                this.describeProcessResponseHandlind(
                                                processDescriptionsNodes.item(0), true);
                        } else {
                                alert("ProcessDescription xmlDoc was NULL!!!!");
                                // TODO In case the ProcessDescription xmlDoc is NULL!
                        }
                }

                // TODO  rr7
                this.getDescriptionSuccessNoUpdate = function(response) {
                        //alert(response.responseText);
                        var xmlDoc = WOC.getDomDocumentFromResponse(response);
                        if(xmlDoc) {
                                //alert(xmlDoc.firstChild.firstChild.innerText);          // little summary
                                //alert(xmlDoc.firstChild.firstChild.childNodes[1].innerText);        // process identifier
                                var processDescriptionsNodes = WOC.getElementsByTagNameNS(
                                                xmlDoc, WOC.WPS_NAMESPACE,
                                                WOC.WPS_PREFIX, 'ProcessDescriptions');
                                this.describeProcessResponseHandlind(
                                                processDescriptionsNodes.item(0), false);             // rr8
                        } else {
                                alert("ProcessDescription xmlDoc was NULL!!!!");
                                // TODO In case the ProcessDescription xmlDoc is NULL!
                        }
                }

                /**
                 * Method: getDescriptionSOAPSuccess
                 *     This method is called after a successful DescribeProcess
                 *     operation guery made using SOAP.
                 *
                 * Parameters:
                 * response - {XMLHttpRequest}
                 *
                 * See: http://schemas.opengis.net/wps/1.0.0/examples/20_wpsGetCapabilities_response_SOAP.xml
                 */
                this.getDescriptionSOAPSuccess = function(response) {
                        var xmlDoc = WOC.getDomDocumentFromResponse(response);
                        if(xmlDoc) {
                                var envelope = WOC.getElementsByTagNameNS(
                                                xmlDoc, WOC.SOAP_ENVELOPE_NAMESPACE,
                                                WOC.SOAP_ENVELOPE_PREFIX, 'Envelope').item(0);
                                var body = WOC.getElementsByTagNameNS(
                                                envelope, WOC.SOAP_ENVELOPE_NAMESPACE,
                                                WOC.SOAP_ENVELOPE_PREFIX, 'Body').item(0);
                                var processDescriptionsNodes = WOC.getElementsByTagNameNS(
                                                body, WOC.WPS_NAMESPACE, WOC.WPS_PREFIX,
                                                'ProcessDescriptions');
                                this.describeProcessResponseHandlind(
                                                processDescriptionsNodes.item(0), true);
                        }
                }

                /**
                 * Method: describeProcessResponseHandlind
                 * Parameters:
                 * processDescriptionsNode - {DOMElement} A wps:ProcessDescriptions node.
                 * update - {Boolean} if the WPSClient should update the process description GUI or not // by Raphael Rupprecht
                 */
                this.describeProcessResponseHandlind = function(processDescriptionsNode, update) {
                        var processDescriptionNodes = WOC.getElementsByTagNameNS(
                                        processDescriptionsNode, WOC.WPS_NAMESPACE,
                                        WOC.WPS_PREFIX, 'ProcessDescription');
                        for(var i=0; i<processDescriptionNodes.length; i++) {
                                var processIdentifier = WOC.getElementsByTagNameNS(     // rr9
                                                processDescriptionNodes[i], WOC.OWS_NAMESPACE,
                                                WOC.OWS_PREFIX, 'Identifier')[0].firstChild.nodeValue;
                                //alert(processIdentifier);
                                if(!processes[processIdentifier]) {
                                        // TODO Unknown process in DescribeProcess !!!! Should never happen!
                                        alert("Unknown process!!!! Should never happen! " +
                                                        "Process is null:" + processIdentifier);
                                } else {
                                        try {   // rr10
                                                processes[processIdentifier].parseDescriptionNode(           // WPSProcess.parseDescriptionNode()
                                                                 processDescriptionNodes[i]);                // parses the describe-doc and saves the inputs, outputs etc.
                                        } catch(exception) {
                                                if(exception == 'AttributeMissingEx') {
                                                        //alert('1158:AttributeMissingEx');
                                                        // TODO Exception handling
                                                } else if(exception == 'ElementMissingEx') {
                                                        //alert('1161:ElementMissingEx');
                                                        // TODO Exception handling
                                                }
                                        }
                                }
                        }
                        if(update){
                                   client.updateDescription();             // update the WPSClient
                        }else{
                                   var processIdentifier = WOC.getElementsByTagNameNS(
                                                processDescriptionNodes[0], WOC.OWS_NAMESPACE,
                                                WOC.OWS_PREFIX, 'Identifier')[0].firstChild.nodeValue;
                                   // dont update... just add the process option to the selectBox
                                   var option = document.createElement('option');
                                   var process = this.getProcess(processIdentifier);
                                       option.text = process.getTitle();
                                       option.value = process.getIdentifier();

                                   //rr16
                                   if(process.getisClientSupported()==true){
                                       client.processSelection.appendChild(option);  // add the process to the process list
                                       if(client.processSelection.size == 1){
                                            client.updateDescription(); // rr17 test
                                       }else{
                                            // do nothing
                                       }
                                   }
                                   else{
                                        // dont add the process
                                   }
                        }

                }

                /**
                 * Method: getDescriptionPopupSuccess
                 *     This method is called after a successful DescribeProcess guery,
                 *     whose response is shown to the user.
                 *
                 * Parameters:
                 * response - {XMLHttpRequest}
                 */
                this.getDescriptionPopupSuccess = function(response) {
                        var documentRoot = WOC.getDomDocumentFromResponse(
                                        response);
                        WOC.popupXML("WPS DescribeProcess-operation response",
                                        [documentRoot]);
                }

                /**
                 * Method: getDescriptionFailure
                 *     This method is called after an unsuccessful DescribeProcess guery.
                 *
                 * Parameters:
                 * response - {XMLHttpRequest}
                 */
                this.getDescriptionFailure = function(response) {
                        client.updateInfoText(
                                        "WPS DescribeProcess-operation request failed!!", "red");
                }

                /**
                 * Method: execute
                 *     Calls the Execute-operation of the wanted process.
                 *
                 * Parameters:
                 * processIdentifier - {String} Identifier of the process to execute.
                 * method - {String} Method to be used. Can be GET, POST or SOAP. The
                 *     default method is POST (using XML encoding).
                 * popupExecuteRequest - {Function} Function, which is called after
                 *     a successful Execute query.
                 * popupExecuteResponse - {Function} Function, which is called after
                 *     an unsuccessful Execute query.
                 *
                 * Returns:
                 * {WOC.WPSExecution} An object presenting and managing the execution.
                 */
                this.execute = function(processIdentifier, method,
                                popupExecuteReq, popupExecuteResp, resultObject) {
                        var execution = new WOC.WPSExecution(this,
                                        processes[processIdentifier]);
                        if(method == "GET") {
                                // TODO Execute using GET
                                alert("Execute using GET is unimplement!");
                        } else if(method == "SOAP") {
                                // TODO Execute using SOAP
                                alert("Execute using SOAP is unimplement!");
                        } else {
                                // Default choice is POST
                                if(popupExecuteResp)  {
                                        this.executePOST(processIdentifier,
                                                        popupExecuteReq,
                                                        execution.executePopupSuccess,
                                                        execution.executeFailure,
                                                        execution);
                                } else {
                                        this.executePOST(processIdentifier,
                                                        popupExecuteReq,
                                                        execution.executeSuccess,
                                                        execution.executeFailure,
                                                        execution);
                                }
                        }
                        execution.updateTableRow();
                        return execution;
                }

                /**
                 * Method: executePOST
                 *     Calls the Execute-operation of the wanted process using the
                 *     POST method.
                 *
                 * Parameters:
                 * processIdentifier - {String} Identifier of the process to execute.
                 * popupRequest - {Boolean} Tells if the request should be shown to
                 *     the user.
                 * targetSuccessFunction - {Function} Function, which is called after
                 *     a successful Execute query.
                 * targetFailureFunction - {Function} Function, which is called after
                 *     an unsuccessful Execute query.
                 * responseHandlindObject - {WOC.WPSExecution} An object presenting and
                 *     managing the execution.
                 *
                 * See:
                 * http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd
                 * http://schemas.opengis.net/wps/1.0.0/common/RequestBaseType.xsd
                 */
                this.executePOST = function(processIdentifier,
                                popupRequest, targetSuccessFunction,
                                targetFailureFunction, responseHandlindObject) {
                        var requestXML = "<?xml version=\"1.0\" " +
                                        "encoding=\"UTF-8\" standalone=\"yes\"?>";
                        requestXML += "<wps:Execute";
                        requestXML += " service=\"" + WOC.WPSService.SERVICE + "\"";
                        requestXML += " version=\"" + version + "\"";
                        // requestXML += " language=" + language;
                        requestXML += " xmlns:wps=\"" + WOC.WPS_NAMESPACE + "\"";
                        requestXML += " xmlns:ows=\"" + WOC.OWS_NAMESPACE + "\"";
                        requestXML += " xmlns:ogc=\"" + WOC.OGC_NAMESPACE + "\"";
                        requestXML += " xmlns:xlink=\"http://www.w3.org/1999/xlink\"";
                        requestXML += " xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"";
                        requestXML += " xsi:schemaLocation=\"" + WOC.WPS_NAMESPACE;			
                        requestXML += " http://schemas.opengis.net/" +
                                        "wps/1.0.0/wpsExecute_request.xsd\">";
                        requestXML += "<ows:Identifier>" + processIdentifier +
                                        "</ows:Identifier>";
                        // Actual inputs.
                        try {
                                requestXML += processes[processIdentifier].getDataInputsXML(
                                        client.getMap());
                                //requestXML = requestXML.replace("xsi:schemaLocation","schemaLocation");			// hack, because the WPS cannot handle the xsi by now
                        } catch(exception) {
                                var str = "Execute-operation could not be performed"
                                if(exception == 'LayerNullEx') {
                                        client.updateInfoText(str + " because the layer was null!",
                                                        'red');
                                } else if(exception == 'UnsupportedLayerTypeEx') {
                                        client.updateInfoText(str + " because the layer type is " +
                                                "unsupported!", 'red');
                                } else if(exception == 'EmptyStringValueEx') {
                                        client.updateInfoText(str + " because at least one value " +
                                                "was not given!", 'red');
                                } else if(exception == 'Exception') {
                                        client.updateInfoText(str +
                                                        " because an exception occured!", 'red');
                                } else {
                                        client.updateInfoText(str + "! " +
                                                        " Exception was " + exception, 'red');
                                }
                                return;
                        }
                        requestXML += "<wps:ResponseForm>";
                        // We always use the ResponseDocument!
                        // Storing is also always false as well as lineage!
                        requestXML += "<wps:ResponseDocument store=\"false\" lineage=\"false\"";
                        // Status is queried if possible!
                        if(processes[processIdentifier].statusSupported) {
                                requestXML += " status=\"true\"";
                        } else {
                                requestXML += " status=\"false\"";
                        }
                        requestXML += ">";

                        for(var outputIdentifier in processes[processIdentifier].getOutputs()) {
                                var wpsOutputData = processes[processIdentifier].getOutputs()[outputIdentifier];
                                requestXML += "<wps:Output";
                                // UoM
                                // asReference. Default is false.
                                requestXML += " asReference=\"false\"";
                                // MIME type, encoding and schema
                                var complexOutput = wpsOutputData.getComplexOutput();
                                if(complexOutput != null) {
                                        // Go through the supported schemas and select one if it is supported by the client.
                                        // No output format defined!
                                        
                                		var formats = complexOutput.getFormats();
                                		var gml2Available = false;
                                		var gml3Available = false;
                                		var chosenIndex = 0;
                                        for(var k=0; k<formats.length; k++) {	
                                        	if(formats[k].getSchema() ==
                                        		"http://schemas.opengis.net/gml/3.1.1/base/feature.xsd" ||
                                        		formats[k].getSchema() ==
                                        		"http://schemas.opengis.net/gml/3.1.0/base/feature.xsd" ||
                                        		formats[k].getSchema() ==
                                        		"http://schemas.opengis.net/gml/3.0.1/base/feature.xsd" ||
                                        		formats[k].getSchema() ==
                                        		"http://schemas.opengis.net/gml/3.2.1/base/feature.xsd"){
                                        			gml3Available = true;
                                        			chosenIndex = k;
                                        			break; 					// break, because this is the schema we want
                                        	} else if(formats[k].getSchema() == "http://schemas.opengis.net/gml/2.1.2/feature.xsd"){
                                        		gml2Available = true;
                                        		chosenIndex = k;
                                        	}
                                        }
                                			
                                        if(gml3Available){				// prefered
                                        	requestXML += " schema=\"http://schemas.opengis.net/gml/3.1.1/base/feature.xsd\"";
                                        } else if(gml2Available){
                                        	requestXML += " schema=\"http://schemas.opengis.net/gml/2.1.2/feature.xsd\"";
                                        }                                  	
                                    	requestXML += " mimeType=\"" + formats[chosenIndex].getMimeType() + "\"";
				                        if(formats[chosenIndex].getEncoding() != "") {
				                           requestXML += " encoding=\"" + formats[chosenIndex].getEncoding() + "\"";
				                        }	
                                	
                                	/*
                                	    var formats = complexOutput.getFormats();
                                        for(var k=0; k<formats.length; k++) {					
                                                if(formats[k].getSchema() != "") {
                                                        if(formats[k].getSchema() > 32 &&
                                                           ((formats[k].getSchema().substring(0,32) == "http://schemas.opengis.net/gml/2") ||
                                                            (formats[k].getSchema().substring(0,32) == "http://schemas.opengis.net/gml/3"))) 
                                                        {
                                                                requestXML += " mimeType=\"" +										// mimeType
                                                                                formats[k].getMimeType() + "\"";
                                                                requestXML += " schema=\"" +										// schema
                                                                                formats[k].getSchema() + "\"";
                                                                if(formats[k].getEncoding() != "") {
                                                                   requestXML += " encoding=\"" +								// encoding
                                                                                formats[k].getEncoding() + "\"";
                                                                }
                                                                // Ending the loop.
                                                                k = formats.length;
                                                        }
                                                }
                                        }
                                    	/* #### HARD CODED until describeProcess is fixed ####
                                    	requestXML += " mimeType=\"" + "text/xml"+ "\"";						// mimeType                                	
                                    	requestXML += " schema=\"" + "http://schemas.opengis.net/gml/3.1.1/base/feature.xsd"+ "\"";						// schema
                                    	requestXML += " encoding=\"" + "UTF-8"+ "\"";						// encoding                                    		                                 
                                    	################################################### */
                                }

                                requestXML += "><ows:Identifier>" + wpsOutputData.getIdentifier()
                                                + "</ows:Identifier>";
                                requestXML += "<ows:Title>" + wpsOutputData.getTitle()
                                                + "</ows:Title>";
                                if(wpsOutputData.getAbstract() != "") {
                                        requestXML += "<ows:Abstract>" + wpsOutputData.getAbstract()
                                                        + "</ows:Abstract>";
                                }
                                requestXML += "</wps:Output>";
                        }
                        requestXML += "</wps:ResponseDocument>";
                        requestXML += "</wps:ResponseForm>";
                        requestXML += "</wps:Execute>";
                        
                        // if the checkbox for directing the executeDoc to the test.html is checked
						if($("#testCheckbox")[0].checked){
							WOC.openTestHtml(requestXML, serviceList.value);
						} else {
							// Show the request to the user in case he/she wants to see it.
							if(popupRequest) {
									this.popupExecuteRequest(requestXML);
							}
							var options = new Object();
							options.method = 'POST';
							options.asynchronous = true;
							options.contentType = 'text/xml';
							// options.onSuccess= this.parseExecutePostResponse;
							options.onComplete = OpenLayers.Function.bind(
											targetSuccessFunction, responseHandlindObject);
							options.onFailure = OpenLayers.Function.bind(
											targetFailureFunction, responseHandlindObject);
							options.postBody = requestXML;
							new OpenLayers.Ajax.Request(url, options);
						}
                        // alert("Execute with POST method was called! " + requestXML);
                }

                /**
                 * Method: executeGET
                 *     Calls the Execute-operation of the wanted process using the
                 *     GET method.
                 *
                 * Parameters:
                 * processIdentifier - {String} Identifier of the process to execute.
                 * popupRequest - {Boolean} Tells if the request should be shown to
                 *     the user.
                 * targetSuccessFunction - {Function} Function, which is called after
                 *     a successful Execute query.
                 * targetFailureFunction - {Function} Function, which is called after
                 *     an unsuccessful Execute query.
                 * responseHandlindObject - {WOC.WPSExecution} An object presenting and
                 *     managing the execution.
                 */
                this.executeGET = function(processIdentifier, inputsData,
                                targetSuccessFunction, targetFailureFunction,
                                responseHandlindObject) {
                        var params = "?service=" + WOC.WPSService.SERVICE;
                        params += "&request=Execute";
                        params += "&version=" + version;
                        // params += "&Language=en-US
                        params += "&Identifier=" + processIdentifier;
                        // DataInputs
                        params += "&DataInputs=" + inputsData;
                        // We always use the ResponseDocument!
                        if(processes[processIdentifier].outputs.length > 0) {
                                params += "&ResponseDocument=";
                                var outputs = processes[processIdentifier].getOutputs();
                                if(outputs.length > 0) {
                                        params += outputs[0].getIdentifier();
                                }
                                for(var i=1; i<outputs.length; i++) {
                                        params += ";" + outputs[i].getIdentifier();
                                }
                        }
                        // Storing is also always false as well as lineage!
                        params += "&storeExecuteResponse=\"false\"&lineage=\"false\"";
                        // Status is queried if possible!
                        if(processes[processIdentifier].isStatusSupported()) {
                                params += "&status=\"true\"";
                        } else {
                                params += "&status=\"false\"";
                        }

                        if(this.executeRequestTextArea != null) {
                                this.executeRequestTextArea.text = url + params;
                        }
                        OpenLayers.loadURL(url + params, '', responseHandlindObject,
                                        targetSuccessFunction, targetFailureFunction);
                }

                /**
                 * Method: popupExecuteRequest
                 *     Shows the Execute operations request to the user.
                 *
                 * Parameters:
                 * requestString - {String} An XML string containing the reguest.
                 */
                this.popupExecuteRequest = function(requestString) {
                        var documentRoot = (new DOMParser()).parseFromString(
                                        requestString.replace(/&/g,"&amp;"),
                                        "text/xml");//.replace(/=/g,"%3D");
                        WOC.popupXML("WPS Execute-operation request",
                                        [documentRoot.documentElement]);
                }

                /**
                 * Method: getProcess
                 *     Returns the process with the given identifier, if such exists.
                 *
                 * Parameters:
                 * identifier - {String} Identifier of the process.
                 *
                 * Returns:
                 * {WOC.WPSProcess}
                 */
                this.getProcess = function(identifier) {
                        return processes[identifier];
                }

                /**
                 * Method: getProcesses
                 *     Returns all processes of the service.
                 *
                 * Returns:
                 * {HashTable of WOC.WPSProcess objects}
                 */
                this.getProcesses = function() {
                        return processes;
                }

                /**
                 * Method: getProcessCount
                 *     Returns Number of processes found in the service.
                 *
                 * Returns:
                 * {Integer} Number of processes.
                 */
                this.getProcessCount = function() {
                        var count=0;
                        for(var processKey in processes) {
                                count++;
                        }
                        return count;
                }

                /**
                 * Method: getTitle
                 *     Returns the title of the service.
                 *
                 * Returns:
                 * {String}
                 */
                this.getTitle = function() {
                        return metadata.getTitle();
                }

                /**
                 * Method: getAbstract
                 *     Returns the abstract of the object.
                 *
                 * Returns:
                 * {String}
                 */
                this.getAbstract = function() {
                        return metadata.getAbstract();
                }

                /**
                 * Method: executeResponseHandling
                 *     Forwards an execute response handling request to the client.
                 */
                this.executeResponseHandling = function(process, outputs) {
                        client.executeResponseHandling(process, outputs);
                }
        },

        /**
         * Function: sleep
         *     Sleeping some milliseconds.
         *
         * Parameters:
         * sleepingMSeconds - {Integer} Millisecond to sleep.
         */
        sleep:function(sleepingMSeconds) {
                var sleeping = true;
                var startingMSeconds = new Date().getTime();
                while(sleeping) {
                         var currentMSeconds = new Date().getTime();
                         if((currentMSeconds - startingMSeconds) > sleepingMSeconds) {
                                 sleeping = false;
                         }
                }
        },

        /**
         * Fuction: isSupportedVersion
         *     Compares the given version with the supported ones.
         *
         * Parameters:
         * version - {String} Some version of the service.
         *
         * Returns:
         * {Boolean} True if the version is supported, else false.
         */
        isSupportedVersion:function(version) {
                for(var i=0; i<WOC.WPSService.SUPPORTED_VERSIONS.length; i++) {
                        if(WOC.WPSService.SUPPORTED_VERSIONS[i] == version) {
                                return true;
                        }
                }
                return false;
        },

        /**
         * Function: checkResponseVersionServiceLang
         *     Checks that the given node includes a version and language.
         *
         * Parameters:
         * node - {DOMElement}
         *
         * Throws:
         * {WrongOrMissingVersionException}
         * {WrongOrMissingServiceException}
         * {WrongOrMissingLangException}
         */
        checkResponseVersionServiceLang:function(node) {
                // Check service!
                if(!node.hasAttribute('service')) {
                        throw 'WrongOrMissingServiceEx';
                }

                if(node.attributes.getNamedItem('service').nodeValue !=
                                WOC.WPSService.SERVICE) {
                        throw 'WrongOrMissingServiceEx';
                }

                // Check version!
                if(!node.hasAttribute('version')) {
                        throw 'WrongOrMissingVersionEx';
                }

                if(!this.isSupportedVersion(
                                node.attributes.getNamedItem('version').nodeValue)) {
                        throw 'WrongOrMissingVersionEx';
                }

                // Check language! Note we use here the xml prefix!
                if(!node.hasAttribute('lang') && !node.hasAttribute('xml:lang')) {
                        throw 'WrongOrMissingLangEx';
                }
        },

/*
        getDOMElements:function(node, elementName, namespace) {
            var list = node.getElementsByTagName(elt);
            return (list.length) ? list : node.getElementsByTagNameNS("*", elt);
        },
*/

/*
                 * Checks if there are exceptions and informs the user of those!
                 * @returns True if no exceptions have arised, else false!
                 */
                 /*
                this.checkExceptions = function() {
                        if(exceptions.length > 0) {
                                // Something bad happened!
                                var exceptionReport = "An exception occured while performing the GetCapabilities-operation.";
                                for(var i=0; i<exceptions.length; i++) {
                                        exceptionReport += "Exception code: " + exceptions[i].code + "\n";
                                        exceptionReport += "Exception text: " + exceptions[i].text + "\n\n";
                                }
                                alert(exceptionReport);
                                // Clear the exceptions!
                                exceptions = [];
                                return false;
                        }
                        return true;
                }
                */

                /**
                * Checks if there are warnings and informs the user of those!
                * @returns True if no warnings have arised, else false!
                */
                /*
                this.checkWarnings = function() {
                        if(warnings.length > 0) {
                                // Something was not totally correct!
                                var warningsReport = "An exception occured while performing the GetCapabilities-operation.\n\n";
                                for(var i=0; i<warnings.length; i++) {
                                        exceptionReport += "Exception code: " + warnings[i].code + "\n";
                                        exceptionReport += "Exception text: " + warnings[i].text + "\n\n";
                                }
                                alert(warningsReport);
                                // Clear the warnings!
                                warnings = [];
                                return false;
                        }
                        return true;
                }
                */
                        /**
        * @private
        * @param {String} dateTime
        * @returns
        */
/*
        differenceInSecondsFromCurrentTime:function(dateTime) {
                var currentTime = new Date();
                var otherTime = new Date();
                var differenceInMilliseconds = 0;
                if(dateTime.charAt(0) == '-') {
                        // Error! Time can't be negative.



                }
                // DateTime is expressed in the format
                // [-][Y*]YYYY-MM-DDThh:mm:ss[.s[s*]][TZD].
                var datePart = dateTime.split('T')[0];
                var timePart = dateTime.split('T')[1];
                otherTime.setYear(datePart.split('-')[0]);
                otherTime.setMonth(datePart.split('-')[1]);
                otherTime.setDate(datePart.split('-')[2]);
                otherTime.setHours(timePart.split(':')[0]);
                otherTime.setMinutes(timePart.split(':')[1]);
                otherTime.setSeconds(timePart.split(':')[2].substring(0,2));
                var timezone = 0;
                if(timePart.split('-').length > 1) {
                        timezone = timePart.split('-')[1];
                } else if(timePart.split('+').length > 1) {
                        timezone = timePart.split('+')[1];
                }
                // Take the possible timezone into account!
                // First convert to the time milliseconds
                var utcTime = otherTime.getTime() - (timezone * 3600000);
                otherTime = new Date(utcTime);
                return (currentTime.getTime() - otherTime.getTime())/1000;
        },
*/

/*
                this.getExceptions = function() {
                        return exceptions;
                }

                this.getWarnings = function() {
                        return warnings;
                }
*/

        CLASS_NAME:"WOC.WPSService"
});

/**
 * @final
 * Constant for the supported WPS specification versions.
 * @type Array
 */
WOC.WPSService.SUPPORTED_VERSIONS = ["1.0.0"];

/**
 * @final {string} SERVICE Constant service name.
 * @type String
 */
WOC.WPSService.SERVICE = "WPS";
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.WPSProcess
 *     Handles a single WPS process logic.
 *
 * Inherits from:
 *     <WOC.IdentifiedObject>
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.WPSProcess = OpenLayers.Class(WOC.IdentifiedObject, {
        /**
    * Constructor: WOC.WPSProcess
    */
        initialize:function() {
                WOC.IdentifiedObject.prototype.initialize.apply(this);
                /**
                * Variable: processVersion
                * {String} Release version of this Process.
                *
                * Included when a process version needs to be included for
                *     clarification about the process to be used.
                *
                * It is possible that a WPS supports a process with different
                *     versions due to reasons such as modifications of process
                *     algorithms.
                *
                * Note:
                * This is the version identifier for the process, not the
                *     version of the WPS interface.
                */
                var processVersion = "";


                // var metadata = new WOC.OWSMetadata();
                // var profile = ""; // URN
                // var WSDL = null; // WSDL type

                // Additional attributes
                /**
                * Variable: executions
                * {Array{WOC.WPSExecution}} Executions of this process.
                */
                var executions = new Array();
                /**
                * Variable: storeSupported
                * {Boolean} True if the process can store the complex data results,
                *     else false.
                *
                * The value is gotten from the GetDescription-operation's response.
                *
                * If true, the Execute operation request may include the "asReference"
                *     as "true" for any complex output.
                */
                var storeSupported = false;
                /**
                * Variable: statusSupported
                * {Boolean} True if the process can inform of it's status, else false.
                *     The value is gotten from the GetDescription-operation's
                *     response.
                */
                var statusSupported = false;
                /**
                * Variable: inputs
                * {HashTable{WOC.WPSInputData}} All inputs of this process.
                *
                * The key is the input's identifier. The values are gotten from the
                *     GetDescription-operation's response.
                *
                * Note:
                *     Inputs may be identified when all the inputs are predetermined
                *     fixed resources. In this case, those resources shall be
                *     identified in the ows:Abstract element that describes the process.
                */
                var inputs = new Array();
                /**
                * @author: Raphael Rupprecht
                *
                * Idee: hier werden die Schemas eingefügt, ist es leer bei einem Prozess,
                * scheint dieser kein ComplexData zu unterstützen.
                */
                var schemaInputs = new Array();
                /*
                * @author: Raphael Rupprecht
                * Variable: isClientSupported
                * {Boolean}
                *
                * This boolean is true, when the process's inputs are literal and/or ComplexData=GML
                * The set variable that follows indicates if the this variable was set already
                */
                var isClientSupported = false;
                var isClientSupportedSet = false;

                /**
                * Variable: inputs
                * {HashTable{WOC.WPSOutputData}} All outputs of this process.
                *     The key is the output's identifier.
                *     The values are gotten from the GetDescription-operation's
                *     response.
                */
                var outputs = new Array();

                /**
                * Method: parseCapabilitiesNode
                *     Parses from a GetCapabilities-operation's response data.
                *
                * Parameters:
                * node - {DOMElement} Node having the process data.
                *
                * Returns:
                * {Array} All occured warnings. The array is empty if none occured.
                */
                this.parseCapabilitiesNode = function(node) {
                        // Storing the title, identifier and abstract.
                        this.parseIdentificationNode(node);
                        // Store the metadata

                        // Set process' version.
                        if(node.hasAttribute('processVersion')) {
                                processVersion =
                                                node.attributes.getNamedItem(
                                                'processVersion').nodeValue;
                        } else {
                                processVersion = "Unknown";
                        }
                }

                /**
                * Method: parseCapabilitiesNode
                *     Parses from a GetCapabilities-operation's response data.
                * RR13
                * Parameters:
                * node - {DOMElement} Node having the process data.
                *
                * Throws:
                * {AttributeMissingEx}
                * {ElementMissingEx}
                */
                this.parseDescriptionNode = function(node) {
                        //alert(node.childNodes[1].innerText);
                        // StoreSupported and StatusSupported. Defaut for both is 'false'!
                        if(node.hasAttribute('storeSupported')) {
                                storeSupported = node.attributes.getNamedItem(
                                                'storeSupported').nodeValue;
                        }
                        if(node.hasAttribute('statusSupported')) {
                                statusSupported = node.attributes.getNamedItem(
                                                'statusSupported').nodeValue;
                        }
                        var abstractNodes = WOC.getElementsByTagNameNS(
                                node, WOC.OWS_NAMESPACE, 
                                WOC.OWS_PREFIX, 'Abstract');
		                if(abstractNodes.length > 0 && abstractNodes[0].hasChildNodes()) {
	                        this.setAbstract(abstractNodes[0].firstChild.nodeValue);
							$("#abstractDiv").html(abstractNodes[0].firstChild.nodeValue);
		                } else {
		                	$("#abstractDiv").html("No abstract was found.");
		                }
                        // Inputs (Optional)
                        var dataInputsNodes = WOC.getElementsByTagNameNS(node,
                                        WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'DataInputs');          // dataInputsNodes (einer)  // rr11
                        if(dataInputsNodes && dataInputsNodes.length > 0) {
                                var inputNodes = WOC.getElementsByTagNameNS(dataInputsNodes[0],    // rr12
                                                WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'Input');       // inputNodes bei SimpleBuffer zB 2 Stück:
                                //alert("INPUT COUNT: \n"+node.childNodes[1].innerText + " has " + inputNodes.length + " inputs.");
                                if(inputNodes && inputNodes.length > 0) {
                                        for(var i=0; i<inputNodes.length; i++) {                   // zB 2 siehe oben
                                                // Raphael Note: hier wird das describeProcess XML nach "DataInputs" und dann nach "Input"
                                                // durchsucht und in das input Array vom Typ WOC.WPSInputData geschrieben.
                                                var input = new WOC.WPSInputData();
                                                input.parseFromNode(inputNodes[i]);                // rr13
                                                inputs[input.getIdentifier()] = input;             // Assosoative array ;)    rr14

                                                // inputNodes[i].firstElementChild = ows:Identifier
                                                // inputNodes[i].nextSibling?...   = ows:Title
                                                // inputNodes[i].nextSibling?...   = ows:Abstract
                                                // inputNodes[i].lastElementChild  = LiteralData / ComplexData / BoundingBoxData

                                                var p = this.getIdentifier();
                                                //alert(p); // unklug weil es dann input x eine alert meldung pro proccess gibt(siehe anfang methode, da ist ein alternativer alert)

                                                var lastChild = inputNodes[i].lastElementChild.nodeName;  // LiteralData / ComplexData / BoundingBoxData
                                                //alert("(WPSProcess:1858)\n"+this.getIdentifier() + "\n "+i+" \n lastChild : " + lastChild);

                                                if(lastChild == "LiteralData")       // rr15
                                                {
                                                   // isClientSupported was not set yet
                                                   if(isClientSupportedSet == false)
                                                   {
                                                       isClientSupportedSet = true;
                                                       isClientSupported = true;
                                                   }
                                                   else
                                                   {
                                                      // else the var is true: it does not make sense to set a var true that is already true
                                                      // or the var is false: the var should not be set to true, when one input is false!
                                                   }
                                                }
                                                else if(lastChild == "ComplexData")
                                                {
                                                   // checking the mime type
                                                   var mimeType = inputNodes[i].lastElementChild.firstElementChild.firstElementChild.firstElementChild.innerText;
                                                   if(mimeType == "text/XML"||mimeType == "TEXT/xml"||mimeType == "text/xml")
                                                   {
                                                      // checking if there is a schema element
                                                      if(inputNodes[i].lastElementChild.firstElementChild.firstElementChild.lastElementChild.innerText)
                                                      {
                                                         // checking if the schema is gmlpacket.xsd or feature.xsd
                                                         // "http://geoserver.itc.nl:8080/wps/schemas/gml/2.1.2/gmlpacket.xsd"
                                                         var tmpSchema = inputNodes[i].lastElementChild.firstElementChild.firstElementChild.lastElementChild.innerText;
                                                         if(tmpSchema.match(/gmlpacket.xsd/) != null || tmpSchema.match(/feature.xsd/) != null)
                                                         {
                                                             // isClientSupported was not set yet
                                                             if(isClientSupportedSet == false)
                                                             {
                                                                 isClientSupportedSet = true;
                                                                 isClientSupported = true;
                                                             }
                                                             else
                                                             {
                                                                 // else the var is true: it does not make sense to set a var true that is already true
                                                                 // or the var is false: the var should not be set to true, when one input is false!
                                                             }
                                                         }
                                                         // schema not valid
                                                         else
                                                         {
                                                             // isClientSupported was not set yet
                                                             if(isClientSupportedSet == false)
                                                             {
                                                                 isClientSupportedSet = true;
                                                                 isClientSupported = false;
                                                             }
                                                             else if(isClientSupported)
                                                             {
                                                                 // one falsy input is enough to set false
                                                                 isClientSupportedSet = true;
                                                                 isClientSupported = false;
                                                             }
                                                             else
                                                             {
                                                                 // isClientSupported is already set to false
                                                             }
                                                         }
                                                      }
                                                      // no schema element found
                                                      else
                                                      {
                                                        // isClientSupported was not set yet
                                                        if(isClientSupportedSet == false)
                                                        {
                                                                 isClientSupportedSet = true;
                                                                 isClientSupported = false;
                                                        }
                                                        else if(isClientSupported)
                                                        {
                                                                 // one falsy input is enough to set false
                                                                 isClientSupportedSet = true;
                                                                 isClientSupported = false;
                                                        }
                                                        else
                                                        {
                                                                 // isClientSupported is already set to false
                                                        }
                                                      }
                                                   }
                                                   // mimeType == "text/XML" != "text/XML"
                                                   else
                                                   {
                                                        // isClientSupported was not set yet
                                                        if(isClientSupportedSet == false)
                                                        {
                                                                 isClientSupportedSet = true;
                                                                 isClientSupported = false;
                                                        }
                                                        else if(isClientSupported)
                                                        {
                                                                 // one falsy input is enough to set false
                                                                 isClientSupportedSet = true;
                                                                 isClientSupported = false;
                                                        }
                                                        else
                                                        {
                                                                 // isClientSupported is already set to false
                                                        }
                                                   }
                                                }
                                                else
                                                {
                                                     // isClientSupported was not set yet
                                                     if(isClientSupportedSet == false)
                                                     {
                                                         isClientSupportedSet = true;
                                                         isClientSupported = false;
                                                     }
                                                     else if(isClientSupported)
                                                     {
                                                         // one falsy input is enough to set false
                                                         isClientSupportedSet = true;
                                                         isClientSupported = false;
                                                     }
                                                     else
                                                     {
                                                         // isClientSupported is already set to false
                                                     }
                                                }

                                                //schemaInputs[i] = inputNodes[i].lastElementChild.firstElementChild.firstElementChild.lastElementChild.innerText;  // Raphaels schemaInputs Array
                                        }// ENDE schleife über die inputs
                                        //alert("isClientSupported: \n"+ "Process: "+node.childNodes[1].innerText +"\n"+"isClientSupported = " +isClientSupported);

                                        //alert("(WPSProcess:1858) input.complexData.schema: "+inputNodes[0].lastElementChild.firstElementChild.firstElementChild.lastElementChild.innerText);
                                        //document.getElementById("isSupported").innerHTML += p + ": isSupported: " + isClientSupported + "<br />";
                                }
                        }

                        // Outputs (Mandatory)
                        var processOutputsNodes = WOC.getElementsByTagNameNS(node,
                                        WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'ProcessOutputs');
                        var outputNodes = WOC.getElementsByTagNameNS(processOutputsNodes[0],
                                        WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'Output');
                        if(outputNodes && outputNodes.length > 0) {
                                for(var i=0; i<outputNodes.length; i++) {
                                        var output = new WOC.WPSOutputData();
                                        output.parseFromNode(outputNodes[i]);
                                        outputs[output.getIdentifier()] = output; // Assosoative array ;)
                                }
                        } else {
                                // TODO Handle error situation!
                                alert("2054:WPSProcess,Error getting process output nodes, or output nodes null!");
                        }
                }

                /**
                * Method: getProcessVersion
                *     Returns the version of the process.
                *
                * Returns:
                * {String} Version of the process.
                */
                this.getProcessVersion = function() {
                        return processVersion;
                }

                /**
                * Method: getInputs
                *     Returns the process' inputs.
                *
                * Returns:
                * {HashTable} An assosiative array of inputs, where the key is the
                *     input's name. In case of no inputs returns null.
                */
                this.getInputs = function() {
                        return inputs;
                }

                /**
                * Method: getInputsCount
                *     Returns the amount of inputs.
                *
                * Returns:
                * {Integer} The amount of inputs.
                */
                this.getInputsCount = function() {
                        var count = 0;
                        for(input in inputs) {
                                count++;
                        }
                        return count;
                }

                /**
                * @author: Raphael Rupprecht
                * Method: getisClientSupported
                *      Returns true when the process has LiteralData and/or ComplexData=GML as inputs
                *
                * Returns:
                * {Boolean}
                */
                this.getisClientSupported = function() {
                        return isClientSupported;
                }

                /**
                * Method: getOutputs
                *     Returns the process' outputs.
                *
                * Returns:
                * {HashTable} An assosiative array of outputs, where the key is the
                *     output's name. In case of no outputs returns null.
                */
                this.getOutputs = function() {
                        return outputs;
                }

                /**
                * Method: getOutputsCount
                *     Returns the amount of outputs.
                *
                * Returns:
                * {Integer} The amount of outputs.
                */
                this.getOutputsCount = function() {
                        var count = 0;
                        for(output in outputs) {
                                count++;
                        }
                        return count;
                }

                /**
                * Method: isStoreSupported
                *
                * Returns:
                * {Boolean} True if storing the process result is supported, else false.
                */
                this.isStoreSupported = function() {
                        return storeSupported;
                }

                /**
                * Method: isStatusSupported
                *
                * Returns:
                * {Boolean} True if the WPS service can send status information about
                * the process, else false.
                */
                this.isStatusSupported = function() {
                        return statusSupported;
                }

                /**
                * Method: getDataInputsXML
                *
                * Parameters:
                * {OpenLayers.Map}
                *
                * Returns:
                * {String} An XML string containing the wps:DataInputs element
                *
                * Throws:
                * {LayerNullEx} Thrown by complex data handling if the
                *     input layer is null.
                * {UnsupportedLayerTypeEx} Thrown if the layer type is
                *     unsupported.
                * {EmptyStringValueEx}
                * {Exception} In any other exceptional case.
                */
                this.getDataInputsXML = function(map) {
                        if(this.getInputsCount() == 0) {
                                return "";
                        }
                        var inputsXML = "<wps:DataInputs>";
                        for(var inputKey in inputs) {
                                inputsXML += inputs[inputKey].getInputXML(map);
                        }
                        return inputsXML + "</wps:DataInputs>";
                }
        },
        CLASS_NAME:"WOC.WPSProcess"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.WPSExecution
 *     Single WPS process execution.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.WPSExecution = OpenLayers.Class({
        /**
     * Constructor: WOC.IdentifiedObject
         *
         * Parameters:
         * service - {<WOC.WPSService>} The service instance which is supposed to 
         *     execute the requested process.
         * process - {<WOC.WPSProcess>} The process that should be executed.
         */
        initialize:function(service, process) {
                /**
                 * Variable: executionTime
                 * {Date} Time when the execution began.
                 */
                var executionTime = new Date();
                /**
                 * Variable: creationTime
                 * {String} Time when the latest status response was created.
                 */
                var creationTime = "";
                /**
                 * Variable: status
                 * {String} Status of the execution.
                 */
                var status = "Initialized";
                /**
                 * Variable: statusInfo
                 * {String} More info on the status.
                 */
                var statusInfo = "Request send";
                /**
                 * Variable: process
                 * {WOC.WPSProcess} The process that is being executed.
                 */
                var process = process;
                /**
                 * Variable: service
                 * {WOC.WPSProcess} The service instance which is supposed to execute 
                 * the requested process.
                 */
                var service = service;
                /**
                 * Variable: statusLocation
                 * {String} URL of the status document.
                 */
                var statusLocation = "";
                /**
                 * Variable: percentageCompleted
                 * {Double} How many percentage of the execution has been completed.
                 */
                var percentageCompleted = 0;
                /**
                 * Variable: popupResult
                 * {Boolean} Boolean telling if the result should be shown to the user.
                 *     The default value is 'false'.
                 */
                var popupResult = false;
                /**
                 * Variable: statusColor
                 * {String} Color of the status info. 
                 *     Should be 'red', 'yellow' or 'green'.
                 */
                var statusColor = 'green';
                /**
                 * Variable: executionTimeoutObject
                 * {Object} Object handling the timeout. 
                 *     Needed while quering for the status of the execution.
                 */
                var executionTimeoutObject = null;
                /**
                 * Variable: statusQueryCount
                 * {Integer} Number of queries made to get the status of the execution.
                */
                var statusQueryCount = 0;
                /**
                 * Variable: exceptionReport
                 * {DOMElement} The Exception report DOMElement from the response.
                 */
                var exceptionReport = null;
                /**
                 * Variable: statusTableRow
                 * {DOMElement} A table row where the progress of this execution is 
                 *     updated.
                 */
                var statusTableRow = document.createElement('tr');
                
                /**
                * Method: updateFromExecuteResponse
                *     Updating this objects status based on the Execute-operations
                *     response.
                *
                * Parameters:
                * executeResponse - {DOMElement} 
                */
                this.updateFromExecuteResponse = function(executeResponseDoc) {
                        var statusNode = WOC.getElementsByTagNameNS(
                                        executeResponseDoc, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'Status')[0];
                        creationTime = statusNode.attributes.getNamedItem(
                                        'creationTime').nodeValue;
                        var accepts = WOC.getElementsByTagNameNS(
                                        statusNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'ProcessAccepted');
                        var starts = WOC.getElementsByTagNameNS(
                                        statusNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'ProcessStarted');
                        var pauses = WOC.getElementsByTagNameNS(
                                        statusNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'ProcessPaused');
                        var succeeds = WOC.getElementsByTagNameNS(
                                        statusNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'ProcessSucceeded');
                        var failes = WOC.getElementsByTagNameNS(
                                        statusNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'ProcessFailed');
                        if(accepts && accepts.length > 0) {
                                status = 'ProcessAccepted';
                                statusColor = 'green';
                                statusInfo = accepts[0].firstChild.nodeValue;
                                percentageCompleted = 0;
                        } else if(starts && starts.length > 0) {
                                status = 'ProcessStarted';
                                statusColor = 'green';
                                statusInfo = starts[0].firstChild.nodeValue;
                                if(starts[0].hasAttribute('percentComplited')) {
                                        percentageCompleted = starts[0].attributes.getNamedItem(
                                                        'percentComplited').nodeValue;
                                }
                        } else if(pauses && pauses.length > 0) {
                                status = 'ProcessPaused';
                                statusColor = 'yellow';
                                statusInfo = pauses[0].firstChild.nodeValue;
                                if(pauses[0].hasAttribute('percentComplited')) {
                                        percentageCompleted = pauses[0].attributes.getNamedItem(
                                                        'percentComplited').nodeValue;
                                }
                        } else if(succeeds && succeeds.length > 0) {
                                status = 'ProcessSucceeded';
                                statusColor = 'green';
                                statusInfo = succeeds[0].firstChild.nodeValue;
                                percentageCompleted = 100;
                                var processOutputs = WOC.getElementsByTagNameNS(
                                                executeResponseDoc, WOC.WPS_NAMESPACE, 
                                                WOC.WPS_PREFIX, 'ProcessOutputs')[0];
                                service.executeResponseHandling(process, processOutputs);
                        } else if(failes != null && failes.length > 0) {
                                status = 'ProcessFailed';
                                statusColor = 'red';
                                statusInfo = failes[0].firstChild.nodeValue;
                        } else {
                                status = 'Unknown';
                                statusColor = 'yellow';
                                statusInfo = 'Unknown';
                        }
                        // Check fot the status location.
                        if(executeResponseDoc.hasAttribute('statusLocation')) {
                                statusLocation = executeResponseDoc.attributes.getNamedItem(
                                                'statusLocation').nodeValue;
                        }
                        if(status == 'ProcessAccepted' || status == 'ProcessStarted' ||
                                        status == 'ProcessPaused') {
                                if(!succeeds && statusQueryCount == 
                                                WOC.WPSExecution.MAXIMUM_STATUS_QUERIES) {
                                        status = "Timed out";
                                        statusColor = 'red'
                                        statusInfo = "The response was cancelled after " + 
                                                        WOC.WPSExecution.MAXIMUM_STATUS_QUERIES +
                                                        " status queries.";
                                                        executionTimeoutObject = null;
                                } else if(!executionTimeoutObject) {
                                        executionTimeoutObject = setTimeout(
                                                        OpenLayers.Function.bind(
                                                                        this.queryExecutionStatusPOST, this), 
                                                                        WOC.WPSExecution.TIMEOUT_MS);
                                }
                        }
                        this.updateTableRow();
                }
                
                /**
                 * Method: getExecutionTime
                 *     Returns the time when the process Execution request was send.
                 * 
                 * Returns:
                 * {Date}
                 */
                this.getExecutionTime = function() {
                        return executionTime;
                }
                
                /**
                 * Method: getCreationTime
                 *     Returns the time when the latest status report arrived.
                 * 
                 * Returns:
                 * {Date}
                 */
                this.getCreationTime = function() {
                        return executionTime;
                }
                
                /**
                 * Method: getStatus
                 *    Returns the current status of the execution.
                 * 
                 * Returns:
                 * {String}
                 */
                this.getStatus = function() {
                        return status;
                }
                
                /**
                 * Method: getStatusInfo
                 *     Returns info on the status, like what the status response 
                 *     message contained.
                 * 
                 * Returns:
                 * {String}
                 */
                this.getStatusInfo = function() {
                        return statusInfo;
                }

                /**
                 * Method: getStatusLocation
                 *     Returns the location (URL) of the status document.
                 * 
                 * Returns:
                 * {String}
                 */
                this.getStatusLocation = function() {
                        return statusLocation;
                }
                
                /**
                 * Method: getPercentageCompleted
                 *     Returns the precentage telling how much of the execution has 
                 *     already succeeded.
                 * 
                 * Returns:
                 * {Integer}
                 */
                this.getPercentageCompleted = function() {
                        return percentageCompleted;
                }
                
                /**
                 * Method: getStatusTableRow
                 *     Returns a table row containing status information on the 
                 *     execution.
                 * 
                 * Returns:
                 * {DOMElement}
                 */
                this.getStatusTableRow = function() {
                        return statusTableRow;
                }
                
                /**
                * Method: updateTableRow
                *     Updates this elements table row based on this elements status.
                */
                this.updateTableRow = function() {
                        // Removing old elements
                        while(statusTableRow.hasChildNodes()) {
                                statusTableRow.removeChild(statusTableRow.childNodes.item(0));
                        }
                        // Service title
                        var serviceTitleTD = document.createElement('td');
                        serviceTitleTD.appendChild(document.createTextNode(
                                        service.getTitle()));
                        statusTableRow.appendChild(serviceTitleTD);
                        // Process title
                        var processTitleTD = document.createElement('td');
                        processTitleTD.appendChild(document.createTextNode(
                                        process.getTitle()));
                        statusTableRow.appendChild(processTitleTD);
                        // Status
                        var statusDataElem = document.createElement('td');
                        statusDataElem.appendChild(document.createTextNode(status));
                        statusDataElem.style.color = statusColor;
                        statusTableRow.appendChild(statusDataElem);
                        // Percentage complited
                        var percentageDataElem = document.createElement('td');
                        percentageDataElem.appendChild(document.createTextNode(
                                percentageCompleted + '%'));
                        statusTableRow.appendChild(percentageDataElem);
                        // StatusInfo
                        var statusInfoDataElem = document.createElement('td');
                        if(exceptionReport) {
                                var button = document.createElement('input');
                                button.type = 'button';
                                button.report = exceptionReport;
                                button.value = 'Exception report';
                                OpenLayers.Event.observe(button, "click", 
                                    OpenLayers.Function.bindAsEventListener(
                                                                this.exceptionReportButtonClick, button));
                                statusInfoDataElem.appendChild(button);
                        } else {
                                statusInfoDataElem.appendChild(document.createTextNode(statusInfo));
                                statusInfoDataElem.style.color = statusColor;
                        }
                        statusTableRow.appendChild(statusInfoDataElem);
                }
                
                /**
                * Method: queryExecutionStatusPOST
                *     Queries the Execute-operation's status.
                */
                this.queryExecutionStatusPOST = function() {
                        if(status != 'ProcessSucceeded' && status != 'ProcessFailed' 
                                        && status != '') {
                                if(popupResult) {
                                        OpenLayers.loadURL(statusLocation, 
                                                '', this, this.executePopupSuccess, this, 
                                                this.executeFailure, this);
                                } else {
                                        OpenLayers.loadURL(statusLocation, 
                                                '', this, this.executeSuccess, this, 
                                                this.executeFailure, this);
                                }
                        }
                        // this.executionTimeoutObject.clearTimeout();
                        executionTimeoutObject = null;
                }
                
                /**
                * Method: executeSuccess
                *     Handles a successful Execute-operation response.
                *
                * Parameters:
                * response - {} 
                */
                this.executeSuccess = function(response) {
                        if(!response || typeof response=='undefined') {
                                alert("response was undefined!" + response);
                                return;
                        }
                        var xmlDoc = WOC.getDomDocumentFromResponse(response);
                        if(xmlDoc) {
                                var exceptionReportNode = WOC.getElementsByTagNameNS(
                                                xmlDoc, WOC.OWS_NAMESPACE, WOC.OWS_PREFIX, 
                                                'ExceptionReport');
                                if(exceptionReportNode && exceptionReportNode.length > 0) {
                                        exceptionReport = exceptionReportNode[0];
                                        status = "ProcessFailed";
                                        statusInfo = "";
                                        statusColor = 'red';
                                        this.updateTableRow();
                                        return;
                                }
                                var executeResponseDocNodes = WOC.getElementsByTagNameNS(
                                                xmlDoc, WOC.WPS_NAMESPACE, 
                                                WOC.WPS_PREFIX, 'ExecuteResponse');
                                if(executeResponseDocNodes && executeResponseDocNodes.length > 0) {
                                        var responseDoc = executeResponseDocNodes[0];
                                        try {
                                                service.checkResponseVersionServiceLang(responseDoc);
                                        } catch(e) {
                                                status = "Exception occured";
                                                statusColor = 'red';
                                                if(e == 'WrongOrMissingVersionEx') {
                                                        statusInfo = "Service version was wrong or not " +
                                                                "found in the WPS Execute-operation response!";
                                                } else if(e == 'WrongOrMissingServiceEx') {
                                                        statusInfo = "Service name was wrong or not " +
                                                                "found in the WPS Execute-operation response!";
                                                } else if(e == 'WrongOrMissingLangExc') {
                                                        statusInfo = "Service language was wrong or not " +
                                                                "found in the WPS Execute-operation response!";
                                                } else {
                                                        alert("Exception occured: " + e);
                                                        WOC.popupXML("Exception occured", 
                                                                        [responseDoc]);
                                                        statusInfo = "";
                                                }
                                                this.updateTableRow();
                                                return;
                                        }
                                        this.updateFromExecuteResponse(responseDoc);
                                } else {
                                        WOC.popupXML("Unexpected Execute-operation response!", 
                                                xmlDoc);
                                }
                        }
                }
                
                /**
                * Method: executePopupSuccess
                *    Popups up the Execute-operation's response before forwarding
                *    it to the actual handling of the response.
                * 
                * Parameters:
                * response - {} 
                */
                this.executePopupSuccess = function(response) {
                        var documentRoot = WOC.getDomDocumentFromResponse(response);
                        if(documentRoot) {
                                WOC.popupXML("WPS Execute-operation response", 
                                                [documentRoot]);
                        }
                        this.executeSuccess(response);
                }
                
                /**
                * Method: executeFailure
                *     Handles an unsuccessful Execute-operation response.
                *
                * Parameters:
                * response - {}
                */
                this.executeFailure = function(response) {
                        if (response.responseText.indexOf('no results') == -1 &&
                                        response.readyState==4) {
                                status = "Failed!";
                                statusInfo = "Server returned a failure message";
                                statusColor = 'red';
                        }
                }
                
                this.exceptionReportButtonClick = function() {
                        WOC.popupXML("WPS Execute-operation exception report", 
                                        [this.report]);
                }
        },
        CLASS_NAME:"WOC.WPSService"
});

/**
 * Constant: WOC.WPSExecution.TIMEOUT_MS
 *     The milliseconds to wait before a new status request is send!
 * {type} Integer
 */
WOC.WPSExecution.TIMEOUT_MS = 5000;

/**
 * Constant: WOC.WPSExecution.MAXIMUM_STATUS_QUERIES
 *     The maximum amount of queries made to the WPS service to update
 *     the status before the execution can be seen as failed (as it takes too long).
 * {type} Integer
 */
WOC.WPSExecution.MAXIMUM_STATUS_QUERIES = 20;
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.IdentifiedObject
 *     Stores the identification data of object. The data includes the 
 *     identifier, title and abstract of the object.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.IdentifiedObject = OpenLayers.Class({
        /**
     * Constructor: WOC.IdentifiedObject
         */
        initialize: function() {
                /**
                 * Variable: identifier
                 * {String} The identifier of the object.
                 *     Mandatory, ows:CodeType.
                 */
                var identifier = "";
                /**
                 * Variable: title
                 * {String} The title of the object.
                 *     Mandatory.
                 */
                var title = "";
                /**
                 * Variable: abst
                 * {String} Abstract of the object.
                 *     Optional.
                 */
                var abst = "";
                
                /**
                * Method: parseIdentificationNode
                *     Parses the Identifier, Title and Abstract from the given node.
                *
                * Parameters:
                * node - {DOMElement} The child nodes of this have to include a single 
                *     Identifier element and optionally an Title and an Abstract element.
                */
                this.parseIdentificationNode = function(node) {
                        // Identifier
                        identifier = WOC.getElementsByTagNameNS(
                                        node, WOC.OWS_NAMESPACE, 
                                        WOC.OWS_PREFIX, 'Identifier')[0].firstChild.nodeValue;
                        // Title
                        var titleNodes = WOC.getElementsByTagNameNS(
                                        node, WOC.OWS_NAMESPACE, 
                                        WOC.OWS_PREFIX, 'Title');
                        if(titleNodes.length > 0 && titleNodes[0].hasChildNodes()) {
                                title = titleNodes[0].firstChild.nodeValue;
                        }
                        // Abstract
                        var abstractNodes = WOC.getElementsByTagNameNS(
                                        node, WOC.OWS_NAMESPACE, 
                                        WOC.OWS_PREFIX, 'Abstract');
                        if(abstractNodes.length > 0 && abstractNodes[0].hasChildNodes()) {
                                abst = abstractNodes[0].firstChild.nodeValue;
                        }
                }
                
                /**
                 * Method: getIdentifier
                 *     Returns the identifier of the object.
                 * 
                 * Returns:
                 * {String}
                 */
                this.getIdentifier = function() {
                        return identifier;
                }
                
                /**
                 * Method: getTitle
                 *     Returns the title of the object.
                 * 
                 * Returns:
                 * {String}
                 */
                this.getTitle = function() {
                        return title;
                }
                
                /**
                 * Method: getAbstract
                 *     Returns the abstract of the object.
                 * 
                 * Returns:
                 * {String}
                 */
                this.getAbstract = function() {
                        return abst;
                }
                
                this.setAbstract = function(abs){
                	this.abst = abs;
                }
        },
        CLASS_NAME:"WOC.IdentifiedObject"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.OWServiceIdentification
 *     Implements storing of the OWS service identification. 
 *     For more detail on the identification data see OGC 06-121r3, p.25-28
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.OWServiceIdentification = OpenLayers.Class({
        /**
     * Constructor: WOC.OWServiceIdentification
         */
        initialize:function() {
                /**
                * Variable: title
                * {String} The title of the OWS service.
                *     Mandatory.
                */
                var title = "";
                /**
                * Variable: serviceType
                * {String} The type of the OWS service.
                *     Mandatory.
                */
                var serviceType = "";
                /**
                * Variable: serviceTypeVersion
                * {String} The version of the OWS service's type.
                *     Mandatory.
                */
                var serviceTypeVersion = "";
                /**
                * Variable: abst
                * {String} The OWS service's abstract.
                *     Optional.
                */
                var abst = "";
                // var keywords = new Array();
                // var fees = "";
                // var accessConsraints = "";
                
                /**
                 * Method: parseFromNode
                 *     Parses the OWS identification data from the given node.
                 *
                 * Parameters: 
                 * node - {DOMElement} Node having the having the OWS identification 
                 * data.
                 */
                this.parseFromNode = function(node) {
                        title = WOC.getElementsByTagNameNS(
                                        node, WOC.OWS_NAMESPACE, WOC.OWS_PREFIX, 
                                        'Title')[0].firstChild.nodeValue;
                        serviceType = WOC.getElementsByTagNameNS(
                                        node, WOC.OWS_NAMESPACE, WOC.OWS_PREFIX, 
                                        'ServiceType')[0].firstChild.nodeValue;
                        serviceTypeVersion = WOC.getElementsByTagNameNS(
                                        node, WOC.OWS_NAMESPACE, 
                                        WOC.OWS_PREFIX, 
                                        'ServiceTypeVersion')[0].firstChild.nodeValue;
                        var abstNodes = WOC.getElementsByTagNameNS(
                                        node, WOC.OWS_NAMESPACE, 
                                        WOC.OWS_PREFIX, 
                                        'Abstract');
                        if(abstNodes && abstNodes.length > 0) {
                                abst = abstNodes[0].firstChild.nodeValue;
                        }
                }
                
                /**
                 * Method: getTitle
                 *     Returns the title of the service.
                 * 
                 * Returns:
                 * {String}
                 */
                this.getTitle = function() {
                        return title;
                }
                
                /**
                 * Method: getServiceType
                 *     Returns the abstract of the object.
                 * 
                 * Returns:
                 * {String}
                 */
                this.getServiceType = function() {
                        return serviceType;
                }
                                
                /**
                 * Method: getServiceTypeVersion
                 *     Returns the type version of the service.
                 * 
                 * Returns:
                 * {String}
                 */
                this.getServiceTypeVersion = function() {
                        return serviceTypeVersion;
                }
                                
                /**
                 * Method: getAbstract
                 *     Returns the abstract of the service.
                 * 
                 * Returns:
                 * {String}
                 */
                this.getAbstract = function() {
                        return abst;
                }
        },
        CLASS_NAME:"WOC.OWServiceIdentification"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/
 
/**
 * @class
 * @author Janne Kovanen, Finnish Geodetic Institute
 */
WOC.OWSRequestBase = OpenLayers.Class({
        /**
        * @constructor
        */
        initialize:function() {
                // Mandatory parameters
                var service = "";
                var request = "";
                var version = "";
        },
        
        /**
        * @param {Node} node The having the OWS identification data.
        */
        parseFromNode:function(node) {
                title = WOC.getElementsByTagNameNS(
                                node, WOC.OWS_NAMESPACE, WOC.OWS_PREFIX, 
                                'Title')[0].firstChild.nodeValue;
                serviceType = WOC.getElementsByTagNameNS(
                                node, WOC.OWS_NAMESPACE, WOC.OWS_PREFIX, 
                                'ServiceType')[0].firstChild.nodeValue;
                serviceTypeVersion = WOC.getElementsByTagNameNS(
                                node, WOC.OWS_NAMESPACE, WOC.OWS_PREFIX, 
                                'ServiceTypeVersion')[0].firstChild.nodeValue;
                var absts = WOC.getElementsByTagNameNS(
                                node, WOC.OWS_NAMESPACE, WOC.OWS_PREFIX, 
                                'Abstract');
                if(abst != null && abst.length > 0) {
                        abst = absts[0].firstChild.nodeValue;
                }
                // server.serviceType = serviceIdentification.getElementsByTagName("ServiceType").nodeValue;
                // server.serviceTypeVersion = serviceIdentification.getElementsByTagName("ServiceTypeVersion").nodeValue;
        },
        CLASS_NAME:"WOC.OWServiceIdentification"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/
/**
 * Class: WOC.WPSClient
 *     This is the WPS Client control for OpenLayers.
 *
 * Inherits from:
 *     <OpenLayers.Control>
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 *
 * Updated:
 *    26.09.2008 - Settings - Possibility to select a method.
 */
WOC.WPSClient = OpenLayers.Class(OpenLayers.Control, {
        /**
     * Property: activeColor
         * {String} Color used in the control's background.
     */
        activeColor:"#63C4E4",     // darkblue
        /**
     * Property: wpsServiceContainer
         * {WOC.WPSServiceContainer} Container for the WPS service instances.
     */
        wpsServiceContainer:null,

        /**
     * Property: wpsDiv
         * {DOMElement}
     */
        wpsDiv:null,

        /**
     * Property: processesDiv
         * {DOMElement} The element contains a label and all process offerings.
     */
        processesDiv:null,

        /**
     * Property: processDiv
         * {DOMElement} The element contains a label and all inputs of a process.
     */
        processDiv:null,

        /**
        * Property: processInputsDiv
        * {DOMElement}
        */
        processInputsDiv:null,

        /**
     * Property: wpsProcessResultDiv
         * {DOMElement} The div is used for literal output.
     */
        wpsProcessResultDiv:null,

        /**
     * Property: wpsProcessResultDiv
         * {DOMElement} The div is used to show the running processes.
     */
        wpsRunningProcessesDiv:null,

        /**
     * Property: literalOutputTable
         * {DOMElement} The table is used to show the literal output.
     */
        literalOutputTable:null,

    /**
     * Property: minimizeDiv
         * {DOMElement} Div containing the image that is used to minimize the
         *     WPS client control.
     */
    minimizeDiv:null,

    /**
     * Property: maximizeDiv
         * {DOMElement} Div containing the image that is used to maximize the
         *     WPS client control.
     */
    maximizeDiv:null,

        /**
     * Property: infoTextNode
         * {DOMElement}
     */
        infoTextNode:null,

        /**
     * Property: infoTextFont
         * {DOMElement}
     */
        infoTextFont:null,

        /**
     * Property: serviceTextField
         * {DOMElement}
     */
        serviceTextField:null,

        /**
     * Property: serviceList
         * {DOMElement}
     */
        serviceList:null,

        /**
     * Property: processSelection
         * {DOMElement}
     */
        processSelection:null,

        /**
        * Property: processResultLayer
        * {Array of OpenLayers.Layer} The layers where the reults are shown.
        * RRR0: the processResultLayer is an array now (see the constructor initialize())
        */
        processResultLayer:null,

        /**
        * Property: getCapabilitiesMethod
        * {String} The method used for the GetCapabilities-operation.
        */
        getCapabilitiesMethod:"GET",

        /**
        * Property: describeProcessMethod
        * {String} The method used for the DescribeProcess-operation.
        */
        describeProcessMethod:"GET",

        /**
        * Property: executeMethod
        * {String} The method used for the Execute-operation.
        */
        executeMethod:"POST",

        /**
        * Property: runningExecutionsDiv
        * {DOMElement} A div containing information on the running process
        *     executions.
        */
        runningExecutionsDiv:null,

        /**
        * Property: wpsSettingsDiv
        * {DOMElement} A div having some settings for the requests.
        *     The settings includes method alternatives
        *         GET with KVP encoding
        *         POST with XML encoding
        *         SOAP
        */
        wpsSettingsDiv:null,

    isMouseDown:false,

        /**
         *
     * Constructor: WOC.WPSClient
     *
     * Parameters:
         * {Object} options
     */
    initialize:function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
                this.wpsServiceContainer = new WOC.WPSServiceContainer();
                this.processResultLayer = new Array();
    },

        /**
     * Method: Destroys the WPS client.
     */
    destroy:function() {
                OpenLayers.Event.stopObservingElement(this.div);
        OpenLayers.Event.stopObservingElement(this.minimizeDiv);
        OpenLayers.Event.stopObservingElement(this.maximizeDiv);
        //clear out layers info and unregister their events
        this.clearLayersArray("base");
        this.clearLayersArray("data");

        this.map.events.un({
            "addlayer": this.redraw,
            "changelayer": this.redraw,
            "removelayer": this.redraw,
            "changebaselayer": this.redraw,
            scope: this
        });
        OpenLayers.Control.prototype.destroy.apply(this, arguments);
    },

        /**
         * Method: setMap
     * Parameters:
         * {OpenLayers.Map} map
     */
    setMap:function(map) {
        OpenLayers.Control.prototype.setMap.apply(this, arguments);
        this.map.events.on({
            "addlayer": this.redraw,
            "changelayer": this.redraw,
            "removelayer": this.redraw,
            "changebaselayer": this.redraw,
            scope: this
        });
    },

        /**
     * Method: draw
         *
         * Returns:
         *     {DOMElement} A reference to the DIV DOMElement containing the client.
     */
    draw:function() {
        OpenLayers.Control.prototype.draw.apply(this);
        // Create layout divs.
        this.loadContents();
        // Set mode to minimize.
        if(!this.outsideViewport) {
            this.minimizeControl();
        }
        return this.div;
    },

    /**
     * Method: showControls
         *     Hide/Show all WPS Client controls depending on whether we are
     *     minimized or not
         *
     * Parameters:
         * {Boolean} minimize
     */
    showControls:function(minimize) {
        this.maximizeDiv.style.display = minimize ? "" : "none";
        this.minimizeDiv.style.display = minimize ? "none" : "";
        this.wpsDiv.style.display = minimize ? "none" : "";
    },

        /**
     * Method: maximizeControl
         *     Set up the labels and divs for the control
         *
     * Parameters:
         * {Event} event
     */
    maximizeControl:function(event) {
        this.div.style.width = "30em";
        this.div.style.height = "";
        this.showControls(false);
        if (event != null) {
            OpenLayers.Event.stop(event);
        }
    },

        /**
     * Method: minimizeControl
         *     Hide all the contents of the control, shrink the size, add the
         *     maximize icon
         *
     * Parameters:
         * {Event} event
     */
    minimizeControl:function(event) {
        this.div.style.width = "0px";
        this.div.style.height = "0px";
        this.showControls(true);
        if (event != null) {
            OpenLayers.Event.stop(event);
        }
    },

        /**
     * Method: loadContents
         *     Set up the labels and divs for the control.
     */
    loadContents:function() {
            // Ignoring some events!
            // OpenLayers.Event.observe(this.div, "click", this.ignoreEvent);
        OpenLayers.Event.observe(this.div, "mouseup", this.ignoreEvent);
        OpenLayers.Event.observe(this.div, "mousedown", this.ignoreEvent);
        OpenLayers.Event.observe(this.div, "dblclick", this.ignoreEvent);

        // Configure main div. // hier werden die styles der WPS-CLIENT DIV gesetzt!
                // this.div.style.styleClass = "div";
                with(this.div.style) {
                        position = "absolute";
                        top = "0px";
                        right = "";
                        left = "50px";
                        fontFamily = "sans-serif";
                        fontWeight = "bold";
                        marginTop = "3px";
                        marginLeft = "3px";
                        marginBottom = "3px";
                        fontSize = "smaller";
                        color = "white";
                        backgroundColor = "transparent";
                }
        // Configure the wps functionality list div.
        this.wpsDiv = document.createElement("div");
                this.wpsDiv.id = "wpsDiv";
        this.wpsDiv.style.backgroundColor = this.activeColor;
                // Info text field.
                this.infoTextNode = document.createTextNode("");
                this.infoFont = document.createElement("font");
                this.infoFont.className = 'infoText'
                this.infoFont.appendChild(this.infoTextNode);
                var wpsInfoLabel = document.createElement('label');
                wpsInfoLabel.appendChild(this.infoFont);

                this.processesDiv = this.getNewProcessesDiv();
                this.processDiv = this.getNewProcessDiv();
                this.runningExecutionsDiv = this.getNewExecutionsDiv();
                this.wpsSettingsDiv = this.getNewSettingsDiv();
                with(this.wpsDiv) {
                        appendChild(this.getNewServicesDiv());
                        appendChild(this.processesDiv);
                        appendChild(this.processDiv);
                        appendChild(this.getNewAbstractDiv());
                        appendChild(this.runningExecutionsDiv);
                        appendChild(this.wpsSettingsDiv);
                        appendChild(wpsInfoLabel);
                }
                this.div.appendChild(this.wpsDiv);
                // Rounding the control's corners.
        OpenLayers.Rico.Corner.round(this.div, {corners: "tr br",      /* tr br = right, tl bl = left*/
                        bgColor: "transparent", color: this.activeColor, blend: false});
        OpenLayers.Rico.Corner.changeOpacity(this.wpsDiv, 0.75);
        var imgLocation = OpenLayers.Util.getImagesLocation();
        var sz = new OpenLayers.Size(18,18);
        var szWPS = new OpenLayers.Size(40,18);

        // Maximize button div.
        var img = imgLocation + 'layer-switcher-maximize_WPS.png';
        this.maximizeDiv = OpenLayers.Util.createAlphaImageDiv(
                        "OpenLayers_Control_MaximizeDiv", new OpenLayers.Pixel(10,10), szWPS, img, "absolute");
                this.maximizeDiv.className = 'minMax';
        OpenLayers.Event.observe(this.maximizeDiv, "click",
                    OpenLayers.Function.bindAsEventListener(
                                                this.maximizeControl, this));
        this.div.appendChild(this.maximizeDiv);

        // Minimize button div.
        img = imgLocation + 'layer-switcher-minimize.png';
        this.minimizeDiv = OpenLayers.Util.createAlphaImageDiv(
                        "OpenLayers_Control_MinimizeDiv", null, sz, img, "absolute");
                this.minimizeDiv.className = 'minMax';
                this.minimizeDiv.style.display = "none";
        OpenLayers.Event.observe(this.minimizeDiv, "click",
                    OpenLayers.Function.bindAsEventListener(
                                                this.minimizeControl, this));
        this.div.appendChild(this.minimizeDiv);
                // Add initial services and their data!
                for(var i=0; i<WOC.WPSClient.INITIAL_SERVICES.length; i++) {
                        this.addService(WOC.WPSClient.INITIAL_SERVICES[i]);
                }
    },

        /**
        * Method: addService
        *     Adds a service with the given url to service container.
        *     Informs how the adding went.
        *
        * Parameters:
        * {String} url The service instance's URL.
        */
        addService:function(url) {
                try {
                        this.wpsServiceContainer.addService(url, this);
                        var option = document.createElement('option');
                        // The actual name (title) is later on read from the
                        // capabilities' ServiceIdentifier!
                        option.text = url;
                        option.value = url;
                        this.serviceList.appendChild(option);
                        // Select the first item if the list has only one item!
                        if(this.serviceList.childNodes.length == 1) {
                                this.serviceList.selectedIndex = 0;
                        }
                        // this.serviceTextField.value = url;
                } catch(exception) {
                        // Service instance could not be set
                        if(exception == 'ServiceExistsEx') {
                                this.updateInfoText("Could not add service. " +
                                                "The WPS service is already in the list!", "red");
                        } else if(exception == 'URLEx') {
                                this.updateInfoText("Could not add service. " +
                                                "The WPS service instance URL is not an accepted URL!",
                                                "red");
                        }
                        // this.serviceList.removeChild(option);
                }
        },

        /**
        * Method: removeService
        *     Removes a service with the given url from the service container.
        *
        * Parameters:
        * url - {String} The service instance's URL.
        */
        removeService:function(url) {
                // Remove from the actual services list.
                this.wpsServiceContainer.removeService(url, this);
                // Remove from the service list options.
                var childNodes = this.serviceList.childNodes;
                for(var i=0; i<childNodes.length; i++) {
                        if(childNodes[i].value == url) {
                                this.serviceList.removeChild(
                                                childNodes[i]);
                        }
                }
                // Select some other service!
                if(this.serviceList.childNodes.length > 0) {
                        this.serviceList.selectedIndex = 0;
                        this.wpsServiceContainer.getService(
                                        this.serviceList.options[0].value).getCapabilities(
                                        this.getCapabilitiesMethod);
                } else {
                        this.processesDiv.style.display = 'none';
                        this.processDiv.style.display = 'none';
                }
        },

        /**
        * Method :updateCapabilities
        *     Updates the selected service's process list.
        */
        updateCapabilities:function() {
                // Update the names (titles) of the services in the service list!
                for(var i=0; i<this.serviceList.options.length; i++) {                     // Schleife über alle WPSServices in der SelectBox
                        var url =  this.serviceList.options[i].value;                      // option[i] URL
                        var wpsService = null;
                        try {
                                wpsService = this.wpsServiceContainer.getService(url);     // !!! WPSService[option[i]]
                                this.serviceList.options[i].firstChild.nodeValue =
                                                wpsService.getTitle()+" @ "+url;           // WPSService.getTitle() rr1
                        } catch(exception) {
                                if(exception == 'ServiceNotFoundEx') {
                                        // TODO Some more info to the user?
                                        return;
                                }
                        }
                        // ############## selected Service ######################################################################################
                        if(i == this.serviceList.selectedIndex) {                          // entering only when i is the selected Service zB "localhost:8080/wps/WebProcessingService"
                                while (this.processSelection.hasChildNodes()) {
                                        this.processSelection.removeChild(
                                                        this.processSelection.childNodes.item(0));
                                }

                                // Update processes!
                                this.updateInfoText("Updating capabilities for " + url, "green");
                                var processCount = wpsService.getProcessCount();                 // Anzahl der Prozesse im WPSService rr2

                                // ############ if selected Service has processes ##############################################################
                                if(processCount > 0) {                                           // Wenn Prozesse vorhanden...
                                        // Show the processes.
                                        this.processesDiv.style.display = 'block';
                                        if(processCount > WOC.WPSClient.MAX_SHOWN_PROCESSES) {
                                                this.processSelection.size =
                                                                WOC.WPSClient.MAX_SHOWN_PROCESSES;
                                        } else {
                                                this.processSelection.size = processCount;
                                        }

                                        // RR3
                                        // Setting the boolean isClientSupported for each process

                                        var processIdentifiers = new Array();
                                        // adding all process identifier to the array rr3
                                        for(process in wpsService.getProcesses()){
                                                  processIdentifiers.push(wpsService.getProcess(process).getIdentifier());
                                        }
                                        // rr4
                                        //set the isClientSupported boolean in WPSProcess with "NoUpdate" as success function
                                        wpsService.describeProcessGET(processIdentifiers,wpsService.getDescriptionSuccessNoUpdate,wpsService.getDescriptionFailure,false);
                                /*
                                        alert(wpsService.getProcess("org.n52.wps.server.algorithm.simplify.DouglasPeuckerAlgorithm").getIdentifier()+
                                        "\n" + wpsService.getProcess("org.n52.wps.server.algorithm.simplify.DouglasPeuckerAlgorithm").getisClientSupported());

                                        alert(wpsService.getProcess("org.n52.wps.server.algorithm.SimpleBufferAlgorithm").getIdentifier()+
                                        "\n" + wpsService.getProcess("org.n52.wps.server.algorithm.SimpleBufferAlgorithm").getisClientSupported());

                                        alert(wpsService.getProcess("visibility").getIdentifier()+
                                        "\n" + wpsService.getProcess("visibility").getisClientSupported());
                                        */


                                        // Adding processes.
                                        // Going through each process.
                                        for(var processKey in wpsService.getProcesses()) {        // add process: <option value="p.getIdentifier()">p.getTitle()</option>
                                                var option = document.createElement('option');
                                                var process = wpsService.getProcess(processKey);
                                                option.text = process.getTitle();
                                                option.value = process.getIdentifier();

                                                //RR
                                                if(true || wpsService.getProcess(processKey).getisClientSupported()==true){
                                                       this.processSelection.appendChild(option);
                                                }
                                                else if(wpsService.getProcess(processKey).getisClientSupported()==false){
                                                     // dont add the process!
                                                }
                                                else{
                                                     // dont add the process!
                                                }

                                        }
                                }
                                this.updateInfoText("Updating capabilities...", 'green');
                        }
                        // ############## END selected Service ######################################################################################
                }
        },

        updateSelectedProcessViews:function(){
                        // Selecting the first process.
                        this.processSelection.selectedIndex = 0;
                        // Updating the process's description.
                        var processIdentifier = new Array();
                                  processIdentifier.push(this.processSelection.options[0].value);
                                  wpsService.describeProcesses(processIdentifier,this.describeProcessMethod);
        },

        /**
        * Wird von der WPSService.describeProcessResponseHandlind() Methode aufgerufen.
        *
        *
        * Method: updateDescription
        *     Updates the description of the selected process.
        */
        updateDescription:function() {
                this.updateInfoText("Updating process description", 'green');
                // Input choices.
                var wpsService = this.wpsServiceContainer.getService(                                  // holt sich den aktuell ausgewählten WPSService
                                this.serviceList.options[this.serviceList.selectedIndex].value);
                var processIdentifier = this.processSelection.options[                                 // holt sich den aktuell ausgewählten Prozess des aktuell ausgewählten WPSService
                                this.processSelection.selectedIndex].value;
                if(wpsService.getProcess(processIdentifier).getInputsCount() == 0) {                   // wenn der Prozess keine inputs hat...
                        // No inputs!
                        this.updateInfoText("", null);
                        return;
                }
                var inputs = wpsService.getProcess(processIdentifier).getInputs();                     // holt sich die Inputs den aktuell ausgewählten Prozesses

                if(inputs != null) {
                        this.processDiv.style.display = 'block';
                        // Removing the old process!
                        while(this.processInputsDiv.hasChildNodes()) {
                                this.processInputsDiv.removeChild(
                                                this.processInputsDiv.childNodes.item(0));
                        }

                        // Create a scrollable div.
                        var scrollableDiv = document.createElement('div');
                        scrollableDiv.id = "scrollableInputsDiv";
                        var dataTable = document.createElement('table');
                        dataTable.className = 'verticalArray';
                        // Create header row
                        var dataTableRow = document.createElement('tr');
                        var dataTableHeader0 = document.createElement('th');
                        dataTableHeader0.appendChild(document.createTextNode("Input title"));                    // die Überschrift 1 in der div
                        var dataTableHeader1 = document.createElement('th');
                        dataTableHeader1.appendChild(document.createTextNode("Usage"));                          // die Überschrift 2 in der div
                        dataTableHeader1.className = 'usageValue';
                        var dataTableHeader2 = document.createElement('th');
                        dataTableHeader2.appendChild(document.createTextNode("Value"));                          // die Überschrift 3 in der div
                        with(dataTableRow) {
                                appendChild(dataTableHeader0);
                                appendChild(dataTableHeader1);
                                appendChild(dataTableHeader2);
                        }
                        dataTable.appendChild(dataTableRow);
                        // Going through each of the process's inputs.
                        for(var inputKey in inputs) {                                                            // gehe durch alle inputs des Prozesses
                                inputs[inputKey].addDescriptionsToTable(dataTable, this.map);                    // ruft die addDescriptionsToTable Methode in WPSInputData auf
                        }
                        // Add the table to the div.
                        scrollableDiv.appendChild(dataTable);
                        this.processInputsDiv.appendChild(scrollableDiv);
                        // Add checkboxes for the process request and response
                        var popupTable = document.createElement('table');
                        var tableRow = document.createElement('tr');
                        this.getCheckboxRowForPopup(tableRow,
                                        "Show Execute request", 'execute_request_popup');
                        this.getCheckboxRowForPopup(tableRow,
                                        "Show Execute response", 'execute_response_popup');
                        popupTable.appendChild(tableRow);
                        this.processInputsDiv.appendChild(popupTable);
                        // Create the execution button.
                        var executeButton = document.createElement('input');
                        with(executeButton) {
                                type = 'button';
                                value = "Execute";
                        }
                        OpenLayers.Event.observe(executeButton, "click",
                            OpenLayers.Function.bindAsEventListener(
                                                        this.executeButtonClick, this));
						// #### Create the checkbox for directing the executeDoc to the test.html, if checked
						var span_testCheckBox = document.createElement("span");		// the container for the box and its label
						var testCheckBoxLabel = document.createElement('label');	// the label
						testCheckBoxLabel.innerHTML = "by test.html";
						testCheckBoxLabel.style.fontSize = "11px";
						testCheckBoxLabel.style.color = "white";
						var testCheckBox = document.createElement('input');			// the box
						testCheckBox.name = "testCheckbox";
						testCheckBox.id = "testCheckbox";
						with(testCheckBox) {
								type = 'checkbox';
								checked = false;
						}
						span_testCheckBox.appendChild(testCheckBoxLabel);
						span_testCheckBox.appendChild(testCheckBox);
						// added later to the div
                        
						// #### Create the description button.

                        var descriptionButton = document.createElement('input');
                        with(descriptionButton) {
                                type = 'button';
                                value = "Show description";
                        }
                        descriptionButton.wpsClient = this;
                        OpenLayers.Event.observe(descriptionButton, "click",
                            OpenLayers.Function.bindAsEventListener(
                                                        this.descriptionButtonClick, this));
                        // Adding the buttons to a table
                        var buttonData0 = document.createElement('td');
                        with(buttonData0) {
                                className = 'button';
                                appendChild(executeButton);
                        }
                        var buttonData1 = document.createElement('td');
                        with(buttonData1) {
                                className = 'button';
                                appendChild(descriptionButton);
                        }
                        var buttonRow = document.createElement('tr');
                        with(buttonRow) {
                                appendChild(buttonData0);
                                appendChild(span_testCheckBox);		// test.html checkbox
                                appendChild(buttonData1);
                        }
                        var buttonTable = document.createElement('table');
                        buttonTable.appendChild(buttonRow);
                        this.processInputsDiv.appendChild(buttonTable);
                        // this.processDiv.appendChild(buttonTable);
                        // this.processDiv.appendChild(descriptionButton);
                        this.updateInfoText("", null);
                }
        },


        /**
        * Method: getCheckboxRowForPopup
        *     Adds to a given row a checkbox using an image.
        *
        * Parameters:
        * row - {DOMElement} A row to which the checkbox image is added
        * label - {String} Label of the checkbox.
        * id - {String} Identifier of the checkbox.
        */
        getCheckboxRowForPopup:function(row, label, id) {
                // Label
                var checkboxLabel = document.createElement('label');
                checkboxLabel.htmlFor = 'image_' + id;
                with(checkboxLabel) {
                        innerHTML = label;
                        className = 'popup_checkbox';
                }
                // Image for the checkbox
                var checkboxImg = document.createElement('img');
                checkboxImg.id = 'image_' + id;
                with(checkboxImg) {
                        src = 'img/cross_box.png';
                        alt = "Unchecked";
                }
                OpenLayers.Event.observe(checkboxImg, 'click',
                                OpenLayers.Function.bindAsEventListener(
                                                WOC.checkboxChecker, this));
                // Actual checkbox
                var checkbox = document.createElement('input');
                checkbox.name = id;
                checkbox.id = id;
                with(checkbox) {
                        type = 'checkbox';
                        checked = false;
                        className = 'hiddenCheckbox';
                }
                var tableData1 = document.createElement('td');
                tableData1.appendChild(checkboxLabel);
                row.appendChild(tableData1);
                var tableData2 = document.createElement('td');
                tableData2.appendChild(checkboxImg);
                tableData2.appendChild(checkbox);
                row.appendChild(tableData2);
        },

        /**
        * Method: executeResponseHandling
        *     This method is responsible for going trough the output of the
        *     Execute-response.
        *
        * Parameters:
        * process - (WOC.WPSProcess) Process, which was successfully run.
        * processOutputs - {DOMElement} The ouputs of the process execution.
        */
        executeResponseHandling:function(process, processOutputs) {
                var outputs = WOC.getElementsByTagNameNS(processOutputs,
                                WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'Output');
                // var outputs = execution.getProcessOutputs(); // Returns the outputs DOMElement
                var hasLiteralOutput = false;
                for(var i=0; i<outputs.length; i++) {
                        var literalOutput = WOC.getElementsByTagNameNS(outputs[i],
                                        WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'LiteralData');
                        if(literalOutput && literalOutput.length > 0) {
                                hasLiteralOutput = true;
                                i = outputs.length;
                        }
                }
                if(hasLiteralOutput) {
                        // If there is literal output then we need to show it to the user!
                        // Create a div for the literal output.
                        this.wpsProcessResultDiv = document.createElement('div');
                        this.wpsProcessResultDiv.id = "wpsProcessResultDiv";
                        // Create a label for the results.
                        var literalOutputLabel = document.createElement('div');
                        with(literalOutputLabel) {
                                innerHTML = OpenLayers.i18n('Process\' literal output');
                                className = 'wpsSubLabel';
                        }
                        this.wpsProcessResultDiv.appendChild(literalOutputLabel);
                        this.literalOutputTable = document.createElement('table');
                        this.wpsProcessResultDiv.appendChild(this.literalOutputTable);
                }
                for(var i=0; i<outputs.length; i++) {
                        // Each output has to have a title and identifier!
                        var outputTitle = WOC.getElementsByTagNameNS(outputs[i],
                                        WOC.OWS_NAMESPACE, WOC.OWS_PREFIX, 'Title')[0].
                                        firstChild.nodeValue;
                        var outputIdentifier = WOC.getElementsByTagNameNS(outputs[i],
                                        WOC.OWS_NAMESPACE, WOC.OWS_PREFIX, 'Identifier')[0].
                                        firstChild.nodeValue;
                        var dataNodes = WOC.getElementsByTagNameNS(outputs[i],
                                                 WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'Data');
                        if(dataNodes && dataNodes.length > 0) {
                                this.executeResponseDataHandling(process, dataNodes[0],
                                                outputTitle, outputIdentifier);
                        } else {
                                var referenceNodes = WOC.getElementsByTagNameNS(outputs[i],
                                                 WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'Reference');
                                if(referenceNodes && referenceNodes.length > 0) {
                                        this.executeResponseReferenceHandling(process,
                                                        referenceNodes[0], outputTitle, outputIdentifier);
                                } else {
                                        // TODO No data and no reference -> Exception
                                        alert("Error! No data or reference was found!!!");
                                }
                        }
                }
        },

        /**
        * Method: executeResponseDataHandling
        *     Shows the data, which has been directly given by the process, to the
        *     user.
        *
        * Parameters:
        * process - {WOC.WPSProcess} Process, which was successfully run.
        * data {DOMElement} The wps:Data element of the Execute response.
        * title - {String} Title of the data.
        * identifier - {String} Identifier of the output for which the data is.
        */
        executeResponseDataHandling:function(process, data, title, identifier) {
                var literalOutputs = WOC.getElementsByTagNameNS(data,
                                WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'LiteralData');
                var complexOutputs = WOC.getElementsByTagNameNS(data,
                                WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'ComplexData');
                var bbOutputs = WOC.getElementsByTagNameNS(data,
                                WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'BoundingBoxData');
                if(literalOutputs && literalOutputs.length > 0) {
                        // Show to the user the title and the output's content.
                        var literalOutputRow = document.createElement('tr');
                        var titleTableItem = document.createElement('td');
                        titleTableItem.appendChild(document.createTextNode(title));
                        literalOutputRow.appendChild(titleTableItem);
                        var contentTableItem = document.createElement('td');
                        contentTableItem.appendChild(literalOutputs[0]);
                        literalOutputRow.appendChild(contentTableItem);
                        // UoM



                        // data type


                        this.literalOutputTable.appendChild(literalOutputRow);

                        // deleting the output div, if existing
                        if(document.getElementById('wps_literalOutput')){
                            document.getElementById('container').removeChild(document.getElementById('wps_literalOutput'));
                        }

                        //alert(this.wpsProcessResultDiv.innerText);
                        var wps_literalOutput = document.createElement('div');            // rrLiteralOut
                            wps_literalOutput.id = 'wps_literalOutput';
                            wps_literalOutput.style.backgroundColor = 'grey';
                            wps_literalOutput.style.color = 'black';
                            wps_literalOutput.style.borderTop = '2px solid black';
                            wps_literalOutput.style.borderLeft = '2px solid black';
                            wps_literalOutput.style.borderRight = '2px solid black';
                            wps_literalOutput.style.borderBottom = '2px solid black';
                            wps_literalOutput.style.position = 'absolute';
                            wps_literalOutput.style.top = '50%';
                            wps_literalOutput.style.left = '50%';
                            wps_literalOutput.style.padding = '15px';
                            wps_literalOutput.style.zIndex = '1010';
                            wps_literalOutput.appendChild(this.wpsProcessResultDiv);

                        // creating a button to close the div
                        var closeButton = document.createElement('div');
                            closeButton.style.backgroundColor = 'darkgrey';
                            closeButton.style.color = 'black';
                            closeButton.style.cursor = 'pointer';
                            closeButton.style.fontFamily = 'Arial';
                            closeButton.style.fontWeight = 'bold';
                            closeButton.style.fontSize = '13';
                            closeButton.style.textAlign = 'center';
                            closeButton.style.border = '1px solid black';
                            closeButton.innerText = 'close';

                            // adding the click event
                            OpenLayers.Event.observe(closeButton, "click",
                                    OpenLayers.Function.bindAsEventListener(
                                                                this.closeButtonClick, closeButton));

                        wps_literalOutput.appendChild(closeButton);

                        document.getElementById('container').appendChild(wps_literalOutput);

                } else if(complexOutputs && complexOutputs.length > 0) {
                        var complexOutput = complexOutputs[0];
                        // Check if the schema, encoding and format are supported by the process!
                        var formats = process.getOutputs()[
                                        identifier].getComplexOutput().getFormats();
                        if(complexOutput.hasAttribute('mimeType')) {
                                var mimeType = complexOutput.attributes.getNamedItem(
                                                'mimeType').nodeValue;
                                var supported = false;
                                for(var j=0; j<formats.length; j++) {
                                        if(formats[j].getMimeType() == mimeType) {
                                                supported = true;
                                        }
                                }
                                if(!supported) {
                                        // TODO Error. The MIME type is not supported!
                                        alert("Error. The MIME type of complex output data is not supported!");
                                }
                        }
                        if(complexOutput.hasAttribute('encoding')) {
                                var encoding = complexOutput.attributes.getNamedItem(
                                                'encoding').nodeValue;
                                var supported = false;
                                for(var j=0; j<formats.length; j++) {
                                        if(formats[j].getEncoding() == encoding) {
                                                supported = true;
                                        }
                                }
                                if(!supported) {
                                        // TODO Error. The encoding is not supported!
                                        alert("Error. The encoding is not supported!");

                                }
                        }
                        if(complexOutput.hasAttribute('schema')) {
                                var schema = complexOutput.attributes.getNamedItem(
                                                'schema').nodeValue;
                                var supported = false;
                                for(var j=0; j<formats.length; j++) {
                                        if(formats[j].getSchema() == schema) {
                                                supported = true;
                                        }
                                }
                                if(!supported) {
                                        // TODO Error. The schema is not supported!
                                        alert("Error. The schema is not supported!");

                                }
                        }

                        var mimeType = "";
                        if(complexOutput.hasAttribute('mimeType')) {
                                mimeType = complexOutput.attributes.getNamedItem(
                                                'mimeType').nodeValue.toLowerCase();
                        } else {
                                // TODO Unknown MIME type. Use the default format of the process description!
                                mimeType = formats[0].getMimeType().toLowerCase();
                                if(mimeType=="") {
                                        alert("Error. The MIME type of complex output data has not been given!");



                                }
                        }

                        if(mimeType == "text/xml" || mimeType == "application/xml") { 					// GML data                              
                                /*
                                if(this.processResultLayer) {
                                        // Removing old process result layer!
                                        var setNewBaseLayer        = false;
                                        this.map.removeLayer(this.processResultLayer,
                                                        setNewBaseLayer);
                                } */

                                // preparing processIdentifier for simpleBuffer and peucker, because their names are too long:
                                var processIdentifier = null;
                                if(process.getIdentifier() == "org.n52.wps.server.algorithm.SimpleBufferAlgorithm"){
                                      processIdentifier = "SimpleBuffer";
                                }
                                else if (process.getIdentifier() == "org.n52.wps.server.algorithm.simplify.DouglasPeuckerAlgorithm"){
                                      processIdentifier = "DouglasPeucker";
                                }
                                else {
                                      processIdentifier = process.getIdentifier();
                                }

                                // OpenLayers.Layer.GML is not used as a reference is not used.
                                // Here we store the response to use it later again.
                                // An alternative is to use the angel style!       RRR1
                                this.processResultLayer.push(new WOC.VectorStoringGML(
                                                "Process output layer "+(this.processResultLayer.length)+" "+processIdentifier, {   // "Process output layer 1/2..n"
                                                isBaseLayer:false,
                                                visibility:true/*,
                                                style:WOC.WPSClient.style['devel']*/}));
                                this.processResultLayer[this.processResultLayer.length-1].setTileSize(512);
                                
                                // adding the WOC.VectorStoringGML layer to the map
                                map.addLayer(this.processResultLayer[this.processResultLayer.length-1]);	
                                
                                // Adding data to the layer.
                                // featureMember/featureMembers/featureProperty or
                                // featureCollection (GMLPacket)
                                var gmlData = complexOutput.firstChild;
                                this.processResultLayer[this.processResultLayer.length-1].setGML(WOC.xml2Str(gmlData));
                                // Get the source and target projections
                                var features = new Array();
                                var sourceProjection = this.parseProjectionFromGML(gmlData);
                                var targetProjection = new OpenLayers.Projection(
                                                this.map.getProjection());
                                if(!sourceProjection)
                                        sourceProjection = targetProjection;
                                // GML2 & GML3.1 featureMember
                                var featureMembers = WOC.getElementsByTagNameNS(gmlData,"http://www.opengis.net/gml", "gml", "featureMember");
                                if(featureMembers && featureMembers.length > 0) {
                                        features = features.concat(this.getFeaturesFromFeatureNodes(
                                                        featureMembers, sourceProjection, targetProjection));
                                }
                                // GML 3.1 featureMembers and featureProperty
                                featureMembers = WOC.getElementsByTagNameNS(gmlData,"http://www.opengis.net/gml", "gml", "featureMembers");
                                if(featureMembers && featureMembers.length > 0) {
                                    features = this.getFeaturesFromExecuteResponse(gmlData, featureMembers, sourceProjection, targetProjection);
                                }
                                featureMembers = WOC.getElementsByTagNameNS(gmlData,"http://www.opengis.net/gml", "gml", "featureProperty");
                                if(featureMembers && featureMembers.length > 0) {
                                        features = features.concat(this.getFeaturesFromFeatureNodes(
                                                        featureMembers, sourceProjection, targetProjection));
                                }
                                // GML 2 GMLPacket. The gmlPacket element is the root
                                // feature collection. This schema restricts allowable
                                // feature members to instances of pak:StaticFeatureType.
                                // None of the type definitions in the gmlpacket schema can
                                // be extended or restricted in any manner, and this schema
                                // cannot serve as the basis for any other application
                                // schema (i.e. it cannot be imported or included into
                                // another schema).
                                featureMembers = WOC.getElementsByTagNameNS(complexOutput,
                                                "http://www.opengis.net/examples/packet", "pac",
                                                "GMLPacket");
                                if(featureMembers && featureMembers.length > 0) {
                                        var packetMembers = WOC.getElementsByTagNameNS(
                                                featureMembers[0],
                                                "http://www.opengis.net/examples/packet", "pac",
                                                "packetMember");
                                        for(var i=0; i<packetMembers.length; i++) {
                                                var staticFeatures = WOC.getElementsByTagNameNS(
                                                packetMembers[i],
                                                "http://www.opengis.net/examples/packet", "pac",
                                                "StaticFeature");
                                                features = features.concat(							// concat = join or arrays
                                                        this.getFeaturesFromFeatureNodes(
                                                        staticFeatures, sourceProjection,
                                                        targetProjection));
                                        }
                                }
                                // Note! In GML 3.2 featureMember, featureMembers and featureProperty
                                // have been superseded by elements defined in application schemas.
                                if(features.length > 0) {
                                        this.processResultLayer[this.processResultLayer.length-1].addFeatures(features); // No options!
                                }
                                this.map.addLayer(this.processResultLayer[this.processResultLayer.length-1]);
                                this.processResultLayer[this.processResultLayer.length-1].redraw();
                        } else if(mimeType == "image/jpeg" || mimeType == "image/gif" ||
                                        mimeType == "image/png" || mimeType == "image/png8" ||
                                        mimeType == "image/tiff" || mimeType == "image/tiff8" ||
                                        mimeType == "image/geotiff" || mimeType == "image/geotiff8" ||
                                        mimeType == "image/svg") {
                                // Embedded image.
                                alert("Embedded image! UNIMPLEMENTED!");
                        } else {
                                // Unsupported MIME type.
                                alert("Error. The MIME type is not supported! MIME type is \"" + mimeType + "\"");
                        }
                        // In case of complexData we have to update the layers of
                        // the process description! Else old layers are referenced!

                        var url = this.serviceList.options[this.serviceList.selectedIndex].value;
                        var processIdentifier = this.processSelection.options[
                                        this.processSelection.selectedIndex].value;
                        this.wpsServiceContainer.getService(url).describeProcesses(
                                        [processIdentifier], this.describeProcessMethod);

                } else if(bbOutputs && bbOutputs.length > 0) {
                        alert("Exception! BoundingBoxData output handling is unimplemented!");
                        // TODO BoundingBoxData output handling is unimplemented!
                } else {
                        alert("Output's outputFormChoice is unrecognized!");
                }
        },

        /**
        * Method: closeButtonClick
        *     Closes the DIV which shows the literal output
        */
        closeButtonClick:function() {
                document.getElementById('container').removeChild(document.getElementById('wps_literalOutput'));
        },


        /**
        * Method: executeResponseReferenceHandling
        *     Shows the data being referenced in the Execute-operation's response to
        *     the user.
        *
        * Parameters:
        * title - {String} Title of the referenced data.
        * identifier - {String} Identifier of the output for which the data is.
        * process - {WOC.WPSProcess} Process, which was successfully run.
        * reference {DOMElement} The wps:Reference element of the Execute response.
        */
        executeResponseReferenceHandling:function(title, identifier, process,
                        reference) {
                var href = "";
                if(reference.hasAttribute('href')) {
                        href = reference.attributes.getNamedItem('href').nodeValue;
                } else if(reference.hasAttribute('xlink:href')) {
                        href = reference.attributes.getNamedItem('xlink:href').nodeValue;
                } else {
                        // No attributes -> Error
                        alert("Exception! Reference output is missing the xlink:href attribute!");


                }

                var formats = process.getOutputs()[
                                        identifier].getComplexOutput().getFormats();
                // Check if the schema, encoding and format are supported by the process!
                if(reference.hasAttribute('format')) {
                        var format = complexOutput.attributes.getNamedItem(
                                        'format').nodeValue;
                        var supported = false;
                        for(var j=0; j<formats.length; j++) {
                                if(formats[j].getMimeType() == format) {
                                        supported = true;
                                }
                        }
                        if(!supported) {
                                // Error. The MIME type is not supported!
                                alert("Error. The MIME type is not supported!");



                        }
                }
                if(complexOutput.hasAttribute('encoding')) {
                        var encoding = complexOutput.attributes.getNamedItem(
                                        'encoding').nodeValue;
                        var supported = false;
                        for(var j=0; j<formats.length; j++) {
                                if(formats[j].getEncoding() == encoding) {
                                        supported = true;
                                }
                        }
                        if(!supported) {
                                // Error. The encoding is not supported!
                                alert("Error. The encoding is not supported!");



                        }
                }
                if(complexOutput.hasAttribute('schema')) {
                        var schema = complexOutput.attributes.getNamedItem(
                                        'schema').nodeValue;
                        var supported = false;
                        for(var j=0; j<formats.length; j++) {
                                if(formats[j].getSchema() == schema) {
                                        supported = true;
                                }
                        }
                        if(!supported) {
                                // Error. The schema is not supported!
                                alert("Error. The schema is not supported!");



                        }
                }

                if(process.getOutputs()[identifier].getLiteralOutput()) {
                        // Title. Show to the user.
                        var titleTextNode = document.createTextNode(title);

                        // var literalOutput = reference.getElementsByTagName("LiteralOutput")[0];
                        // uom



                        // data type



                } else if(process.getOutputs()[identifier].getComplexOutput) {
                        var mimeType = "";
                        if(reference.hasAttribute('format')) {
                                mimeType = reference.attributes.getNamedItem(
                                                'format').nodeValue.toLowerCase();
                        } else {
                                // Unknown MIME type. Lets then use the default format given by the process!
                                mimeType = formats[0].getMimeType().toLowerCase();
                        }
                        if(mimeType == "text/xml") {
                                // GML data
                                if(this.processResultLayer != null) {
                                        var setNewBaseLayer        = false;
                                        this.map.removeLayer(this.processResultLayer, setNewBaseLayer);
                                }
                                this.processResultLayer = new Array();
                                processResultLayer[processResultLayer.length] = new OpenLayers.Layer.GML(
                                                "Process output layer", href, {
                                                isBaseLayer:false,
                                                visibility:true});
                                // this.processResultLayer.setVisibility(true);
                                this.processResultLayer.setTileSize(512);
                                this.map.addLayer(this.processResultLayer)
                                this.processResultLayer.redraw();
                        } else if(mimeType == "image/jpeg" || mimeType == "image/gif" ||
                                        mimeType == "image/png" || mimeType == "image/png8" ||
                                        mimeType == "image/tiff" || mimeType == "image/tiff8" ||
                                        mimeType == "image/geotiff" || mimeType == "image/geotiff8" ||
                                        mimeType == "image/svg") {
                                // WMS/WCS image.



                        } else {
                                // Unsupported MIME type. Only the previous are currently supported!
                                alert("Error. The MIME type is not supported!");



                        }
                } else if(process.outputs[identifier].boundingBoxOutput != null) {
                        alert("Exception! BoundingBoxData as output reference is unimplemented!");
                        // UNIMPLEMENTED!



                }
        },

        /**
        * Method: getFeaturesFromFeatureNodes
        *     Returns an array of features found from the featureNode object.
        *     If the source and target CRS codes are given will also transform the
        *     coordinates.
        *
        * Parameters:
        * featureNodes - {DOMElement} Features
        * sourceProjection - {Integer} EPSG-code of the source projection
        *     (internalProjection).
        * targetProjection - {Integer} EPSG-code of the target projection
        *     (externalProjection).
        */
        getFeaturesFromFeatureNodes:function(featureNodes,
                        sourceProjection, targetProjection) {
                /*var gmlFormat = new OpenLayers.Format.GML({
                                                                'internalProjection':targetProjection,
                                                                'externalProjection':sourceProjection});*/
        		var gmlFormat = new OpenLayers.Format.GML();
                var features = new Array();
                for(var j=0; j<featureNodes.length; j++) {
                        // This function is the core function of the GML parsing code in OpenLayers.
                        // It creates the geometries that are then attached to the returned
                        // feature, and calls parseAttributes() to get attribute data out.
                        var feature = gmlFormat.parseFeature(featureNodes[j]);
                        if(feature) {
                                features.push(feature);
                        }
                }
                return features;
        },
        
        /**
         * Method: getFeaturesFromExecuteResponse
 		* @author: Raphael Rupprecht
         */
         getFeaturesFromExecuteResponse:function(gmlData, featureMembers, sourceProjection, targetProjection) {
                 // ### options for the GMLv3 OpenLayers Format
 				var in_options = {
 					'internalProjection': sourceProjection,
 					'externalProjection': targetProjection
 				};			
 				var gmlOptions = {
 					featureType: featureMembers[0].childNodes[0].localName,		// example: "Feature"
 					featureNS: featureMembers[0].childNodes[0].namespaceURI 	// example: "http://www.52north.org/...-455f-a54a-34e06ac25df3"
 				};				
 				var gmlOptionsIn = OpenLayers.Util.extend(
 					OpenLayers.Util.extend({}, gmlOptions),
 					in_options
 				);
 				// ### create the GML format
         		var gmlFormat = new OpenLayers.Format.GML.v3(gmlOptionsIn);
 				// ### 
                 var features = new Array();
 				features = gmlFormat.read(gmlData);

                 return features;
         },	        

        /**
        * Method: parseProjectionFromGML
        *     Returns the first found projection from GML2 or GML3 data.
        *
        * Parameters:
        * gmlData - {DOMElement} GML2 or GML3 data
        */
        parseProjectionFromGML:function(gmlData) {
                var projCode = "";
                var features = [];
                var boundedByNodes = WOC.getElementsByTagNameNS(gmlData,
                        'http://www.opengis.net/gml', 'gml', 'boundedBy');
                for(var i=0; i<boundedByNodes.length; i++) {
                        // Next should be an Box (GML2) or Envelope (GML3)
                        var envelopeNodes = WOC.getElementsByTagNameNS(boundedByNodes[i],
                                        'http://www.opengis.net/gml', 'gml', 'Envelope');
                        if(envelopeNodes.length > 0) {
                                if(envelopeNodes[0].hasAttribute('srsName')) {
                                        projCode = envelopeNodes[0].attributes.getNamedItem('srsName').nodeValue;
                                } else {



                                }
                        } else {
                                var boxNodes = WOC.getElementsByTagNameNS(boundedByNodes[i],
                                                'http://www.opengis.net/gml', 'gml', 'Box');
                                if(boxNodes.length > 0) {
                                        if(boxNodes[0].hasAttribute('srsName')) {
                                                projCode = boxNodes[0].attributes.getNamedItem('srsName').nodeValue;
                                        } else {



                                        }
                                } else {



                                }
                        }
                }
                if(projCode == "") {
                        // No code was found.
                        // alert("Proj code not found!");
                        return null;
                }
                return new OpenLayers.Projection(projCode);
        },

        /**
        * Method: getXML_BBOX_Filter
        *     Returns a string having an ogc:Filter for the given data.
        *
        * Parameters:
        * crsURI - {String} URI referencing the CRS. Can be null, in which case
        *     the CRS is supposed to be geographic WGS84!
        * layer - {OpenLayers.Layer} Layer, whose extent is used for the BBOX.
        * propertyName - {String} Name of the property for which the filter is made.
        *
        * Note: Uses the ogc and gml prefixes!
        */
        getXML_BBOX_Filter:function(crsURI, layer, propertyName) {
                var referenceString = "<ogc:Filter" +
                                " xmlns:ogc=\"http://www.opengis.net/ogc\"" +
                                " xmlns:gml=\"http://www.opengis.net/gml\">";
                referenceString += "<ogc:BBOX>";
                referenceString += "<ogc:PropertyName>" + propertyName + "</ogc:PropertyName>";
                if(crsURI) {
                        referenceString += "<gml:Box srsName=\"" + crsURI + "\">";
                } else {
                        //"http://www.opengis.net/gml/srs/epsg.xml#4326";>
                        referenceString += "<gml:Box>";
                }
                referenceString += "<gml:coordinates >";
                // A Bounds object which represents the lon/lat bounds of the current viewPort.
                var bb = layer.getExtent().toBBOX(9).split(',');
                referenceString += bb[0] + "," + bb[1] + " " + bb[2] + "," + bb[3];
                referenceString += "</gml:coordinates>";
                referenceString += "</gml:Box>";
                referenceString += "</ogc:BBOX>";
                referenceString += "</ogc:Filter>";
                return referenceString;
        },

        /**
        * Method: getXML_Within_Filter
        *     Return a KVP encoded BBOX of the CRS.
        *
        * Parameters:
        * crsURI - {String} URI referencing the CRS. Can be null, in which case
        *     the CRS is supposed to be geographic WGS84!
        * layer - {OpenLayers.Layer} Layer, whose extent is used for the BBOX.
        * propertyName - {String} Name of the property for which the filter is made.
        *
        * Note: Uses the ogc and gml prefixes!
        */
        getXML_Within_Filter:function(crsURI, layer, propertyName) {
                var referenceString = "<ogc:Filter" +
                                " xmlns:ogc=\"http://www.opengis.net/ogc\"" +
                                " xmlns:gml=\"http://www.opengis.net/gml\">";
                referenceString += "<ogc:Within>";
                referenceString += "<ogc:PropertyName>" + propertyName +
                                "</ogc:PropertyName>";
                if(!crsURI) {
                        referenceString += "<gml:Envelope>";
                } else {
                        referenceString += "<gml:Envelope srsName=\"" + crsURI + "\">";
                }
                referenceString += "<gml:lowerCorner>";
                var bb = layer.getExtent().toBBOX(9).split(',');
                referenceString += bb[0] + " " + bb[1];
                referenceString += "</gml:lowerCorner>";
                referenceString += "<gml:upperCorner>";
                referenceString += bb[2] + " " + bb[3];
                referenceString += "</gml:upperCorner>";
                referenceString += "</gml:Envelope>";
                referenceString += "</ogc:Within>";
                referenceString += "</ogc:Filter>";
                return referenceString;
        },

        /**
        * Method: getKVP_BBOX
        *     Return a KVP encoded BBOX of the CRS.
        *
        * Parameters:
        * crsURI - {String} URI referencing the CRS. Can be null, in which case
        *     the CRS is supposed to be geographic WGS84!
        * layer - {OpenLayers.Layer} Layer, whose extent is used for the BBOX.
        */
        getKVP_BBOX:function(crsURI, layer) {
                // The general form of the parameter is:
                // BBOX=lcc1,lcc2,?,lccN,ucc1,ucc2,?uccN[,crsuri]
                // where lcc means Lower Corner Coordinate, ucc means Upper Corner Coordinate
                // and crsuri means the URI reference to the coordinate system being used.
                var referenceString = "BBOX=";
                // A Bounds object which represents the lon/lat bounds of the current viewPort.
                var bounds = layer.getExtent();
                // upper left corner AND lower right corner
                var significantDigits = 9;
                referenceString += bounds.toBBOX(significantDigits);
                if(crsURI != null) {
                        referenceString += "," + crsURI;
                }
                return referenceString;
        },

        /**
        * Method: updateInfoText
        *     Updates the info text.
        *
        * Parameters:
        * text - {String} A string which is put into the info text field.
        * color - {String} Name of the color used for the text. Has to be a css
        *     compatible color name.
        */
        updateInfoText:function(text, color) {
                if(color != null) {
                        this.infoFont.style.color = color;
                } else {
                        this.infoFont.style.color = "white";
                }
                this.infoTextNode.data = text;
        },

        /**
        * Method: getMap
        *
        * Returns:
        * {OpenLAyers.Map}
        */
        getMap:function() {
                return this.map;
        },

        /**
         * Method: getNewServicesDiv
         *
         * Returns:
         * {DOMElement}
         */
        getNewServicesDiv:function() {
                // Create a text field for a single server URL.
                this.serviceTextField = document.createElement('input');
                with(this.serviceTextField) {
                        name = 'serviceTextField';
                        type = "text";
                        id = "newService";
                }
                OpenLayers.Event.observe(this.serviceTextField, "click",
                                OpenLayers.Function.bindAsEventListener(
                                                WOC.textFieldClearing, this.serviceTextField));
                this.serviceList = this.getNewServiceList();
                var div = document.createElement('div');
                var foldingDiv = document.createElement('div');
                foldingDiv.appendChild(this.serviceTextField);
                foldingDiv.appendChild(this.getNewServiceButtonsDiv());
                foldingDiv.appendChild(this.serviceList);
                this.getFoldingLabelForDiv(div, foldingDiv, "WPS services ", true);
                return div;
        },

        /**
         * Method: getNewProcessesDiv
         *
         * Returns:
         * {DOMElement}
         */
        getNewProcessesDiv:function() {
            var div = document.createElement('div');
            this.processSelection = document.createElement('select');
            this.processSelection.wpsClient = this;
            with(this.processSelection) {
                    name = 'WPS processes';
                    style.width = '100%';
                    style.height = '100%';
            }
            this.processSelection.onchange = function() {
                    // this == processSelection
                    if(this.selectedIndex >= 0) {
                            var wpsService =
                                            this.wpsClient.wpsServiceContainer.getService(
                                            this.wpsClient.serviceList.options[
                                            this.wpsClient.serviceList.selectedIndex].value);
                            var processIdentifier = this.wpsClient.processSelection.options[
                                            this.wpsClient.processSelection.selectedIndex].value;
                            wpsService.describeProcesses([processIdentifier],
                                            this.describeProcessMethod);
                    }
            };
            div.style.display = 'none';
            var foldingDiv = document.createElement('div');
            foldingDiv.appendChild(this.processSelection);
            this.getFoldingLabelForDiv(div, foldingDiv, "Processes ", true);
            return div;
        },

        /**
         * Method: getNewProcessDiv
         *
         * Returns:
         * {DOMElement}
         */
        getNewProcessDiv:function() {
            var div = document.createElement('div');
            this.processInputsDiv = document.createElement('div');

            div.style.display = 'none';
            var foldingDiv = document.createElement('div');
            foldingDiv.appendChild(this.processInputsDiv);
            this.getFoldingLabelForDiv(div, foldingDiv, "Process execution ", true);
            return div;
        },
        
        /**
         * Method: getNewAbstractDiv
         * The content is set in the parseDescriptionNode function in WPSProcess.js while parsing the describeProcess document of the process
         *
         * Returns:
         * {DOMElement}
         */
        getNewAbstractDiv:function() {
			var outerDiv = document.createElement('div');
			var innerDiv = document.createElement('div');
			innerDiv.className = "dataTable";
			// ### the content ###
			var content = $("<div id='abstractDiv'></div>").css(
					{"border":"1px solid white",
					 "font-size":"11px",
					 "width":"100%",
					 "height":"60px",
					 "overflow":"auto"
					 });					
			// ### 
			innerDiv.appendChild(content[0]);
			this.getFoldingLabelForDiv(outerDiv, innerDiv, "Abstract ", false);
			return outerDiv;
        },	        

        /**
         * Method: getNewServiceList
         *
         * Returns:
         * {DOMElement}
         */
        getNewServiceList:function() {
            // List for the stored services -- Selecting an URL from the
            // makes immediently a query.
            var list = document.createElement('select');
            with(list) {
                    name = 'WPS services';
                    size = WOC.WPSClient.MAX_SHOWN_SERVICES;
                    id = 'serviceList';
            }
            // The server list needs to know about the client!
            list.client = this;
            //OpenLayers.Event.observe(list, 'click',
            //                OpenLayers.Function.bindAsEventListener(this.ignoreEvent,
            //                                this));
            // list.onclick = function() { this.focus; }
            list.onchange = function() {
                    // this == serviceList
                    if(this.client.wpsServiceContainer.getServiceCount() >
                                    this.selectedIndex && this.selectedIndex >= 0) {
                            var name = this.options[this.selectedIndex].text;
                            var url = this.options[this.selectedIndex].value;
                            this.client.serviceTextField.value = url;
                            // this.client.serviceTextField.text = name;
                            this.client.updateCapabilities();
                    }
            };
            return list;
        },

        /**
         * Method: getNewServiceButtonsDiv
         *
         * Returns:
         * {DOMElement}
         */
        getNewServiceButtonsDiv:function() {
                // Button to query the server -- Used to query a WPS service's capabilities.
                var addServiceButton = document.createElement('input');
                with(addServiceButton) {
                        type = 'button';
                        value = 'Add service';
                }
                OpenLayers.Event.observe(addServiceButton, "click",
                    OpenLayers.Function.bindAsEventListener(
                                                this.addServiceButtonClick, this));
                var removeServiceButton = document.createElement('input');
                with(removeServiceButton) {
                        type = 'button';
                        value = 'Remove service';
                }
                OpenLayers.Event.observe(removeServiceButton, "click",
                    OpenLayers.Function.bindAsEventListener(
                                                this.removeServiceButtonClick, this));
                var showCapabilitiesButton = document.createElement('input');
                with(showCapabilitiesButton) {
                        type = 'button';
                        value = 'Show capabilities';
                }
                OpenLayers.Event.observe(showCapabilitiesButton, "click",
                    OpenLayers.Function.bindAsEventListener(
                                                this.showCapabilitiesButtonClick, this));
                // Table to show the buttons.
                var buttonsTable = document.createElement('table');
                var td0 = document.createElement('td');
                td0.className = 'button';
                td0.appendChild(addServiceButton)
                var td1 = document.createElement('td');
                td1.className = 'button';
                td1.appendChild(showCapabilitiesButton)
                var td2 = document.createElement('td');
                td2.className = 'button';
                td2.appendChild(removeServiceButton)
                var tr = document.createElement('tr');
                with(tr) {
                        appendChild(td0);
                        appendChild(td1);
                        appendChild(td2);
                }
                buttonsTable.appendChild(tr);
                var div = document.createElement('div');
                div.appendChild(buttonsTable);
                return div;
        },

        /**
         * Method: getNewExecutionsDiv
         *
         * Returns:
         * {DOMElement}
         */
        getNewExecutionsDiv:function() {
                var headerRow = document.createElement('tr');
                var th1 = document.createElement('th');
                th1.appendChild(document.createTextNode('WPS instance'));
                var th2 = document.createElement('th');
                th2.appendChild(document.createTextNode('Process'));
                var th3 = document.createElement('th');
                th3.appendChild(document.createTextNode('Status'));
                var th4 = document.createElement('th');
                th4.appendChild(document.createTextNode('Complited'));
                var th5 = document.createElement('th');
                th5.appendChild(document.createTextNode('Info'));
                with(headerRow) {
                        appendChild(th1);
                        appendChild(th2);
                        appendChild(th3);
                        appendChild(th4);
                        appendChild(th5);
                }
                var t = document.createElement('table');
                t.className = "dataArray";
                t.appendChild(headerRow);
                var tableDiv = document.createElement('div');
                tableDiv.className = "dataArray";
                tableDiv.appendChild(t);
                var div = document.createElement('div');
                div.style.display = 'none';
                this.getFoldingLabelForDiv(div, tableDiv, "Running processes ", true);
                return div;
        },

        /**
         * Method: getNewSettingsDiv
         *
         * Returns:
         * {DOMElement}
         */
        getNewSettingsDiv:function() {
                var methods = ["GET", "POST", "SOAP"];
                var methodTable = document.createElement('table');
                methodTable.className = "verticalArray";
                // Headers
                var headerRow = document.createElement('tr');
                var headerDataOperations = document.createElement('th');
                headerDataOperations.appendChild(
                                document.createTextNode("Operation"));
                headerRow.appendChild(headerDataOperations);
                var headerDataGET = document.createElement('th');
                headerDataGET.appendChild(
                                document.createTextNode("GET"));
                headerRow.appendChild(headerDataGET);
                var headerDataPOST = document.createElement('th');
                headerDataPOST.appendChild(
                                document.createTextNode("POST"));
                headerRow.appendChild(headerDataPOST);
                var headerDataSOAP = document.createElement('th');
                headerDataSOAP.appendChild(
                                document.createTextNode("SOAP"));
                headerRow.appendChild(headerDataSOAP);
                methodTable.appendChild(headerRow);
                // GetCapabilities operation!
                var capabilitiesRow = document.createElement('tr');
                var capabilitiesRowName = document.createElement('td');
                capabilitiesRowName.appendChild(
                                document.createTextNode("GetCapabilities"));
                capabilitiesRow.appendChild(capabilitiesRowName);
                for(var i=0; i<methods.length; i++) {
                        var input = document.createElement('input');
                        input.type = 'radio';
                        input.name = 'GetCapabilities';
                        input.value = methods[i];
                        input.client = this;
                        OpenLayers.Event.observe(input, "click",
                    OpenLayers.Function.bindAsEventListener(
                                                this.changeCapabilitiesMethodClick, input));
                        if(i==0) {
                                input.checked = true;
                        } else {
                                input.checked = false;
                        }
                        var inputTableData = document.createElement('td');
                        inputTableData.appendChild(input);
                        capabilitiesRow.appendChild(inputTableData);
                }
                methodTable.appendChild(capabilitiesRow);
                // DescribeProcess operation!
                var describeRow = document.createElement('tr');
                var describeRowName = document.createElement('td');
                describeRowName.appendChild(
                                document.createTextNode("describeProcess"));
                describeRow.appendChild(describeRowName);
                for(var i=0; i<methods.length; i++) {
                        var input = document.createElement('input');
                        input.type = 'radio';
                        input.name = 'DescribeProcess';
                        input.value = methods[i];
                        input.client = this;
                        OpenLayers.Event.observe(input, "click",
                    OpenLayers.Function.bindAsEventListener(
                                                this.changeDescribeProcessMethodClick, input));
                        if(i==0) {
                                input.checked = true;
                        } else {
                                input.checked = false;
                        }
                        var inputTableData = document.createElement('td');
                        inputTableData.appendChild(input);
                        describeRow.appendChild(inputTableData);
                }
                methodTable.appendChild(describeRow);
                // Execute operation!
                var executeRow = document.createElement('tr');
                var executeRowName = document.createElement('td');
                executeRowName.appendChild(
                                document.createTextNode("Execute"));
                executeRow.appendChild(executeRowName);
                for(var i=0; i<methods.length; i++) {
                        var input = document.createElement('input');
                        input.type = 'radio';
                        input.name = 'Execute';
                        input.value = methods[i];
                        // input.client = this;
                        OpenLayers.Event.observe(input, "click",
                    OpenLayers.Function.bindAsEventListener(
                                                this.changeExecuteMethodClick, input));
                        if(i==1) {
                                input.checked = true;
                        } else {
                                input.checked = false;
                        }
                        var inputTableData = document.createElement('td');
                        inputTableData.appendChild(input);
                        executeRow.appendChild(inputTableData);
                }
                methodTable.appendChild(executeRow);
                methodTable.className = "verticalArray";
                var outerDiv = document.createElement('div');
                var innerDiv = document.createElement('div');
                innerDiv.className = "dataTable";
                innerDiv.appendChild(methodTable);
                this.getFoldingLabelForDiv(outerDiv, innerDiv, "Settings ", false);
                return outerDiv;
        },

        /**
         * Method: getFoldingLabelForDiv
         *
         * Parameters:
         * outerDiv - {DOMElement}
         * innerDiv - {DOMElement}
         * divLabel - {String}
         * visibility - {Boolean}
         */
        getFoldingLabelForDiv:function(outerDiv, innerDiv, divLabel, visibility) {
                // Create a label.
                var lab = document.createElement('h1');
                lab.className = 'wpsMainLabel';
                // Folding
                var foldingImg = document.createElement('img');
                if(visibility) {
                        foldingImg.src = "img/xmlViewerArrowDown.png";
                        foldingImg.setAttribute('alt', 'Hide');
                        innerDiv.style.display = 'block';

                } else {
                        foldingImg.src = "img/xmlViewerArrowRight.png";
                        foldingImg.setAttribute('alt', 'Show');
                        innerDiv.style.display = 'none';
                }
                foldingImg.div = innerDiv;
                OpenLayers.Event.observe(foldingImg, "click",
                    OpenLayers.Function.bindAsEventListener(
                                                this.foldingImageClick, foldingImg));
                lab.appendChild(document.createTextNode(divLabel));
                lab.appendChild(foldingImg);
                outerDiv.appendChild(lab);
                outerDiv.appendChild(innerDiv);
        },

        executeButtonClick:function() {
                if(this.processSelection.selectedIndex >= 0) {
                        var serviceURL = this.serviceList.options[
                                this.serviceList.selectedIndex].value;
                        var wpsService = this.wpsServiceContainer.getService(serviceURL);
                        var processIdentifier = this.processSelection.options[
                                        this.processSelection.selectedIndex].value;
                        var executionObject = wpsService.execute(processIdentifier,
                                        this.executeMethod,
                                        document.getElementById('execute_request_popup').checked,
                                        document.getElementById('execute_response_popup').checked);
                        this.runningExecutionsDiv.getElementsByTagName('table')[0].
                                        appendChild(executionObject.getStatusTableRow());
                        this.runningExecutionsDiv.style.display = 'block';
                } else {
                        this.updateInfoText("Execute-operation could not be called as an " +
                                        "process is not selected!", "green");
                }
        },

        descriptionButtonClick:function() {
                var processIdentifiers = new Array();
                processIdentifiers.push(this.processSelection.options[
                                this.processSelection.selectedIndex].value);
                var serviceURL = this.serviceList.options[
                                this.serviceList.selectedIndex].value;
                var wpsService = this.wpsServiceContainer.getService(serviceURL);
                wpsService.popupProcessDescriptions(processIdentifiers,
                                this.describeProcessMethod);
        },

        addServiceButtonClick:function() {
                this.addService(this.serviceTextField.value);
        },

        removeServiceButtonClick:function() {
                if(this.serviceList != null && this.serviceList.options.length > 0
                                && this.serviceList.selectedIndex >= 0) {
                        var serviceURL = this.serviceList.options[
                                        this.serviceList.selectedIndex].value;
                        this.removeService(serviceURL);
                        this.updateInfoText("Service removed.", "green");
                } else {
                        this.updateInfoText("No service is selected to be removed!", "red");
                }
        },

        showCapabilitiesButtonClick:function() {
                if(this.serviceList &&
                                        this.serviceList.options.length > 0
                                        && this.serviceList.selectedIndex >= 0) {
                        var serviceURL = this.serviceList.options[
                                        this.serviceList.selectedIndex].value;
                        var service = this.wpsServiceContainer.getService(
                                        serviceURL);
                        service.popupServiceCapabilities(
                                        this.getCapabilitiesMethod);
                } else {
                        this.updateInfoText(
                                        "No service is selected to query capabilities!", "red");
                }
        },

        changeCapabilitiesMethodClick:function() {
                // this == capabilitiesMethodButton!
                this.client.getCapabilitiesMethod = this.value;
        },

        changeDescribeProcessMethodClick:function() {
                // this == describeProcessMethodButton!
                this.client.describeProcessMethod = this.value;
        },

        changeExecuteMethodClick:function() {
                // this == executeMethodButton!
                this.client.executeMethod = this.value;
        },

        foldingImageClick:function() {
                if(this.div.style.display == 'none') {
                        this.src = "img/xmlViewerArrowDown.png";
                        this.div.style.display = 'block';
                        this.div.setAttribute('alt', 'Hide');
                } else {
                        this.src = "img/xmlViewerArrowRight.png";
                        this.div.style.display = 'none'
                        this.div.setAttribute('alt', 'Show');
                }

        },

        /**
     * Method: ignoreEvent
     *
     * Parameters:
     * event - {Event}
     */
    ignoreEvent:function(event) {
        OpenLayers.Event.stop(event);
    },

        CLASS_NAME:"WOC.WPSClient"
});

/**
* Constant: WOC.WPSClient.MAX_SHOWN_PROCESSES
*     Number of processes shown to the user on the interface at the same time
*     without a need to scroll.
* {Integer}
*/
WOC.WPSClient.MAX_SHOWN_PROCESSES = 1; // 4
/**
* Constant: WOC.WPSClient.MAX_SHOWN_SERVICES
*     Number of WPS srvice instances shown to the user on the interface at the same
*     time without a need to scroll.
* {Integer}
*/
WOC.WPSClient.MAX_SHOWN_SERVICES = 1; // 3
/**
* Constant: WOC.WPSClient.INITIAL_SERVICES
*     Services added to the client immediently while initializing the client..
* {Array of Strings}
*/
/*
WOC.WPSClient.INITIAL_SERVICES = [
                "http://10.60.0.25/wps/WebProcessingService",
                "http://geoserver.itc.nl:8080/wps100/WebProcessingService",
                "http://apps.esdi-humboldt.cz/cgi-bin/pywps_3_0"];
*/
WOC.WPSClient.INITIAL_SERVICES = [
"http://dnoces:8080/wps/WebProcessingService",
];


/**
* Constant: WOC.WPSClient.style
*     Different user interface styles.
* {Array of Objects}
*/
WOC.WPSClient.style = {
    'default': {
        fillColor: "#ee9900",
        fillOpacity: 0.5,
        hoverFillColor: "white",
        hoverFillOpacity: 0.8,
        strokeColor: "#ee9900",
        strokeOpacity: 1,
        strokeWidth: 4,
        strokeLinecap: "round",
        hoverStrokeColor: "red",
        hoverStrokeOpacity: 1,
        hoverStrokeWidth: 0.4,
        pointRadius: 6,
        hoverPointRadius: 1,
        hoverPointUnit: "%",
        pointerEvents: "visiblePainted",
        cursor: ""
    },
        'devel': {
        fillColor: "#FF0033",
        fillOpacity: 0.5,
        hoverFillColor: "red",
        hoverFillOpacity: 0.8,
        strokeColor: "#FF0033",
        strokeOpacity: 1,
        strokeWidth: 4,
        strokeLinecap: "round",
        hoverStrokeColor: "white",
        hoverStrokeOpacity: 1,
        hoverStrokeWidth: 0.4,
        pointRadius: 6,
        hoverPointRadius: 1,
        hoverPointUnit: "%",
        pointerEvents: "visiblePainted",
        cursor: ""
    },
        'angel': {
        fillColor: "#3300CC",
        fillOpacity: 0.4,
        hoverFillColor: "blue",
        hoverFillOpacity: 0.8,
        strokeColor: "#3300CC",
        strokeOpacity: 1,
        strokeWidth: 1,
        strokeLinecap: "round",
        hoverStrokeColor: "white",
        hoverStrokeOpacity: 1,
        hoverStrokeWidth: 0.4,
        pointRadius: 6,
        hoverPointRadius: 1,
        hoverPointUnit: "%",
        pointerEvents: "visiblePainted",
        cursor: ""
    }
};
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.BBOXButton
 *     A button to determine the bounding box for input.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.2 / 7.10.2008
 */
WOC.BBOXButton = OpenLayers.Class({

        /**
     * Constructor: WOC.BBOXButton
         *
     */
        initialize:function(map, bboxLayer, button, control) {
                /**
                * Variable: bbox
                * {WOC.BBOX} The bounding box.
                */
                var bbox = new WOC.BBOX();
                // Convert the map's projection into an projection object.
                bbox.setProjection(new OpenLayers.Projection(map.projection, null));
        var polygonHandler = new OpenLayers.Handler.RegularPolygon(control, 
                    {}, {sides: 4, irregular: true, persist:true});
        
                this.onclick = function() {
                        this.setActivated(!control.active);
                }
                
                this.updateBounds = function(event) {
                        if(polygonHandler.feature && polygonHandler.feature.geometry) {
                    bboxLayer.clearMarkers();
                    var bounds = polygonHandler.feature.geometry.getBounds();
                    // Because we use persist, we need to clear the handler's feature!
                    polygonHandler.clear();
                    var box = new OpenLayers.Marker.Box(bounds, button.style.color, 2);
                    bboxLayer.addMarker(box);
                    bboxLayer.redraw();
                    bbox.setBounds(bounds);
                    // bbox.setProjection(polygonHandler.feature.layer.projection);
            }
            OpenLayers.Event.stop(event, true);
                }
                
                /**
                 * Method: isActivated
                 *     Tells if the button is activated.
                 *
                 * Returns:
                 * {Boolean} True if activated, else false.
                 */
                this.isActivated = function() {
                        return control.active;
                }
                
                /**
                 * Method: setActivated
                 *     Sets the button's activation.
                 *
                 * Parameters :
                 * rule - {Boolean} True if activated, else false.
                 */
                this.setActivated = function(rule) {
                        if(rule) {
                                control.activate();
                                polygonHandler.activate();
                                map.events.register('mouseup', map, this.updateBounds);
                                button.style.fontWeight = 'bold';
                        } else {
                                control.deactivate();
                                polygonHandler.deactivate();
                                button.style.fontWeight = 'normal';
                                map.events.unregister('mouseup', map, this.updateBounds);
                        }
                }
                
                /**
                 * Method: getBBOX
                 *     Returns the bounding box.
                 *
                 * Returns:
                 * {WOC.BBOX} The bounding box.
                 */
                this.getBBOX = function() {
                        return bbox;
                }
        },
        CLASS_NAME:"WOC.BBOXButton"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.BBOX
 *     A bounding box.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.2 / 7.10.2008
 */
WOC.BBOX = OpenLayers.Class({

        /**
     * Constructor: WOC.BBOX
         *
     */
        initialize:function() {
                /**
                * Variable: projection
                * {OpenLayers.Projection} The spatial reference system.
                */
                var projection = null;
                /**
                * Variable: bounds
                * {OpenLayers.Bounds} The bounding box's bounds.
                */
                var bounds = null;
                
                /**
                 * Method: getProjection
                 *     Returns the bounding box's projection.
                 *
                 * Returns:
                 * {OpenLayers.Projection} The spatial reference system. Null is
                 *     a projection has not been defined!
                 */
                this.getProjection = function() {
                        return projection;
                }
                
                /**
                 * Method: setProjection
                 *     Sets the bounding box's projection.
                 *
                 * Parameters:
                 * s - {OpenLayers.Projection} The spatial reference system.
                 * 
                 * Throws:
                 * 'WrongArgumentEx' In case the argument is not an 
                 *     OpenLayers.Projection
                 */
                this.setProjection = function(srs) {
                        if(srs.CLASS_NAME == "OpenLayers.Projection") {
                                projection = srs;
                        } else {
                                throw 'WrongArgumentEx';
                        }
                }
                
                /**
                 * Method: getBounds
                 *     Returns the bounds of the bounding box.
                 *
                 * Returns:
                 * {OpenLayers.Bounds} The bounding box's bounds.
                 */
                this.getBounds = function() {
                        return bounds;
                }
                
                /**
                 * Method: setBounds
                 *     Sets the bounds of the bounding box.
                 *
                 * Parameters:
                 * b - {OpenLayers.Bounds} The bounding box's bounds.
                 */
                this.setBounds = function(b) {
                        bounds = b;
                }
        },
        CLASS_NAME:"WOC.BBOX"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.VectorStoringGML
 *     Create a vector layer by parsing a GML file. The GML file is passed in 
 *     as a parameter.
 *
 * Inherits from:
 *     <OpenLayers.Layer.Vector>
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.VectorStoringGML = OpenLayers.Class(OpenLayers.Layer.Vector, {
    /**
    * Property: gmlData
    * {type} String
    */
    gmlData: "",

    /**
    * Constructor: WOC.VectorStoringGML
        *
        * Parameters:
        * name - {String} Name of the layer.
    * options - {Object} Hashtable of extra options to tag onto the layer.
    */
    initialize:function(name, options) {
        var newArguments = [];
        newArguments.push(name, options);
        OpenLayers.Layer.Vector.prototype.initialize.apply(this, newArguments);
    },
        
        /**
        * Method: setGML
        *
        * Parameters:
        * {String} GML data.
        */
        setGML:function(data) {
                this.gmlData = data;
        },
        
        /**
        * Method: getGML
        *
    * Returns:
        * {String} GML data used to create the layer.
        */
        getGML:function() {
                return this.gmlData;
        },
    CLASS_NAME: "WOC.VectorStoringGML"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.ExceptionReport
 *     Contains information needed to inform the user of exceptions and 
 *     warnings.
 * 
 * Currently allowed exception codes include
 *     {WrongNamespaceEx} The namespace is wrong! Like mixing wps, ogc or 
 *         ows namespaces.
 *     {ElementMissingEx} A mandatory element is missing.
 *     {AttributeMissingEx} A mandatory attribute is missing from the element.
 *     {TextNodeMissingEx} An element is empty even if it should include 
 *         something.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.ExceptionReport = OpenLayers.Class({
        /**
     * Constructor: WOC.ExceptionReport
         *
         * Parameters:
         * exceptionCode - {String} Code of the exception.
     * exceptionTexts - {Array{String}} Array of exception descriptions.
         * time - {Date} Time and date when the exception occured.
     */
        initialize:function(code, texts, time) {
                /**
                * Variable: exceptionTexts
                * {Array{String}} Array of exception descriptions.
                */
                var exceptionTexts = texts;
                /**
                * Variable: exceptionCode
                * {String} Code of the exception.
                */
                var exceptionCode = code;
                /**
                * Variable: time
                * {Date} Time and date when the exception occured.
                */
                var time = time
                
                /**
                 * Method: getExceptionCode
                 *     Returns a code for the exception.
                 *
                 * Returns:
                 * {String}
                 */
                this.getExceptionCode = function() {
                        return exceptionCode;
                }
                
                /**
                 * Method: getExceptionTexts
                 *     Returns an array of exception descriptions
                 *
                 * Returns:
                 * {Array of Strings}
                 */
                this.getExceptionTexts = function() {
                        return exceptionTexts;
                }
                
                /**
                 * Method: getTime
                 *     Returns the time and date when the exception occured.
                 *
                 * Returns:
                 * {Date}
                 */
                this.getTime = function() {
                        return time;
                }
        },
        CLASS_NAME:"WOC.ExceptionReport"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.popupXML
 *     Handling and viewing XML.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
 
/**
 * Function: WOC.popupXML
 *     Shows an XML document in an popup window for the user.
 *
 * Parameters:
 * popupTitle - {String} Title to show.
 * domRoots - {Array of DOMElements} The DOMElements, which are shown to the 
 *     user.
 */
WOC.popupXML = function(popupTitle, domRoots) {
        var width  = 820;
        var height = 600;
        var left = (screen.width  - width)/2;
        var top = (screen.height - height)/2;
        var params = 'width='+width+', height='+height;
        params += ', top='+top+', left='+left;
        params += ', directories=no';
        params += ', location=no';
        params += ', menubar=no';
        params += ', resizable=yes';
        params += ', scrollbars=yes';
        params += ', status=yes';
        params += ', toolbar=yes';
        var newwin = window.open('', "_blank", params);
        var d = newwin.document;
        // Because the name has whitespace it has to be set here!
        newwin.name = popupTitle;
        d.open("text/html","replace");
        var wpsScriptElem = d.createElement('script');
        wpsScriptElem.setAttribute('type', 'text/javascript');
        wpsScriptElem.appendChild(d.createTextNode(
                        ' function updateVisibility(node) {' +
                        '        var sibling = node.nextSibling;' +
                        '        while(sibling) {' +
                        '                if(sibling.nodeName.toLowerCase() == "div") {' +
                        '                        if(sibling.style.display == "none") {' +
                        '                                sibling.style.display = "block";' +
                        '                                node.src = "img/xmlViewerArrowDown.png";' +
                        '                                node.alt = "Hide children";' +
                        '                        } else {' +
                        '                                sibling.style.display = "none";' +
                        '                                node.src = "img/xmlViewerArrowRight.png";' +
                        '                                node.alt = "Show children";' +
                        '                        }' +
                        '                        return;' +
                        '                } else if(sibling.nodeName.toLowerCase() == "img") {' +
                        '                        return;' +
                        '                } else {' +
                        '                        sibling = sibling.nextSibling;' +
                        '                }' +
                        '        }' +
                        '}'));
        var styleLink = d.createElement('link');
        styleLink.rel = 'stylesheet';
        styleLink.type = 'text/css';
        styleLink.href = 'style/wpsStyle.css';
        styleLink.media = 'screen';
        var layoutLink =d.createElement('link');
        layoutLink.rel = 'stylesheet';
        layoutLink.type = 'text/css';
        layoutLink.href = 'layout/wpsLayout.css';
        layoutLink.media = 'screen';
        newwin.document.write("<html><head>" +
                WOC.xml2Str(wpsScriptElem) +
                WOC.xml2Str(styleLink) +
                WOC.xml2Str(layoutLink) +
                "<title>" + popupTitle + "</title>" +
                "</head><body><h1>" + popupTitle + "</h1>");
        for(var i=0; i<domRoots.length; i++) {
                if(i!=0) {
                        newwin.document.write("<hr width=\"100%\" size=\"2\"" +
                                        "color=\"green\" align=\"center\">");
                }
                var htmlDiv = d.createElement('div');
                htmlDiv.className = 'xmlMainViewer';
                WOC.addXMLToFormatedHTML(d, domRoots[i], htmlDiv);
                newwin.document.write(WOC.xml2Str(htmlDiv));
        }
        newwin.document.write("</body></html>");
        newwin.document.close();
        if (window.focus) {
                newwin.focus();
        }
}

/**
* Function: WOC.addXMLToFormatedHTML
*     Recursive method to add the source XML root node to the target 
*     node as HTML formated for viewing.
* 
* Parameters:
* d - {Document} Document that is used to create new DOMElements.
* sourceNode - {DOMElement} The source DOMElement of an XML document, whose 
*     content is added to to the target DOMElement of an HTML document
* targetNode - {DOMElement} The target DOMElement (part of an HTML document) to 
*     which one the source DOMElement's (XML) content is added.
*/
WOC.addXMLToFormatedHTML = function(d, sourceNode, targetNode) {
        // Image for dropdown
        if(sourceNode.hasChildNodes()) {
                var dropdownImage = d.createElement('img');
                dropdownImage.src = "img/xmlViewerArrowDown.png";
                dropdownImage.setAttribute('onclick', 'updateVisibility(this)');
                dropdownImage.setAttribute('alt', 'Hide children');
                targetNode.appendChild(dropdownImage);
        } 
        // Span creates an inline logical division.
        var beginTagBeginSpan = d.createElement('span');
        beginTagBeginSpan.className = 'xmlViewerTagSymbol';
        beginTagBeginSpan.appendChild(d.createTextNode('<'));
        targetNode.appendChild(beginTagBeginSpan);
        var beginTagNameSpan = d.createElement('span');
        beginTagNameSpan.className = 'xmlViewerNodeName';
        beginTagNameSpan.appendChild(
                        d.createTextNode(sourceNode.nodeName));
        targetNode.appendChild(beginTagNameSpan);
        // Attributes
        if(sourceNode.hasAttributes()) {
                for(var i=0; i<sourceNode.attributes.length; i++) {
                        var attributeNameSpan = d.createElement('span');
                        attributeNameSpan.className = 'xmlViewerAttrName';
                        attributeNameSpan.appendChild(d.createTextNode(' ' +
                                        sourceNode.attributes.item(i).nodeName));
                        targetNode.appendChild(attributeNameSpan);
                        var attributeEqualsSpan = d.createElement('span');
                        attributeEqualsSpan.appendChild(d.createTextNode('='));
                        targetNode.appendChild(attributeEqualsSpan);
                        var attributeValueSpan = d.createElement('span');
                        attributeValueSpan.className = 'xmlViewerAttrValue';
                        var attrValue = '"' + sourceNode.attributes.item(i).nodeValue + '"';
                        attributeValueSpan.appendChild(d.createTextNode(attrValue));
                        targetNode.appendChild(attributeValueSpan);
                }
        }
        // Ending the begin tag!
        var beginTagEndSpan = d.createElement('span');
        beginTagEndSpan.className = 'xmlViewerTagSymbol';
        if(sourceNode.hasChildNodes()) {
                beginTagEndSpan.appendChild(d.createTextNode('>'));
        } else {
                beginTagEndSpan.appendChild(d.createTextNode(' />'));
        }
        targetNode.appendChild(beginTagEndSpan);
        if(!sourceNode.hasChildNodes()) {
                targetNode.appendChild(d.createElement('br'));
        }
        // Children ... recursive call.
        if(sourceNode.hasChildNodes()) {
                var htmlDiv = d.createElement('div');
                htmlDiv.className = 'xmlViewer';
                for(var i=0; i<sourceNode.childNodes.length; i++) {
                        if(sourceNode.childNodes.item(i).nodeType == 
                                        d.ELEMENT_NODE) {
                                WOC.addXMLToFormatedHTML(d, sourceNode.childNodes.item(i),
                                                htmlDiv);
                        } else if(sourceNode.childNodes.item(i).nodeType == 
                                        d.TEXT_NODE) {
                                htmlDiv.appendChild(d.createTextNode(
                                                sourceNode.childNodes.item(i).nodeValue));
                        }
                        // COMMENT_NODE ?
                }
                targetNode.appendChild(htmlDiv);
                // End tag
                var endTagBeginSpan = d.createElement('span');
                endTagBeginSpan.className = 'xmlViewerTagSymbol';
                endTagBeginSpan.appendChild(d.createTextNode('</'));
                targetNode.appendChild(endTagBeginSpan);
                var endTagNameSpan = d.createElement('span');
                endTagNameSpan.className = 'xmlViewerNodeName';
                endTagNameSpan.appendChild(d.createTextNode(sourceNode.nodeName));
                targetNode.appendChild(endTagNameSpan);
                var endTagEndSpan = d.createElement('span');
                endTagEndSpan.className = 'xmlViewerTagSymbol';
                endTagEndSpan.appendChild(d.createTextNode('>'));
                targetNode.appendChild(endTagEndSpan);
                targetNode.appendChild(d.createElement('br'));
        }
}
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/
 
/**
 * Class: WOC.Format
 *     The format of complex data.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.Format = OpenLayers.Class({
        /**
     * Constructor: WOC.Format
         */
        initialize: function() {
                /**
                * Variable: mimeType
                * {String} The MIME type of the complex data.
                * 
                * See: ows:MimeType / wps:ComplexDataDescriptionType
                */
                
                var mimeType = "";
                /**
                * Variable: schema
                * {String} The schema type of the complex data.
                * 
                * See: wps:ComplexDataDescriptionType
                */
                var schema = "";
                
                /**
                * Variable: encoding
                * {String} The encoding type of the complex data.
                * 
                * See: wps:ComplexDataDescriptionType
                */
                var encoding = "";
                
                /**
                * Method: parseFromNode
                *     Parses the format from the given node.
                *
                * Parameters:
                * node - {DOMElement} The element from which the format is parsed.
                *     The element can be for example a wps:Format element.
                * 
                * Returns:
                * {Array{WOC.ExceptionReport}} Occured warnings. Can be an empty array!
                */
                this.parseFromNode = function(node) {
                        var warnings = new Array();
                        // Lets try the OWS namespace!
                        var mimeTypeNodeList = WOC.getElementsByTagNameNS(node, 
                                        WOC.OWS_NAMESPACE, WOC.OWS_PREFIX, 
                                        'MimeType');
                                        
                        if(!mimeTypeNodeList || mimeTypeNodeList.length==0) {
                                mimeTypeNodeList = WOC.getElementsByTagNameNS(node, 
                                                WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 
                                                'MimeType');
                                if(!mimeTypeNodeList || mimeTypeNodeList.length==0) {
                                        warnings.push(new WOC.ExceptionReport(
                                                        "ElementMissingEx", 
                                                        "The MIME type of format is missing!", new Date()));
                                        return;
                                } else {
                                        warnings.push(new WOC.ExceptionReport(
                                                        "WrongNamespaceEx", 
                                                        "The namespace of the MIME type in format should " +
                                                        " be the OWS's, but is the WPS's!", new Date()));
                                }
                        }
                        mimeType = mimeTypeNodeList[0].firstChild.nodeValue;
                        // Encoding and schema are optional!
                        var encodings = WOC.getElementsByTagNameNS(node, 
                                        WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 
                                        'Encoding');
                        if(encodings != null && encodings.length > 0) {
                                encoding = encodings[0].firstChild.nodeValue;
                        }
                        var schemas = WOC.getElementsByTagNameNS(node, 
                                        WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 
                                        'Schema');
                        if(schemas != null && schemas.length > 0) {
                                schema = schemas[0].firstChild.nodeValue;
                        }
                        return warnings;
                }
                
                /**
                * Method: getMimeType
                *     Returns the MIME type of the format.
                *
                * Returns:
                * {String} MIME type.
                */
                this.getMimeType = function() {
                        return mimeType;
                }
                
                /**
                * Method: getSchema
                *     Returns the schema of the format.
                *
                * Returns:
                * {String} Schema.
                */
                this.getSchema = function() {
                        return schema;
                }
                
                /**
                * Method: getEncoding
                *     Returns the encoding of the format.
                *
                * Returns:
                * {String} Éncoding.
                */
                this.getEncoding = function() {
                        return encoding;
                }
        },
        CLASS_NAME:"WOC.ComplexData"
});
                                
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.UoM
 *     Handles the Units of Measure (UoM).
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.2 / 25.09.2008
 */
WOC.UoM = OpenLayers.Class({
        /**
     * Constructor: WOC.UoM
         *
         * Parameters:
         * n - {String} Name of the Unit of Measure.
         * r - {String} Reference to the unit. Can be null!
         */
        initialize: function(n, r) {
                /**
                 * Variable: name
                 * {String} Name of the unit of measure.
                 */
                var name = n;
                /**
                 * Variable: reference
                 * {String} Reference to the unit.
                 */
                var reference = r;
                
                /**
                 * Method: getName
                 *     Returns the UoM's name.
                 *
                 * Returns:
                 * {String} Name of the Unit of Measure.
                 */
                this.getName = function() {
                        return name;
                }
                
                 /**
                 * Method: getReference
                 *     Returns the UoM's reference.
                 *
                 * Returns:
                 * {String} Reference of the Unit of Measure. Can be null!
                 */
                this.getReference = function() {
                        return reference;
                }
        },
        
        CLASS_NAME:"WOC.UoM"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.DataType
 *     Data type of literal data.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.2 / 25.09.2008
 */
WOC.DataType = OpenLayers.Class({
        /**
     * Constructor: WOC.DataType
         *
         * Parameters:
         * n - {String} Name of the data type.
         * ref - {String} Reference to the data type. Can be null!
         */
        initialize: function(n, r) {
                /**
                 * Variable: name
                 * {String} Name of the data type.
                 */
                var name = n;
                /**
                 * Variable: reference
                 * {String} Reference to the data type.
                 */
                var reference = r;
                
                /**
                 * Method: getName
                 *     Returns the data types name.
                 *
                 * Returns:
                 * {String} Name of the data type.
                 */
                this.getName = function() {
                        return name;
                }
                
                 /**
                 * Method: getReference
                 *     Returns the data type's reference.
                 *
                 * Returns:
                 * {String} Reference of the data type. Can be null!
                 */
                this.getReference = function() {
                        return reference;
                }
        },
        
        CLASS_NAME:"WOC.DataType"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/
 
/**
 * Class: WOC.ComplexData
 *     Handles WPS complex data.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.ComplexData = OpenLayers.Class({
        /**
     * Constructor: WOC.ComplexData
         */
        initialize: function() {
                /**
                 * Variable: formats
                 * {Array{WOC.Format}} An array of allowed formats.
                 *     The first is the default choice.
                 */
                var formats = new Array();
                /**
                 * Variable: maximumMegabytes
                 * {Double} The allowed size of the data in megabytes.
                 *     By default the size is set to zero -> Any sized files are allowed!
                 */
                var maximumMegabytes = 0;
                
                /**
                 * Method: parseFromNode
                 *     Parses the object data from an input/output form choice's
                 *     complex data structure.
                 *
                 * Parameters:
                 * complexDataNode - {DOMElement} A node, from which the objects
                 *      properties are parsed, like the wps:ComplexData element.
                 */
                this.parseFromNode = function(complexDataNode) {
                        var format = new WOC.Format();
                        // Reading the formats!
                        // Default format.
                        var def = WOC.getElementsByTagNameNS(
                                        complexDataNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'Default')[0];
                        var formatNode = WOC.getElementsByTagNameNS(
                                        def, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'Format')[0];
                        format.parseFromNode(formatNode);
                        formats.push(format);
                        // Supported formats.
                        var sup = WOC.getElementsByTagNameNS(
                                        complexDataNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'Supported')[0];
                        var supportedFormatNodes = WOC.getElementsByTagNameNS(
                                        sup, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'Format');
                        for(var k=0; k<supportedFormatNodes.length; k++) {
                                format = new WOC.Format();
                                format.parseFromNode(supportedFormatNodes[k]);
                                formats.push(format);
                        }
                        // Maximum megabytes
                        if(complexDataNode.hasAttribute('maximumMegabytes')) {
                                maximumMegabytes = complexDataNode.attributes.getNamedItem(
                                                'maximumMegabytes').nodeValue;
                        }
                }
                
                /**
                 * Method: getFormats
                 *     Returns the formats.
                 *
                 * Returns:
                 * {Array{WOC.Format}} An array of allowed formats.
                 *     The first is the default choice.
                 */
                this.getFormats = function() {
                        return formats;
                }
                
                /**
                 * Method: getMaximumMegabytes
                 *     Returns the maximum allowed size of the data in megabytes
                 *
                 * Returns:
                 * {Double} The allowed size of the data in megabytes.
                 *     If the size is 0, then any sized files are allowed!
                 */
                this.getMaximumMegabytes = function() {
                        return maximumMegabytes;
                }
                
                /**
                * Method: createDescriptionTableData
                *     Creates a description of the data into a table data (td) element.
                * 
                * Parameters: 
                * td - {DOMElement} Table data, where the description is put.
                * id - {String} The identifier of the data.
                * map - {OpenLayers.Map} The map for which the descriptions are made.
                */
                this.createDescriptionTableData = function(td, id, map) {
                        var xmlSupported = false;
                        var imageDataSupported = false;
                        for(var j=0; j<formats.length; j++) {
                                var defaultMimeType = formats[j].getMimeType().toLowerCase();
                                if(defaultMimeType == "text/xml") {
                                        // WFS format!
                                        xmlSupported = true;
                                } else if(defaultMimeType == "image/jpeg" ||
                                                defaultMimeType == "image/gif" ||
                                                defaultMimeType == "image/png" ||
                                                defaultMimeType == "image/png8" ||
                                                defaultMimeType == "image/tiff" ||
                                                defaultMimeType == "image/tiff8" ||
                                                defaultMimeType == "image/geotiff" ||
                                                defaultMimeType == "image/geotiff8" ||
                                                defaultMimeType == "image/svg") {
                                                // defaultMimeType == "application/pdf" ||
                                                // defaultMimeType == "application/openlayers")  {
                                        // WMS formats!
                                        imageDataSupported = true;
                                }
                        }
                        var selectList = document.createElement('select');
                        selectList.style.width = '100%';
                        selectList.name = id;
                        selectList.id = id;
                        if(xmlSupported) {
                                for(var j=0; j<map.layers.length; j++) {						// gehe durch alle layer der map
                                        var layerClassName = map.layers[j].CLASS_NAME;
                                        if(layerClassName == "OpenLayers.Layer.WFS" ||			// prüfe den class_name
                                           layerClassName == "OpenLayers.Layer.GML" ||
                                           layerClassName == "WOC.VectorStoringGML" ||
                                           layerClassName == "OpenLayers.Layer.Vector") {
                                                var option = document.createElement('option');
                                                option.value = map.layers[j].id;
                                                option.text = map.layers[j].name;
                                                selectList.appendChild(option);
                                        }
                                }
                        }
                        if(imageDataSupported) {
                                for(var j=0; j<map.layers.length; j++) {
                                        var layerClassName = this.map.layers[j].CLASS_NAME;
                                        if(layerClassName == "OpenLayers.Layer.WMS") {
                                                var option = document.createElement('option');
                                                option.value = map.layers[j].id;
                                                option.text = map.layers[j].name;
                                                selectList.appendChild(option);
                                        }
                                }
                        }
                        td.appendChild(selectList);
                }
                
                /**
                * Method: getInputXMLStrFromDOMElement
                *     Sets the complex input data into the XML string that is returned.
                * Parameters:
                * element - {DOMElement} Element, whose value defines the selected
                *     layer.
                * map - {OpenLayers.Map} The map for which the input XML is made for.
                *
                * Returns:
                * {String} An XML string presenting what input is given.
                *
                * Throws:
                * {LayerNullEx} No layer could be found, which could be used
                *     to create the string.
                * {UnsupportedLayerTypeEx} The type of the selected layer is 
                *     unsupported. Supported layers include <OpenLayers.Layer.WFS>,
                *     <OpenLayers.Layer.WMS> and <WOC.VectorStoringGML>
                */
                this.getInputXMLStrFromDOMElement = function(element, map) {
                        var inputsXMLStr = "";
                        var optionIndex = element.options.selectedIndex;
                        var layerName = element.options[optionIndex].firstChild.nodeValue;
                        var layerValue = "";
                        if(element.options[optionIndex].hasAttribute('value')) {
                                layerValue = element.options[optionIndex].attributes.
                                                getNamedItem('value').nodeValue;
                        }
                        var layer = null;
                        for(var j=0; j<map.layers.length; j++) {
                                if(layerValue == "") {
                                        // Comparing layer names.
                                        if(map.layers[j].name == layerName) {
                                                layer = map.layers[j];
                                        }
                                } else {
                                        // Comparing layer id's. This is the default choice!
                                        if(map.layers[j].id == layerValue) {
                                                layer = map.layers[j];
                                        }
                                }
                        }
                        if(!layer) { 
                                throw 'LayerNullEx';
                        }
                        if(layer.CLASS_NAME == "OpenLayers.Layer.WFS") {
                                // reference to the original source is added to the request!
                                var referenceString = layer.getFullRequestString();				// example: "http://giv-wps.uni-muenster.de:8080/geoserver/wfs?typename=ns1%3Atasmania_roads&SERVICE=WFS&VERSION=1.0.0&REQUEST=GetFeature&SRS=EPSG%3A4326"
                                // The ampersand needs to be replaced!
                                //referenceString = referenceString.replace(/&/g,"&amp;");
                                // escape(referenceString); // Can't be used!!!
                                // referenceString = encodeURI(referenceString);
                                
                                // Check that the WMS or WFS supports the requested schema!
                                //
                                // The outputFormat attribute is used to specify what schema
                                // description language should be used to describe features.
                                // The default value of XMLSCHEMA means that the Web Feature
                                // Service must generate a GML2 application schema that can
                                // be used to validate the GML2 output of a GetFeature request
                                // or feature instances specified in Transaction operations.
                                var selectedSchema = "";
                                var selectedMimeType = "";
                                var selectedEncoding = "";
                                // Use GML2 schema if available.
                                for(var k=0; k<formats.length; k++) {
                                        var schema = formats[k].getSchema();
                                        if(schema != "" && schema.length > 32) {
                                                if(schema.substring(0,32) ==
                                                                "http://schemas.opengis.net/gml/2") {
                                                        selectedSchema = schema;
                                                        selectedMimeType = formats[k].getMimeType();
                                                        selectedEncoding = formats[k].getEncoding();
                                                        // Ending the loop. GML2 the favored schema!
                                                        k = formats.length;
                                                } else if(schema.substring(0,32) == 
                                                                "http://schemas.opengis.net/gml/3") {
                                                        selectedSchema = schema;
                                                        selectedMimeType = formats[k].getMimeType();
                                                        selectedEncoding = formats[k].getEncoding();
                                                }
                                        }
                                }
                                if(selectedSchema.length > 32) {
                                        // A schema was found!
                                        if(referenceString.toLowerCase().search("&outputformat") == -1) {
                                                // No output format has been defined!
                                                if(selectedSchema.substring(0,32) == 
                                                                "http://schemas.opengis.net/gml/2") {
                                                        referenceString += "&outputFormat=GML2";
                                                } else if(selectedSchema.substring(0,32) == 
                                                                "http://schemas.opengis.net/gml/3") {
                                                        referenceString += "&outputFormat=GML3";
                                                }
                                        } else {
                                                // Output format has already been defined.
                                                // TODO Replace the old output format!?!?
                                                
                                                
                                                
                                        }
                                } else {
                                        // TODO No schema was found for the complex data!
                                        
                                        
                                        
                                }
                                if(referenceString.search("&BBOX") == -1) {
                                        // No bounding box is used!
                                        referenceString += "&BBOX=" + layer.getExtent().toBBOX(9);
                                        // referenceString += "&amp;BBOX=" + layer.getExtent().toBBOX(9);
                                }
                                //referenceString = referenceString.replace(/&/g,"&amp;");
                                //.replace(/=/g,"%3D");
                                //selectedMimeType = selectedMimeType.replace(/&/g,"&amp;");
                                //.replace(/=/g,"%3D");
                                //selectedSchema = selectedSchema.replace(/&/g,"&amp;");
                                //.replace(/=/g,"%3D");
                                //selectedEncoding = selectedEncoding.replace(/&/g,"&amp;");
                                //.replace(/=/g,"%3D");
                                inputsXMLStr += "<wps:Reference";
                                // MIME type, encoding, schema (optional)!
                                if(selectedMimeType != "") {
                                        inputsXMLStr += " mimeType=\"" + selectedMimeType + "\"";
                                        if(selectedSchema != "") {
                                                inputsXMLStr += " schema=\"" + selectedSchema + "\"";
                                        }
                                        if(selectedEncoding != "") {
                                                inputsXMLStr += " encoding=\"" + selectedEncoding + "\"";
                                        }
                                }
                                inputsXMLStr += " xlink:href=\"" + referenceString + "\"";
                                // The default method is GET and we will use it!
                                inputsXMLStr += " method=\"GET\"";
                                inputsXMLStr += " />";
                        } else if(layer.CLASS_NAME == "OpenLayers.Layer.Vector") {
                        	// WFS requested layerdata
                        	
                        	// #### Reference approach ###### reference to the original source is added to the request! WFS                       	
                        	var wfsReference = layer.protocol.url+"?";
                        	wfsReference += "SERVICE=WFS&";
                        	wfsReference += "VERSION=1.0.0&";
                        	wfsReference += "REQUEST=GetFeature&"
                        	wfsReference += "TYPENAME=";
                        		var featureNsSplit = layer.protocol.featureNS.split("/");		// "http://www.openplans.org/ns1" => split
                        		var featureNS = featureNsSplit[featureNsSplit.length-1];		// TODO: dirty hack
                        		wfsReference += featureNS+":"+layer.protocol.featureType+"&";	// example: ns1:tasmania_roads
                        	wfsReference += "SRS="+layer.protocol.srsName+"&";
                        	wfsReference += "OUTPUTFORMAT=GML3";
                        	
                        	wfsReference = wfsReference.replace(/&/g,"&amp;");//.replace(/=/g,"%3D");
                        																	/* example: http://giv-wps.uni-muenster.de:8080/geoserver/wfs?
                            																*			typename=ns1%3Atasmania_roads&
                            																*			SERVICE=WFS&
                            																*			VERSION=1.0.0&
                            																*			REQUEST=GetFeature&
                            																*			SRS=EPSG%3A4326
                            																*/
                            																/* 		    http://ows7.lat-lon.de/haiti-wfs/services?
                            																 * 			service=WFS&amp;
                            																 * 			request=getfeature&amp;
                            																 * 			typename=app:hti_wellsprp_well_minustah&amp;
                            																 *	 		outputFormat=GML3&amp;
                            																 * 			version=1.1.0"
                            																 */
                            inputsXMLStr += "<wps:Reference";
                            inputsXMLStr += " schema=\"http://schemas.opengis.net/gml/3.1.1/base/feature.xsd\"";
                            inputsXMLStr += " xlink:href=\"" + wfsReference + "\"";
                            // The default method is GET and we will use it!
                            inputsXMLStr += " method=\"GET\"";								// TODO: POST METHOD!
                            inputsXMLStr += " />";
                        	
                        	/* #### GML ANSATZ #####
                            if(layer.features.length != 0) {
                                inputsXMLStr += "<wps:Data><wps:ComplexData";
                                // MIME type, encoding, schema (optional)!
                                // inputsXMLStr += " mimeType=\"text/XML\"";
                                inputsXMLStr += " mimeType=\"text/xml\"";
                                //inputsXMLStr += " schema=\"http://schemas.opengis.net/gml/2.1.2/feature.xsd\"";		// TODO
                                inputsXMLStr += " schema=\"http://schemas.opengis.net/gml/3.1.1/base/feature.xsd\"";
                                // inputStr += " encoding=\"\"";
                                inputsXMLStr += ">";
								
                                // getting the GML data from the OpenLayers.Layer.Vector
                                var format = new OpenLayers.Format.GML.v3;					// GML3 writer TODO
                                var layerGML = format.write(layer.features);
								if(layerGML.match(/&amp;/g) == null){
									layerGML = layerGML.replace(/&/g,"&amp;");
								}
								else if(layerGML.match(/-/g) != null){
									layerGML = layerGML.replace(/-/g,"&#45;");
								}
                                inputsXMLStr += layerGML;
                                inputsXMLStr += "</wps:ComplexData></wps:Data>";
                            }*/
                       	
                        }
                        else if(layer.CLASS_NAME == "OpenLayers.Layer.WMS") {
                                // reference to the original source is added to the request!
                                var referenceString = layer.getFullRequestString();
                                // Create a bounding box for the current view!
                                if(referenceString.search("&BBOX") == -1) {
                                        // No bounding box is used!
                                        referenceString += "&BBOX=" + 
                                                encodeURI(layer.getExtent().toBBOX(9));
                                }
                                referenceString = referenceString.replace(/&/g,"&amp;");
                                inputsXMLStr += "<wps:Reference";
                                // TODO MIME type, encoding, schema (optional) to referenced WMS query!
                                
                                
                                
                                inputsXMLStr += " xlink:href=\"" + referenceString + "\"";
                                // The default method is GET and we will use it!
                                inputsXMLStr += " method=\"GET\"/>";
                        } else if(layer.CLASS_NAME == "WOC.VectorStoringGML") {
                                if(layer.features.length != 0) {
                                        inputsXMLStr += "<wps:Data><wps:ComplexData";
                                        // MIME type, encoding, schema (optional)!
                                        // inputsXMLStr += " mimeType=\"text/XML\"";
                                        inputsXMLStr += " mimeType=\"text/xml\"";
                                        // determining the gml schema
                                        /*var outputFormat = layer.protocol.outputFormat;
                                        if(outputFormat != undefined){
                                        	if(outputFormat == "GML2"){
                                        		inputsXMLStr += " schema=\"http://schemas.opengis.net/gml/2.1.2/feature.xsd\"";
                                        	} else if(outputFormat == "GML3"){
                                        		inputsXMLStr += " schema=\"http://schemas.opengis.net/gml/3.1.1/feature.xsd\"";
                                        	} else {	// default
                                        		inputsXMLStr += " schema=\"http://schemas.opengis.net/gml/2.1.2/feature.xsd\"";
                                        	}
                                        } else {				// default ist GML 3
                                        	inputsXMLStr += " schema=\"http://schemas.opengis.net/gml/2.1.2/feature.xsd\"";
                                        }*/
                                        //TODO: static default schema GML 3
                                		inputsXMLStr += " schema=\"http://schemas.opengis.net/gml/3.1.1/base/feature.xsd\"";
                                        // inputStr += " encoding=\"\"";
                                        inputsXMLStr += ">";
										var layerGML = layer.getGML();
										if(layerGML.match(/&amp;/g) == null){
											layerGML = layerGML.replace(/&/g,"&amp;");
										}
										else if(layerGML.match(/-/g) != null){
											layerGML = layerGML.replace(/-/g,"&#45;");
										}
                                        inputsXMLStr += layerGML;
                                        inputsXMLStr += "</wps:ComplexData></wps:Data>";
                                }
                        } else {
                                throw 'UnsupportedLayerTypeEx';
                        }
                        return inputsXMLStr;
                }
        },
        CLASS_NAME:"WOC.ComplexData"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.BoundingBoxData
 *     Handles the WPS bounding box data.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.BoundingBoxData = OpenLayers.Class({
        /**
     * Constructor: WOC.BoundingBoxData
         */
        initialize: function() {

                /**
                 * Variable: crss
                 * {Array{String}} References to CRSs, which are allowed 
                 * to be used for input. The first one is the default CRS.
                 */
                var crss = new Array();
                
                /**
                 * Method: parseFromNode
                 *     Parses the object properties from the given node.
                 *
                 * Parameters:
                 * bbNode - {DOMElement} The wps:BoundingBoxData or 
                 *     wps:BoundingBoxOutput element.
                 */
                this.parseFromNode = function(bbNode) {
                        var defaultNode = WOC.getElementsByTagNameNS(
                                        bbNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'Default')[0];
                        var defaultCRS = WOC.getElementsByTagNameNS(
                                        defaultNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'CRS')[0];
                        // Check if the node has attributes
                        if(defaultCRS.hasAttribute("href")) {
                                // Try if the 
                                crss.push(defaultCRS.attributes.getNamedItem(
                                                "href").nodeValue);
                        } else if(defaultCRS.hasAttribute("xlink:href")) {
                                crss.push(defaultCRS.attributes.getNamedItem(
                                                "xlink:href").nodeValue);
                        } else {
                                crss.push(defaultCRS.firstChild.nodeValue);
                        }
                        
                        var supportedNodes = WOC.getElementsByTagNameNS(
                                        bbNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'Supported');
                        for(var k=0; k<supportedNodes.length; k++) {
                                var value = "";
                                var supportedCRS = WOC.getElementsByTagNameNS(
                                                supportedNodes[k], WOC.WPS_NAMESPACE, 
                                                WOC.WPS_PREFIX, 'CRS')[0];        
                                if(supportedCRS.hasAttribute("href")) {
                                        // Try if the 
                                        value = supportedCRS.attributes.getNamedItem(
                                                        "href").nodeValue;
                                } else if(supportedCRS.hasAttribute("xlink:href")) {
                                        value = supportedCRS.attributes.getNamedItem(
                                                        "xlink:href").nodeValue;
                                } else {
                                        value = supportedCRS.firstChild.nodeValue;
                                }
                                if(value != "" && value != crss[0]) {
                                        crss.push(value);
                                }
                        }
                }
                
                /**
                * Method: createDescriptionTableData
                *     Creates a description of the data into a table data (td) element.
                *
                * Parameters:
                * td - {DOMElement} Table data, where the description is put.
                * id - {String} The identifier of the data.
                * map - {OpenLayers.Map}
                */
                this.createDescriptionTableData = function(td, id, map, color) {
                        var button = document.createElement('input');
                        button.type = 'button';
                        button.style.color = color;
                        button.value = "Select BBOX";
                        button.name = id;
                        button.id = id;
                        
                        var control = new OpenLayers.Control();
                        map.addControl(control);
                        var bboxLayer = new OpenLayers.Layer.Boxes("BBOX_bounds_" + id);
                map.addLayer(bboxLayer);
                        
                        var bboxButton = new WOC.BBOXButton(map, bboxLayer, button, control);
                        button.bboxButton = bboxButton;
                        OpenLayers.Event.observe(button, "click", 
                            OpenLayers.Function.bindAsEventListener(
                                                        bboxButton.onclick, bboxButton));
                        /*
            button.onclick = function() {
                    // Forwarding the onclick event.
                    button.bboxButton.onclick();
            }
            */
                        // TODO description + input choices of the table data!
                        td.appendChild(button);
                }
                
                /**
                * Method: getInputXMLStrFromDOMElement
                *
                * Parameters:
                * element - {DOMElement} The HTML document's element that includes 
                *     a reference to a layer, which is used to define the bounding box.
                *
                * Throws:
                * {NoBoundingBoxLayerEx} In case a layer has not been selected.
                */
                this.getInputXMLStrFromDOMElement = function(element) {
                        var inputXMLStr = "<wps:Data><wps:BoundingBoxData dimensions=\"2\"";
                        // Check that a layer includes a bounding box.
                        var bounds = element.bboxButton.getBBOX().getBounds();
                        if(!bounds) {
                                throw 'NoBoundingBoxLayerEx';
                        }
                        // Set the coordinate reference system.
                        var projection = element.bboxButton.getBBOX().getProjection();
                        var crsFound = false;
                        for(var i=0; i<crss.length; i++) {
                                if(crss[i] == projection.getCode()) {
                                        crsFound = true;
                                        i = crss.length;
                                }
                        }
                        if(!crsFound) {
                                bounds.transform(projection,
                                                new OpenLayers.Projection(crss[0], null));
                                inputXMLStr += " crs=\"" + crss[0] + "\">";
                        } else {
                                inputXMLStr += " crs=\"" + projection.getCode() + "\">";
                        }
                        // Lower Corner Coordinates of bounding box corner at which the 
                        // value of each coordinate normally is the algebraic minimum 
                        // within this bounding box a Ordered sequence of double values
                        inputXMLStr += "<ows:LowerCorner>" + bounds.left + " " + bounds.bottom +
                                        "</ows:LowerCorner>";
                        // Upper Corner Coordinates of bounding box corner at which the 
                        // value of each coordinate normally is the algebraic maximum 
                        // within this bounding box a Ordered sequence of double values 
                        inputXMLStr += "<ows:UpperCorner>" + bounds.right + " " + bounds.top +
                                        "</ows:UpperCorner>";
                        inputXMLStr += "</wps:BoundingBoxData></wps:Data>";
                        return inputXMLStr;
                }
        },
        CLASS_NAME:"WOC.BoundingBoxData"
});

/**
 * Property:WOC.BoundingBoxData.colorTable
 *     {Array{String}} An array of colors for different bounding boxes.
 */
WOC.BoundingBoxData.colorTable = ['6600FF','FF6633','0033FF','0099CC',
                '00FF33','0000FF','FF0099'];
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.BoundingBoxOutput
 *     Handles the WPS bounding box data.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.2 / 20.10.2008
 */
WOC.BoundingBoxOutput = OpenLayers.Class({
        /**
     * Constructor: WOC.BoundingBoxData
         */
        initialize: function() {
                
        },
        CLASS_NAME:"WOC.BoundingBoxOutput"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/
 
/**
 * Class: WOC.LiteralData
 *     Handles the WPS literal data.
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 *
 * Updated:
 *     25.09.2008 - Uses <WOC.UoM> and <WOC.DataType>
 */
WOC.LiteralData = OpenLayers.Class({
        /**
     * Constructor: WOC.LiteralData
         */
        initialize: function() {
                /**
                 * Variable: dataType
                 * {WOC.DataType} The data type of the literal data. 
                 *      Has properties name and reference. By default the reference is 
                 *      'xs:String'.
                 */
                var dataType = null;
                /**
                 * Variable: uoms
                 * {Array{WOC.UoM}} The Units of Measure for the literal data.
                 *     An UoM (the object in the array) has properties name and
                 *     reference.
                 */
                var uoms = null;
                
                /**
                 * Method: parseFromLiteralNode
                 *     Parses this objects properties from the given node.
                 *
                 * Parameters:
                 * literalDataNode - {DOMElement} The node, from which the properties are 
                 *     read. For example a wps:LiteralInput element.
                 *
                 * Returns:
                 * {Array{WOC.ExceptionReport}} Occured warnings. Can be an empty array!
                 *
                 * Throws:
                 * {ElementMissingEx} Some element in the node is missing!
                 */
                this.parseFromLiteralNode = function(literalDataNode) {
                        var warnings = new Array();
                        var dataTypeNodes = WOC.getElementsByTagNameNS(
                                        literalDataNode, WOC.OWS_NAMESPACE, 
                                        WOC.OWS_PREFIX, 'DataType');
                        // Data type.
                        if(dataTypeNodes != null && dataTypeNodes.length > 0) {
                                warnings.concat(this.setDataType(dataTypeNodes[0]));
                        }
                        // Units of Measure
                        var uomsNodes = WOC.getElementsByTagNameNS(
                                        literalDataNode, WOC.OWS_NAMESPACE, 
                                        WOC.OWS_PREFIX, 'UOMs');
                        if(uomsNodes.length > 0) {
                                warnings.concat(this.setUOMs(uomsNodes[0]));
                        }
                        return warnings;
                }
                
                /**
                 * Method: setUOMs
                 *     Sets the UoMs of the literal data.
                 *
                 * Parameters:
                 * uomsNode - {DOMElement} The node, from which the UoMs are 
                 *     read. For example a wps:LiteralInput element.
                 *
                 * Returns:
                 * {Array{WOC.ExceptionReport}} Occured warnings. Can be an empty array, 
                 *     which is good :)
                 */
                this.setUOMs = function(uomsNode) {
                        // First get the default UoM
                        var warnings = new Array();
                        var reference = null;
                        var name = "";
                        uoms = new Array();
                        var defaultNode = WOC.getElementsByTagNameNS(
                                uomsNode, WOC.OWS_NAMESPACE, 
                                WOC.OWS_PREFIX, 'Default')[0];
                        var uomNode = WOC.getElementsByTagNameNS(
                                defaultNode, WOC.OWS_NAMESPACE, 
                                WOC.OWS_PREFIX, 'UOM')[0];
                                
                        if(uomNode.hasAttribute('reference')) {
                                reference = uomNode.attributes.getNamedItem(
                                                'reference').nodeValue;
                        }
                        if(!(uomNode.firstChild) || uomNode.firstChild.nodeValue == "") {
                                warnings.push(new WOC.ExceptionReport(
                                                "TextNodeMissingEx", 
                                                "Human-readable name of Unit of Measure is missing!" +
                                                "According to the OWS DomainMetadata data " +
                                                "structure an UoM always needs to include a " +
                                                "human-readable name of metadata!", new Date()));
                                name = "Undefined!";
                        } else {
                                name = uomNode.firstChild.nodeValue;
                        }
                        uoms.push(new WOC.UoM(name, reference));
                        
                        // Supported UOMs.
                        var supportedNodes = WOC.getElementsByTagNameNS(
                                uomsNode, WOC.OWS_NAMESPACE, 
                                WOC.OWS_PREFIX, 'Supported');
                        var uomNodes = WOC.getElementsByTagNameNS(
                                supportedNodes[0], WOC.OWS_NAMESPACE, 
                                WOC.OWS_PREFIX, 'UOM');
                        for(var k=0; k<uomNodes.length; k++) {
                                // For instance '<UOM ows:reference="urn:ogc:def:uom:OGC:1.0:metre">metre</UOM>'
                                reference = null;
                                if(uomNodes[k].hasAttribute('reference')) {
                                        reference = uomNodes[k].attributes.getNamedItem(
                                                        'reference').nodeValue;
                                }
                                if(!(uomNodes[k].firstChild) || 
                                                uomNodes[k].firstChild.nodeValue == "") {
                                        warnings.push(new WOC.ExceptionReport(
                                                        "TextNodeMissingEx", 
                                                        "Human-readable name of Unit of Measure missing!" +
                                                        "According to the OWS DomainMetadata data " +
                                                        "structure an UoM always needs to include a " +
                                                        "human-readable name of metadata!", new Date()));
                                        name = "Undefined!";
                                } else {
                                        name = uomNodes[k].firstChild.nodeValue;
                                }
                                uoms.push(new WOC.UoM(name, reference));
                        }
                        return warnings;
                }
                
                /**
                 * Method: setDataType
                 *     Sets the data type of the literal data.
                 *
                 * Parameters:
                 * dataTypeNode - {DOMElement} The node, from which the data type is
                 *     read. For example a wps:LiteralInput element.
                 *
                 * Returns:
                 * {Array{WOC.ExceptionReport}} Occured warnings. Can be an empty array, 
                 *     which is good :)
                 */
                this.setDataType = function(dataTypeNode) {
                        var warnings = new Array();
                        var name = "";
                        var reference = null;
                        // Reading a reference, if possible!
                        if(dataTypeNode.hasAttribute('reference')) {
                                reference = dataTypeNode.attributes.getNamedItem(
                                                'reference').nodeValue;
                        } else if(dataTypeNode.hasAttribute('ows:reference')) {
                                reference = dataTypeNode.attributes.getNamedItem(
                                                'ows:reference').nodeValue;        
                        } else if(dataTypeNode.hasAttribute(dataTypeNode.prefix+":reference")){		// example: "ns1:reference"
							reference = dataTypeNode.attributes.getNamedItem(
									dataTypeNode.prefix+":reference").nodeValue;
                    	}else {
                                // ows:DataType is set to be a String!!! Just a wild guess.
                                reference = "xs:String";
                        }
                        // Human-readable name of the data type.
                        if(dataTypeNode.firstChild == null ||
                                        dataTypeNode.firstChild.nodeValue == "") {
                                warnings.push(new WOC.ExceptionReport(
                                                "TextNodeMissingEx", 
                                                "Human-readable name of literal data type missing!" +
                                                "According to the OWS DomainMetadata data " +
                                                "structure an data type always needs to include a " +
                                                "human-readable name of metadata!", new Date()));
                                name = "Undefined!";
                        } else {
                                name = dataTypeNode.firstChild.nodeValue;
                        }
                        dataType = new WOC.DataType(name, reference);
                        return warnings;
                }
                
                /**
                 * Method: getDataType
                 *     Return the data type of the literal data.
                 *
                 * Returns:
                 * {WOC.DataType} The data type of the literal data. 
                 */
                this.getDataType = function() {
                        return dataType;
                }
                
                /**
                 * Method: getUoms
                 *     Return the UoMs of the literal data.
                 *
                 * Returns:
                 * {Array{WOC.UoM}} The Units of Measure for the literal data.
                 *     An UoM (the object in the array) has properties name and
                 *     reference.
                 */
                this.getUoms = function() {
                        return uoms;
                }
        },
        CLASS_NAME:"WOC.LiteralData"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/

/**
 * Class: WOC.LiteralInputData
 *     WPS literal input data.
 *
 * Inherits from:
 *     <WOC.LiteralData>
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 *
 */
WOC.LiteralInputData = OpenLayers.Class(WOC.LiteralData, {
        /**
     * Constructor: WOC.LiteralInputData
         */
        initialize:function() {
                WOC.LiteralData.prototype.initialize.apply(this);
                /**
                 * Variable: allowedValues
                 * {Object} The allowed values.
                 *      The object has properties:
                 *          values - {Array{String}},
                 *          ranges - {Array{Range}}, where Range has these properties:
                 *              rangeClosure - {String},
                 *              minimumValue - {double},
                 *              maximumValue - {double} and
                 *              spacing - {double}      RR: not found in the wps 1.0.0 spec!
                 *
                 * See: ows:AllowedValues
                 */
                var allowedValues = null;
                /**
                 * Variable: valuesReference
                 * {Object} The values reference.
                 *     The object has properties:
                 *     reference - {String} and form - {String}
                 *
                 * See: wps:ValuesReferenceType
                 */
                var valuesReference = null;
                /**
                 * Variable: anyValue
                 * {Boolean} If any values are allowed 'true', else 'false'.
                 *
                 * See: ows:AnyValue
                 */
                var anyValue = false;
                /**
                 * Variable: defaultValue
                 * {String} The default value of the literal input.
                 */
                var defaultValue = "";

                /**
                 * Method: parseFromNode
                 *     Parsing the properties of this object from an node.
                 *
                 * Parameters:
                 * literalDataNode - {DOMElement}
                 *
                 * Returns:
                 * {Array{WOC.ExceptionReport}} Occured warnings. Can be an empty array!
                 */
                this.parseFromNode = function(literalDataNode) {
                        // Super class method
                        var warnings = this.parseFromLiteralNode(literalDataNode);
                        // Allowed values,  ValuesReference or AnyValue
                        warnings.concat(this.getAllowedValuesFromNode(literalDataNode));
                        if(!allowedValues) {
                                warnings.concat(this.getValuesReferenceFromNode(literalDataNode));
                                if(!valuesReference) {
                                         warnings.concat(this.getAnyValueFromNode(literalDataNode));
                                }
                        }
                        // Default value
                        var defaultValueNodes = WOC.getElementsByTagNameNS(
                                        literalDataNode, WOC.OWS_NAMESPACE,
                                        WOC.OWS_PREFIX, 'DefaultValue');
                        if(defaultValueNodes != null && defaultValueNodes.lengt > 0) {
                                defaultValue = defaultValueNodes[0].firstChild.nodeValue;
                        }
                        return warnings;
                }

                /**
                 * Method: getAllowedValuesFromNode
                 *     Parsing the allowed values of this object from an node.
                 *
                 * Parameters:
                 * literalDataNode - {DOMElement}
                 *
                 * Returns:
                 * {Array{WOC.ExceptionReport}} Occured warnings. Can be an empty array!
                 *
                 */
                this.getAllowedValuesFromNode = function(literalDataNode) {
                        var warnings = new Array();
                        var allowedValuesNodes = WOC.getElementsByTagNameNS(
                                        literalDataNode, WOC.OWS_NAMESPACE,
                                        WOC.OWS_PREFIX, 'AllowedValues');
                        if (allowedValuesNodes == null || allowedValuesNodes.length <= 0) {
                                return null;
                        }
                        allowedValues = new Object();
                        // Values
                        var valueNodes = WOC.getElementsByTagNameNS(
                                        allowedValuesNodes[0], WOC.OWS_NAMESPACE,
                                        WOC.OWS_PREFIX, 'Value');
                        if(valueNodes != null && valueNodes.length > 0) {
                                allowedValues.values = new Array();//[valueNodes.length];
                                for(var k=0; k<valueNodes.length; k++) {
                                        if(valueNodes[k].firstChild == null) {
                                                warnings.push(new WOC.ExceptionReport(
                                                                "TextNodeMissingEx",
                                                                "The Value-element of the AllowedValues " +
                                                                "in input data has to include a value! It " +
                                                                "can not be an empty element! The value was " +
                                                                "now converted into an ows:AnyValue type.",
                                                                new Date()));
                                                anyValue = true;
                                        } else {
                                                allowedValues.values.push(valueNodes[k].firstChild.nodeValue);
                                        }
                                }
                        } // Ends values.
                        // Ranges
                        var rangeNodes = WOC.getElementsByTagNameNS(
                                        allowedValuesNodes[0], WOC.OWS_NAMESPACE,
                                        WOC.OWS_PREFIX, 'Range');
                        if(rangeNodes != null && rangeNodes.length > 0) {
                                allowedValues.ranges = new Array();//[rangeNodes.length];
                                for(var k=0; k<rangeNodes.length; k++) {
                                        // Note here that by OWS defines that the default
                                        // value for minimumValue is negative infinity and for
                                        // maximumValue positive infinity! BUT WPS defines that the
                                        // range has to be finite, so the default values are not allowed!!!!
                                        var range = new Object();
                                        // Range closure - attribute
                                        if(rangeNodes[k].hasAttribute('rangeClosure')) {
                                                var rangeClosure = rangeNodes[k].attributes.getNamedItem(
                                                                'rangeClosure').nodeValue;
                                                if(rangeClosure == "closed" ||
                                                                rangeClosure == "open" ||
                                                                rangeClosure == "closed-open" ||
                                                                rangeClosure == "open-closed") {
                                                        range.rangeClosure = rangeClosure;
                                                } else {
                                                        warnings.push(new WOC.ExceptionReport(
                                                                "AttributeMissingEx",
                                                                "The rangeClosure-attribute of literal data " +
                                                                "range can only be closed, open, closed-open " +
                                                                "or open-closed! The value was now converted " +
                                                                "into closed.", new Date()));
                                                        range.rangeClosure = "closed";
                                                }
                                        } else {
                                                range.rangeClosure = "closed";
                                        }
                                        // Minimum value
                                        var minimumValueNodes = WOC.getElementsByTagNameNS(
                                                        rangeNodes[k], WOC.OWS_NAMESPACE,
                                                        WOC.OWS_PREFIX, 'MinimumValue');
                                        if(minimumValueNodes != null && minimumValueNodes.length > 0) {
                                                      range.minimumValue = minimumValueNodes[0].childNodes[0].nodeValue;     // error solved
                                        } else {
                                                alert("Here 1");

                                                warnings.push(new WOC.ExceptionReport(
                                                                "ElementMissingEx",
                                                                "The MinimumValue-element of range in " +
                                                                "literal input data is missing! " +
                                                                "The value is optional according to the OWS " +
                                                                "1.1 specification, but mandatory according " +
                                                                "to the WPS 1.0.0 specification.", new Date()));
                                                range.minimumValue = null;
                                        }
                                        // Maximum value
                                        var maximumValueNodes = WOC.getElementsByTagNameNS(
                                                        rangeNodes[k], WOC.OWS_NAMESPACE,
                                                        WOC.OWS_PREFIX, 'MaximumValue');
                                        if(maximumValueNodes != null && maximumValueNodes.length > 0) {
                                                range.maximumValue = maximumValueNodes[0].childNodes[0].nodeValue;
                                        } else {
                                                //TODO: fehler
                                                alert("The MaximumValue-element of range in " +
                                                        "literal input data is missing! " +
                                                        "The value is optional according to the OWS " +
                                                        "1.1 specification, but mandatory according " +
                                                        "to the WPS 1.0.0 specification.");

                                                warnings.push(new WOC.ExceptionReport(
                                                                "ElementMissingEx",
                                                                "The MaximumValue-element of range in " +
                                                                "literal input data is missing! " +
                                                                "The value is optional according to the OWS " +
                                                                "1.1 specification, but mandatory according " +
                                                                "to the WPS 1.0.0 specification.", new Date()));
                                                range.maximumValue = null;
                                        }

                                        /* Spacing                   // RR: not found in the wps 1.0.0 spec
                                        var spacingNodes = WOC.getElementsByTagNameNS(
                                                        rangeNodes[k], WOC.OWS_NAMESPACE,
                                                        WOC.OWS_PREFIX, 'Spacing');
                                        if(spacingNodes != null && spacingNodes.length > 0) {
                                                range.spacing = spacingNodes[0].childNode.nodeValue;
                                        } else {
                                                range.spacing = null;
                                        } */
                                        allowedValues.ranges.push(range);
                                } // Ends the for loop!
                        } // Ends ranges.
                        return warnings;
                }

                /**
                 * Method: getValuesReferenceFromNode
                 *     Parsing the values reference of this object from an node.
                 *
                 * Parameters:
                 * literalDataNode - {DOMElement}
                 *
                 * Returns:
                 * {Array{WOC.ExceptionReport}} Occured warnings. Can be an empty array!
                 *
                 */
                this.getValuesReferenceFromNode = function(literalDataNode) {
                        var warnings = new Array();
                        var valuesReferenceNodes = WOC.getElementsByTagNameNS(
                                        literalDataNode, WOC.OWS_NAMESPACE,
                                        WOC.OWS_PREFIX, 'ValuesReference');
                        if(valuesReferenceNodes != null && valuesReferenceNodes.length > 0) {
                                valuesReference = new Object();
                                valuesReference.reference = valuesReferenceNodes[0].attributes.getNamedItem(
                                                'valuesReference').nodeValue;
                                valuesReference.form = valuesReferenceNodes[0].attributes.getNamedItem(
                                                'valuesForm').nodeValue;
                        }
                        return warnings;
                }

                /**
                 * Method: getAnyValueFromNode
                 *     Parsing the anyValue of this object from an node.
                 *
                 * Parameters:
                 * literalDataNode - {DOMElement}
                 *
                 */
                this.getAnyValueFromNode = function(literalDataNode) {
                        anyValue = false;
                        var anyValueNodes = WOC.getElementsByTagNameNS(
                                        literalDataNode, WOC.OWS_NAMESPACE,
                                        WOC.OWS_PREFIX, 'AnyValue');
                        if(anyValueNodes != null && anyValueNodes.length > 0) {
                                anyValue = true;
                        }
                }

                /**
                * Method: createDescriptionTableData
                *     Creates a description of the data into a table data (td) element.
                *
                * Parameters:
                * td - {DOMElement} Table data, where the description is put.
                * id - {String} The identifier of the data.
                */
                this.createDescriptionTableData = function(td, id) {
                        // Check data type - NOT ALL ARE CURRENTLY SUPPORTED!
                        var dataType = this.getDataType();
                        if(!dataType) {
                                return;
                        };
                        if(dataType.getReference() != null &&
                                        this.isBooleanDataType(dataType.getReference())) {
                                // If the input type is boolean then the box is added behind
                                // We now just create a dropdown field or text field
                                var booleanBox = document.createElement('input');
                                booleanBox.type = 'checkbox';
                                booleanBox.value = id;
                                booleanBox.name = id;
                                booleanBox.id = id;
                                // Add the default value.
                                if(defaultValue == 'true' || defaultValue == '1') {
                                        booleanBox.checked = true;
                                } else { // if(default == 'false' || default == '0') {
                                        booleanBox.checked = false;
                                }
                                td.appendChild(booleanBox);
                                var label = document.createElement('label');
                                label.value = "True/False";
                                label.htmlFor = id;
                                td.appendChild(label);
                        } else if(this.isSupportedTextFieldDataType(
                                        dataType.getReference())) {
                                // We now just create a dropdown field or text field
                                if(anyValue == true) {
                                        // Any value can be given - we use a text field for this!
                                        var textField = document.createElement('input');
                                        textField.name = id;
                                        textField.id = id;
                                        textField.type = 'text';
                                        textField.value = defaultValue;
                                        OpenLayers.Event.observe(textField, "click",
                                                        OpenLayers.Function.bindAsEventListener(
                                                                        WOC.textFieldClearing, textField));
                                        td.appendChild(textField);
                                } else if(allowedValues != null) {
                                        // Just some values are allowed - we use a drop down list for this!
                                        var selectList = null;
                                        // Single values
                                        if(allowedValues.values != null && allowedValues.values.length > 0) {
                                                selectList = document.createElement('select');
                                                for(var j=0; j<allowedValues.values.length; j++) {
                                                        var option = document.createElement('option');
                                                        option.value = allowedValues.values[j];
                                                        option.text = allowedValues.values[j];
                                                        selectList.appendChild(option);
                                                }
                                                td.appendChild(selectList);
                                        }
                                        // Ranges
                                        if(allowedValues.ranges != null && allowedValues.ranges.length > 0) {
                                                for(var j=0; j<allowedValues.ranges.length; j++) {
                                                      /* RR: deleted the selectBox creation, because it makes no sense
                                                             to have a selectBox with "-Infinity" and "+Infinity" option inside*/
                                                      var textField = document.createElement('input');
                                                      textField.name = id;
                                                      textField.id = id;
                                                      textField.type = 'text';
                                                      textField.value = defaultValue;
                                                      OpenLayers.Event.observe(textField, "click",
                                                      OpenLayers.Function.bindAsEventListener(
                                                      WOC.textFieldClearing, textField));
                                                      td.appendChild(textField);
                                                }
                                        }
                                } else if(valuesReference != null &&
                                                valuesReference.length > 0) {
                                        // TODO Values reference for literal data.
                                        alert("Value reference! UNIMPLEMENTED");



                                } else {
                                        // Should never happen!!!
                                        alert("This should not have happened!!! ");



                                }
                        } else {
                                // Can happen!!!
                                // TODO The datatype of literal data is unsupported!
                                alert("Datatype is unsupported! Data type:" +
                                                dataType.getReference());
                        }
                }

                /**
                * Method: getInputXMLStrFromDOMElement
                *
                * Parameters:
                * element - {DOMElement} The HTMÖ document's element that is used to
                *     to fill in the literal data. Like an text field.
                *
                * Throws:
                * {EmptyStringValueEx} In case value is empty.
                */
                this.getInputXMLStrFromDOMElement = function(element) {
                        // Note! No reference is used here!
                        var inputXMLStr = "<wps:Data><wps:LiteralData";
                        var datatype = this.getDataType();
                        if(datatype != null && datatype.getReference() != null) {
                                inputXMLStr += " dataType=\"" + datatype.getReference() + "\"";
                        }
                        // TODO Use some of user selected allowed UoMs! Has to be implemented!
                        inputXMLStr += ">";
                        // The actual data is added here.
                        if(datatype && datatype.getReference() &
                                        this.isBooleanDataType(datatype.getReference())) {
                                // Checkbox.
                                if(element.checked) {
                                        inputXMLStr += "true";
                                } else {
                                        inputXMLStr += "false";
                                }
                        } else if(anyValue) {
                                // Any value can be given - we use a text field for this!
                                var value = element.value; //firstChild.nodeValue;
                                if(value == "") {
                                        // An empty string is not allowed!!!
                                        throw 'EmptyStringValueEx';
                                }
                                inputXMLStr += value;
                        } else if(allowedValues) {
                                // Just some values are allowed - we use a drop down list for this!
                                var optionIndex = element.options.selectedIndex;
                                inputXMLStr += element.options[optionIndex].firstChild.nodeValue;
                        } else if(valuesReference) {
                                // TODO Values reference.
                                alert("Value reference is UNIMPLEMENTED!");



                        } else {
                                // Should never happen!!!
                                alert("Exception! This should not have happened!");



                        }
                        inputXMLStr += "</wps:LiteralData></wps:Data>";
                        return inputXMLStr;
                }
        },

        /*
        * Function: isSupportedTextFieldDataType
        *    This function is used to check if the value having the datatype can be
        *    given using a text field.
        *
        *    Data types are from: XML Schema Part 2: Datatypes Second Edition
        *    (W3C Recommendation 28 October 2004).
        *
        * Parameters:
        * datatypeInclNS - {String} Data type name. Has to include the namespace!
        *
        * Returns:
        * {Boolean} True if the data type can be shown in an text field and is a
        *     supported, else false.
        */
        isSupportedTextFieldDataType:function(datatypeInclNS) {
                if(!datatypeInclNS || datatypeInclNS == "") {
                        return false;
                }
                // Removing and checking the namespace/URL.
                var datatype = datatypeInclNS.split(":");

                if(datatype[0] == "http" || datatype[0] == "https") {
                        datatype = datatypeInclNS.split("#");
                        var allowedURLs = ['http://www.w3.org/TR/xmlschema-2/',
                                        'http://www.w3.org/TR/2001/REC-xmlschema-2-20010502/'];
                        var urlAccepted = false;
                        for(var i=0; i<allowedURLs.length; i++) {
                                if(datatype[0] == allowedURLs[i]) {
                                        urlAccepted = true;
                                }
                        }
                        if(!urlAccepted) {
                                return false;
                        }
                } else if(datatype.length == 2) {
                        var allowedNamespaces = ['xs'];
                        var namespaceAccepted = false;
                        for(var i=0; i<allowedNamespaces.length; i++) {
                                if(datatype[0] == allowedNamespaces[i]) {
                                        namespaceAccepted = true;
                                }
                        }
                        if(!namespaceAccepted) {
                                return false;
                        }
                } else {
                        return false;
                }
                // Some URI is required!
                if(datatype.length != 2) {
                        return false;
                }
                var textFieldPrimitiveTypes = ['double','Double','float','Float','decimal','Decimal','anyURI','AnyURI',
                                'string','String','Duration','duration','DateTime','dateTime','Time','time','Date','date',
                                'GYearMonth','GYearMonth','GMonthDay','GDay','GMonth','GYear','qName',
                                'gMonthDay','gDay','gMonth','gYear','QName'];
                // Missing primitive types: ['xs:hexBinary', 'xs:base64Binary', 'xs:NOTATION'];

                // First check if the type is a supported primitive type.
                for(var i=0; i<textFieldPrimitiveTypes.length; i++) {
                        if(datatype[1] == textFieldPrimitiveTypes[i]) {
                                return true;
                        }
                }
                var textFieldDerivedTypes = ['integer','nonPositiveInteger',
                                'negativeInteger','long','int','short','nonNegativeInteger',
                                'unsignedLong','unsignedInt','unsignedShort','positiveInteger',
                                'normalizedString','token','language','Name','NCName'];
                // Missing derived types: ['xs:byte','xs:unsignedByte',
                // 'xs:NMTOKEN', 'xs:NMTOKENS', 'xs:ID', 'xs:IDREF', 'xs:IDREFS',
                // 'xs:ENTITY', 'xs:ENTITIES'];

                // Secondly check if the type is a supported derived type.
                for(var i=0; i<textFieldDerivedTypes.length; i++) {
                        if(datatype[1] == textFieldDerivedTypes[i]) {
                                return true;
                        }
                }
                return false;
        },

        /**
        * Function: isBooleanDataType
        *     This function is used to check if the value having the datatype can be
        *     given using a checkbox.
        *
        * Parameters
        * datatypeInclNS - {String} Data type name. Has to include the namespace!
        *
        * Returns:
        * {Boolean} True if the data type is an boolean can be shown using a
        *     checkbox, else false.
        */
        isBooleanDataType:function(datatypeInclNS) {
                if(!datatypeInclNS || datatypeInclNS == "") {
                        return false;
                }
                // Removing and checking the namespace/URL.
                var datatype = datatypeInclNS.split(":");
                if(datatype.length != 2) {
                        return false;
                }
                if(datatype[0] == "http" || datatype[0] == "https") {
                        datatype = datatypeInclNS.split("#");
                        var allowedURLs = ['http://www.w3.org/TR/xmlschema-2/',
                                        'http://www.w3.org/TR/2001/REC-xmlschema-2-20010502/'];
                        var urlAccepted = false;
                        for(var i=0; i<allowedURLs.length; i++) {
                                if(datatype[0] == allowedURLs[i]) {
                                        urlAccepted = true;
                                }
                        }
                        if(!urlAccepted) {
                                return false;
                        }
                } else if(datatype.length == 2) {
                        var allowedNamespaces = ['xs'];
                        var namespaceAccepted = false;
                        for(var i=0; i<allowedNamespaces.length; i++) {
                                if(datatype[0] == allowedNamespaces[i]) {
                                        namespaceAccepted = true;
                                }
                        }
                        if(!namespaceAccepted) {
                                return false;
                        }
                } else {
                        return false;
                }
                // Some URI is required!
                if(datatype[1] == "boolean") {
                        return true;
                }
                return false;
        },
        CLASS_NAME:"WOC.LiteralInputData"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/
 
/**
 * Class: WOC.LiteralOutputData
 *     WPS literal input data.
 *
 * Inherits from:
 *     <WOC.LiteralData>
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 *
 */
WOC.LiteralOutputData = OpenLayers.Class(WOC.LiteralData, {
        /**
     * Constructor: WOC.LiteralOutputData
         */
        initialize: function() {
                WOC.LiteralData.prototype.initialize.apply(this);
                /**
                 * Method: parseFromNode
                 *     Parsing the properties of this object from an node.
                 *
                 * Parameters:
                 * literalDataNode - {DOMElement}
                 *
                 * Returns:
                 * {Array{WOC.ExceptionReport}} Occured warnings. Can be an empty array!
                 */
                this.parseFromNode = function(literalDataNode) {
                        // Super class method
                        return this.parseFromLiteralNode(literalDataNode);
                }
        },
        CLASS_NAME:"WOC.LiteralOutputData"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/
 
/**
 * Class: WOC.WPSData
 *     The superclass of all WPS data classes.
 *
 * Inherits from:
 *     <WOC.IdentifiedObject>
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.WPSData = OpenLayers.Class(WOC.IdentifiedObject, {
        /**
         *
     * Constructor: WOC.WPSData
     */
        initialize: function() {
                WOC.IdentifiedObject.prototype.initialize.apply(this);
                /**
                 * Method: parseFromNode
                 *     Parses the identification data from the given node.
                 *
                 * Parameters:
                 * node - {DOMElement}
                 *
                 * Throws:
                 * {ElementMissingEx} Some element in the node is missing!
                 * {AttributeMissingEx} Some attribute is missing!
                */
                this.parseDataNode = function(dataNode) {
                        // Get the identification data (identifier, title, abstract)
                        this.parseIdentificationNode(dataNode);
                }
        },
        CLASS_NAME:"WOC.WPSData"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/
 
/**
 * Class: WOC.WPSInputData
 *     Handles the WPS input data.
 *
 * Inherits from:
 *     <WOC.WPSData>
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.WPSInputData = OpenLayers.Class(WOC.WPSData, {
        /**
     * Constructor: WOC.WPSInputData
         */
        initialize: function() {
                WOC.WPSData.prototype.initialize.apply(this);
                /**
                * Variable: minOccurs
                * {Integer} How many number of times the input has to be given in an 
                *     Execute request.
                * 
                * If 0 then this input data is optional. The default is 1.
                */
                var minOccurs = 1;
                /**
                * Variable: maxOccurs
                * {Integer} How many number of times the input is permitted to be given 
                *     in an Execute request. 
                * 
                * The default is 1. Has to be greater or equel to minOccurs!
                */
                var maxOccurs = 1;
                /**
                * Variable: complexData
                * {WOC.ComplexData} Complex data. Null if literal data or bounding box
                *     data are given (conditional).
                */
                var complexData = null;
                /**
                * Variable: literalData
                * {WOC.LiteralInputData} Literal data. Null if complex data or 
                *     bounding box data are given (conditional).
                */
                var literalData = null;
                /**
                * Variable: boundingBoxData
                * {WOC.BoundingBoxData} Bounding box data. Null if complex or literal
                *     data are given (conditional).
                */
                var boundingBoxData = null;
                
                /**
                * Method: parseFromNode
                *     Parsing the objects properties from a node.
                *
                * Parameters:
                * inputNode - {DOMElement}
                *
                * Throws: 
                * {AttributeMissingEx}
                * {ElementMissingEx}
                */
                this.parseFromNode = function(inputNode) {
                        // Super class method.
                        this.parseDataNode(inputNode);
                        // minOccurs and maxOccurs
                        if(inputNode.hasAttribute('minOccurs')) {
                                minOccurs = inputNode.attributes.getNamedItem('minOccurs').nodeValue;
                        } else {
                                throw 'AttributeMissingEx';
                        }
                        if(inputNode.hasAttribute('maxOccurs')) {
                                maxOccurs = inputNode.attributes.getNamedItem('maxOccurs').nodeValue;
                        } else {
                                throw 'AttributeMissingEx';
                        }
                        this.getComplexDataFromNode(inputNode);
                        if(!complexData) {
                                this.getLiteralDataFromNode(inputNode);
                                if(!literalData) {
                                        this.getBoundingBoxDataFromNode(inputNode);
                                        if(!boundingBoxData) {
                                                
                                                alert("Here 3");
                                                
                                                throw 'ElementMissingEx';
                                        }
                                }
                        }
                }
                
                /**
                * Method: getComplexDataFromNode
                *     
                */
                this.getComplexDataFromNode = function(inputNode) {
                        complexData = null;
                        var complexDataNodes = WOC.getElementsByTagNameNS(inputNode, 
                                        WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'ComplexData');
                        if(complexDataNodes != null && complexDataNodes.length > 0) {
                                complexData = new WOC.ComplexData();
                                complexData.parseFromNode(complexDataNodes[0]);
                        }
                }
                /**
                *  Method: getLiteralDataFromNode
                */
                this.getLiteralDataFromNode = function(inputNode) {
                        literalData = null;
                        var literalDataNodes = WOC.getElementsByTagNameNS(inputNode, 
                                        WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'LiteralData');
                        if(literalDataNodes != null && literalDataNodes.length > 0) {
                                literalData = new WOC.LiteralInputData();
                                literalData.parseFromNode(literalDataNodes[0]);
                        }
                }
                /**
                * Method: getBoundingBoxDataFromNode
                */
                this.getBoundingBoxDataFromNode = function(inputNode) {
                        boundingBoxData = null;
                        var bbDataNodes = WOC.getElementsByTagNameNS(inputNode, 
                                        WOC.WPS_NAMESPACE, WOC.WPS_PREFIX, 'BoundingBoxData');
                        if(bbDataNodes != null && bbDataNodes.length > 0) {
                                boundingBoxData = new WOC.BoundingBoxData();
                                boundingBoxData.parseFromNode(bbDataNodes[0]);
                        }
                }
                /**
                * Method: addDescriptionsToTable
                *     Creates an description and input fields if neccessary into the given
                * DOMElement
                *
                * Parameters:
                * table - {DOMElement}
                * map - {OpenLayers.Map}
                */
                this.addDescriptionsToTable = function(table, map) {
                        var bbColorTableIndex = 0;
                        for(var i=0; i<maxOccurs; i++) {
                                var dataId = 'input_' + i + '_' + this.getIdentifier();
                                var usageId = 'input_' + i + '_use_' + this.getIdentifier();
                                var tableRow = document.createElement('tr');
                                var tableElement = document.createElement('td');
                                // Title
                                if(i==0) {
                                        tableElement.appendChild(document.createTextNode(this.getTitle()));
                                }
                                tableRow.appendChild(tableElement);
                                // Usage
                                this.addUsageToTableRow(tableRow, usageId, i);
                                // Value
                                var tableData = document.createElement('td');
                                tableData.className = 'inputValue';
                                if(complexData != null) {
                                        complexData.createDescriptionTableData(tableData, dataId, map);
                                } else if(literalData != null) {
                                        literalData.createDescriptionTableData(tableData, dataId);
                                } else if(boundingBoxData != null) {
                                        var color = WOC.BoundingBoxData.colorTable[
                                                        bbColorTableIndex++];
                                        bbColorTableIndex = bbColorTableIndex%
                                                        WOC.BoundingBoxData.colorTable.length;
                                        boundingBoxData.createDescriptionTableData(tableData, 
                                                        dataId, map, color);
                                }
                                tableRow.appendChild(tableData);
                                table.appendChild(tableRow);
                        }
                }
                
                /**
                * Method: addUsageToTableRow
                * 
                * Parameters:
                * tableRow - {DOMElement} Element to which the optionality is added.
                * id - {}
                * index - {Integer} Number of input.
                */
                this.addUsageToTableRow = function(tableRow, id, index)  {
                        var tableElement = document.createElement('td');
                        tableElement.className = 'usageValue';
                        var elem = null;
                        if(index < minOccurs) {
                                // Add an image element telling that the the value is mandatory.
                                elem = document.createElement('img');
                                elem.name = id;
                                elem.id = id;
                                with(elem) {
                                        src = "img/tick.png";
                                        alt = "Mandatory";
                                }
                        } else {
                                elem = document.createElement('input');
                                elem.name = id;
                                elem.id = id;
                                elem.className = 'hiddenCheckbox';
                                with(elem) {
                                        type = 'checkbox';
                                        checked = false;
                                }
                                var img = document.createElement('img');
                                img.id = "image_" + id;
                                with(img) {
                                        className = 'usageCheckbox';
                                        src = "img/cross_box.png";
                                        alt = "Unchecked";
                                }
                                OpenLayers.Event.observe(img, "click", 
                                                OpenLayers.Function.bindAsEventListener(
                                                                WOC.checkboxChecker, this));
                                tableElement.appendChild(img);
                        }
                        tableElement.appendChild(elem);
                        tableRow.appendChild(tableElement);
                }

                /**
                * Method: getInputXML
                *
                * Parameters:
                * map - {OpenLayers.Map}
                *
                * Returns:
                * {String}
                *
                * Throws:
                * {LayerNullEx} Thrown by complex data handling if the 
                *     input layer is null.
                * {UnsupportedLayerTypeEx} Thrown if the layer type is
                *     unsupported.
                * {EmptyStringValueEx}
                * {Exception} In any other exception case.
                */
                this.getInputXML = function(map) {
                        if(complexData == null && literalData == null &&
                                        boundingBoxData == null) {
                                return ""; // No inputs
                        }
                        var id = this.getIdentifier();
                        var inputsXML = "";
                        for(var i=0; i<maxOccurs; i++) {
                                if(i < minOccurs || document.getElementById(
                                                'input_' + i + '_use_' + id).checked) {
                                        var element = document.getElementById(
                                                        "input_" + i + "_" + id);
                                        inputsXML += "<wps:Input><ows:Identifier>" + id + 
                                                        "</ows:Identifier>";
                                        if(complexData) {
                                                inputsXML += complexData.getInputXMLStrFromDOMElement(
                                                                element, map);
                                        } else if(literalData) {
                                                inputsXML += literalData.getInputXMLStrFromDOMElement(
                                                                element);
                                        } else if(boundingBoxData) {
                                                inputsXML += boundingBoxData.getInputXMLStrFromDOMElement(
                                                                element);
                                        } else {
                                                throw 'Exception';
                                        }
                                        inputsXML += "</wps:Input>";
                                }
                        }
                        return inputsXML;
                }
                
                /**
                * Method: getMinOccurs
                * {Integer}
                */
                this.getMinOccurs = function() {
                        return minOccurs;
                }
                
                /**
                * Method: getMaxOccurs
                * {Integer}
                */
                this.getMaxOccurs = function() {
                        return maxOccurs;
                }
                
                /**
                * Method: getComplexData
                * {WOC.ComplexData}
                */
                this.getComplexData = function() {
                        return complexData;
                }
                
                /**
                * Method: getLiteralData
                * {WOC.LiteralInputData}
                */
                this.getLiteralData = function() {
                        return literalData;
                }
                
                /**
                * Method: getBoundingBoxData
                * {WOC.BoundingBoxData}
                */
                this.getBoundingBoxData = function() {
                        return boundingBoxData;
                }
        },
        CLASS_NAME:"WOC.WPSInputData"
});
/****************************************************************
* 52°North WPS OpenLayers Client
*
* for using WPS-based processes in browser-based applications.
* Copyright (C) 2010
* Janne Kovanen, Finnish Geodetic Institute
* Raphael Rupprecht, Institute for Geoinformatics
* 52North GmbH
*
* This library is free software; you can redistribute it and/or
* modify it under the terms of the GNU Lesser General Public
* License as published by the Free Software Foundation; either
* version 2.1 of the License, or (at your option) any later version.
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
* Lesser General Public License for more details.
*
* You should have received a copy of the GNU Lesser General Public
* License along with this library; if not, write to the Free Software
* Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301  USA
*
***************************************************************/
 
/**
 * Class: WOC.WPSOutputData
 *     Handles the WPS output data.
 *
 * Inherits from:
 *     <WOC.WPSData>
 *
 * Authors:
 *     Janne Kovanen, Finnish Geodetic Institute, janne.kovanen@fgi.fi
 *
 * Since Version / Date:
 *     0.1 / 22.09.2008
 */
WOC.WPSOutputData = OpenLayers.Class(WOC.WPSData, {
        /**
     * Constructor: WOC.WPSOutputData
         */
        initialize: function() {
                WOC.WPSData.prototype.initialize.apply(this);
                /**
                * Variable: complexOutput
                * {WOC.ComplexData} Complex output data. Null if literal output data or 
                *     bounding box output data are given (conditional).
                */
                var complexOutput = null;
                /**
                * Variable: literalOutput
                * {WOC.LiteralOutputData} Literal output data. Null if complex output 
                *     data or bounding box output data are given (conditional).
                */
                var literalOutput = null;
                /**
                * Variable: boundingBoxOutput
                * {WOC.BoundingBoxData} Bounding box output data. Null if complex or 
                *     literal output data are given (conditional).
                */
                var boundingBoxOutput = null;
                
                /**
                * Method: parseFromNode
                *     Parsing the objects properties from a node.
                *
                * Parameters:
                * outputNode - {DOMElement}
                *
                * Throws: 
                * {AttributeMissingEx}
                * {ElementMissingEx}
                */
                this.parseFromNode = function(outputNode) {
                        // Super class method.
                        this.parseDataNode(outputNode);
                        this.getComplexOutputFromNode(outputNode);
                        if(!complexOutput) {
                                this.getLiteralOutputFromNode(outputNode);
                                if(!literalOutput) {
                                        this.getBoundingBoxOutputFromNode(outputNode);
                                        if(!boundingBoxOutput) {
                                                throw 'ElementMissingEx';
                                        }
                                }
                        }
                }
                
                /**
                * Method: getComplexOutputFromNode
                */
                this.getComplexOutputFromNode = function(outputNode) {
                        complexOutput = null;
                        var complexOutputNodes = WOC.getElementsByTagNameNS(
                                        outputNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'ComplexOutput');
                        if(complexOutputNodes && complexOutputNodes.length > 0) {
                                complexOutput = new WOC.ComplexData();
                                complexOutput.parseFromNode(complexOutputNodes[0]);
                        }
                }
                
                /**
                * Method: getLiteralOutputFromNode
                */
                this.getLiteralOutputFromNode = function(outputNode) {
                        literalOutput = null;
                        var literalOutputNodes = WOC.getElementsByTagNameNS(
                                        outputNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'LiteralOutput');
                        if(literalOutputNodes && literalOutputNodes.length > 0) {
                                literalOutput = new WOC.LiteralOutputData();
                                literalOutput.parseFromNode(literalOutputNodes[0]);
                        }
                }
                
                /**
                * Method: getBoundingBoxOutputFromNode
                */
                this.getBoundingBoxOutputFromNode = function(outputNode) {
                        boundingBoxOutput = null;
                        var bbOutputNodes = WOC.getElementsByTagNameNS(
                                        outputNode, WOC.WPS_NAMESPACE, 
                                        WOC.WPS_PREFIX, 'BoundingBoxOutput');
                        if(bbOutputNodes && bbOutputNodes.length > 0) {
                                boundingBoxOutput = new WOC.BoundingBoxData();
                                boundingBoxOutput.parseFromNode(bbOutputNodes[0]);
                        }
                }
                
                /**
                * Method: getComplexOutput
                * {WOC.ComplexData}
                */
                this.getComplexOutput = function() {
                        return complexOutput;
                }
                
                /**
                * Method: getLiteralOutput
                * {WOC.LiteralOutputData}
                */
                this.getLiteralOutput = function() {
                        return literalOutput;
                }
                
                /**
                * Method: getBoundingBoxOutput
                * {WOC.BoundingBoxData}
                */
                this.getBoundingBoxOutput = function() {
                        return boundingBoxOutput;
                }
        },
        CLASS_NAME:"WOC.WPSOutputData"
});
