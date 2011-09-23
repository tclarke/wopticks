/**
 * Class: OpenLayers.WCS
 * Web Coverage Service Client
 */
OpenLayers.WCS = OpenLayers.Class({
    /**
     * Property: service
     * {String}
     */
    service: "wcs",
    /**
     * Property: version
     * {String}
     */
    version: "2.0.0",
    /**
     * Property: getCapabilitiesUrlGet
     * {String}
     */
    getCapabilitiesUrlGet: null,
    /**
     * Property: getCapabilitiesUrlPost
     * {String}
     */
    getCapabilitiesUrlPost: null,
    /**
     * property: responseText
     * {String}
     * Last response as text
     */
    responseText: null,

    /**
     * property: responseDOM
     * {DOM}
     * Last response as DOM
     */
    responseDOM: null,

    /**
     * property: getCoverageUrlGet
     * {string}
     */
    getCoverageUrlGet: null,

    /**
     * property: getCoverageUrlPost
     * {string}
     */
    getCoverageUrlPost: null,

    /**
     * Contructor: initialize
     *
     * Parameters:
     * url - {String} initial url of GetCapabilities request
     * options - {Object}
     */
    initialize: function(url,options) {
        OpenLayers.Util.extend(this, options);

        this.getCapabilitiesUrlGet = url;
        this.getCoverageUrlGet = url;
        this.getCapabilitiesUrlPost = url;
        this.getCoverageUrlPost = url;

        OpenLayers.Util.extend(this,options);

        OpenLayers.WCS.instances.push(this);
        this.id = OpenLayers.WCS.instances.length-1;
    },

    /**
     * Method: getCapabilities
     *
     * Parameter:
     * url - {String} if ommited, this.getCapabilitiesUrlGet is taken
     */
    getCapabilities : function(url) {
        this.getCapabilitiesGet(url);
    },

    /**
     * Method: getCapabilitiesGet
     * Call GetCapabilities request via HTTP GET
     *
     * Parameter:
     * url - {String} if ommited, this.getCapabilitiesUrlGet is taken
     */
    getCapabilitiesGet : function(url) {
        if (url) {
            this.getCapabilitiesUrlGet = url;
        }
        var uri = OpenLayers.WCS.Utils.extendUrl(url,{service: this.service, version: this.version,request: "GetCapabilities"});

        var request = OpenLayers.Request.GET({url:uri, params:{},success:this.parseGetCapabilities,failure:this.onException,scope:this});
    },

    /**
     * Method: getCoverageUrl
     *
     * Parameter:
     * coverage - {String} required coverage name
     */
     getCoverageUrl : function(coverage, options) {
        var params = {service: this.service, version: this.version, request: "GetCoverage", coverageid: coverage};
        OpenLayers.Util.extend(params, options);
        return OpenLayers.WCS.Utils.extendUrl(this.getCapabilitiesUrlGet,params);
     },

    CLASS_NAME : "OpenLayers.WCS"
});


OpenLayers.WCS.Utils = {
    /**
     * Function: extendUrl
     * Extend URL parameters with newParams object
     *
     * Parameters:
     * source - {String} url
     * newParams - {Object}
     *
     * Returns:
     * {String} new URL
     */
    extendUrl: function(source,newParams) {
        var sourceBase = source.split("?")[0];
        try {
            var sourceParamsList = source.split("?")[1].split("&");
        }
        catch (e) {
            var sourceParamsList = [];
        }
        var sourceParams = {};

        for (var i = 0; i < sourceParamsList.length; i++) {
            var key; var value;
            key = sourceParamsList[i].split('=')[0];
            value = sourceParamsList[i].split('=')[1];
            if (key && value ) {
                sourceParams[key] = value;
            }
        }
        newParams = OpenLayers.Util.extend(newParams, sourceParams);

        var newParamsString = "";
        var first = true;
        for (var key in newParams) {
            var vals = newParams[key];
            if (!Array.isArray(vals)) {
               vals = [vals];
            }
            for (var validx = 0; validx <  vals.length; validx++) {
               if (first) {
                  newParamsString = key+"="+vals[validx];
                  first = false;
               } else {
                  newParamsString += "&"+key+"="+vals[validx];
               }
            }
        }
        return sourceBase+"?"+newParamsString;
    },
};

/**
 * Property:    OpenLayers.WCS.instances
 * {List} running instances of WCS
 */
OpenLayers.WCS.instances = [];
