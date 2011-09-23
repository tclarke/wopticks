/* Copyright (c) 2006-2008 MetaCarta, Inc., published under the Clear BSD
 * license.  See http://svn.openlayers.org/trunk/openlayers/license.txt for the
 * full text of the license. */

/** 
 * @requires OpenLayers/Control.js
 */

/**
 * @author Raphael Rupprecht
 * 
 * Class: OpenLayers.Control.WpsResultLayerSwitcher
 * 
 * Inherits from:
 *  - <OpenLayers.Control>
 */
OpenLayers.Control.WpsResultLayerSwitcher = 
  OpenLayers.Class(OpenLayers.Control, {

    /**
     * APIProperty: roundedCorner
     * {Boolean} If true the Rico library is used for rounding the corners
     *     of the layer switcher div, defaults to true.
     */
    roundedCorner: true,

    /**  
     * APIProperty: roundedCornerColor
     * {String} The color of the rounded corners, only applies if roundedCorner
     *     is true, defaults to "darkblue".
     */
    roundedCornerColor: "#63C4E4",
    
    /**  
     * Property: layerStates 
     * {Array(Object)} Basically a copy of the "state" of the map's layers 
     *     the last time the control was drawn. We have this in order to avoid
     *     unnecessarily redrawing the control.
     */
    layerStates: null,
    

  // DOM Elements
  
    /**
     * Property: layersDiv
     * {DOMElement} 
     */
    layersDiv: null,
    
    /** 
     * Property: baseLayersDiv
     * {DOMElement}
     */
    baseLayersDiv: null,

    /** 
     * Property: baseLayers
     * {Array(<OpenLayers.Layer>)}
     */
    baseLayers: null,
    
    
    /** 
     * Property: dataLbl
     * {DOMElement} 
     */
    dataLbl: null,
    
    /** 
     * Property: dataLayersDiv
     * {DOMElement} 
     */
    dataLayersDiv: null,

    /** 
     * Property: dataLayers
     * {Array(<OpenLayers.Layer>)} 
     */
    dataLayers: null,


    /** 
     * Property: minimizeDiv
     * {DOMElement} 
     */
    minimizeDiv: null,

    /** 
     * Property: maximizeDiv
     * {DOMElement} 
     */
    maximizeDiv: null,
    
    /**
     * APIProperty: ascending
     * {Boolean} 
     */
    ascending: true,
 
    /**
     * Constructor: OpenLayers.Control.LayerSwitcher
     * 
     * Parameters:
     * options - {Object}
     */
    initialize: function(options) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.layerStates = [];
    },

    /**
     * APIMethod: destroy 
     */    
    destroy: function() {
        
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
     *
     * Properties:
     * map - {<OpenLayers.Map>} 
     */
    setMap: function(map) {
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
     * {DOMElement} A reference to the DIV DOMElement containing the 
     *     switcher tabs.
     */  
    draw: function() {
        OpenLayers.Control.prototype.draw.apply(this);

        // create layout divs
        this.loadContents();

        // set mode to minimize
        if(!this.outsideViewport) {
            this.minimizeControl();
        }

        // populate div with current info
        this.redraw();    

        return this.div;
    },

    /** 
     * Method: clearLayersArray
     * User specifies either "base" or "data". we then clear all the
     *     corresponding listeners, the div, and reinitialize a new array.
     * 
     * Parameters:
     * layersType - {String}  
     */
    clearLayersArray: function(layersType) {
        var layers = this[layersType + "Layers"];
        if (layers) {
            for(var i=0, len=layers.length; i<len ; i++) {
                var layer = layers[i];
                OpenLayers.Event.stopObservingElement(layer.inputElem);
                OpenLayers.Event.stopObservingElement(layer.labelSpan);
            }
        }
        this[layersType + "LayersDiv"].innerHTML = "";
        this[layersType + "Layers"] = [];
    },


    /**
     * Method: checkRedraw
     * Checks if the layer state has changed since the last redraw() call.
     * 
     * Returns:
     * {Boolean} The layer state changed since the last redraw() call. 
     */
    checkRedraw: function() {
        var redraw = false;
        if ( !this.layerStates.length ||
             (this.map.layers.length != this.layerStates.length) ) {
            redraw = true;
        } else {
            for (var i=0, len=this.layerStates.length; i<len; i++) {
                var layerState = this.layerStates[i];
                var layer = this.map.layers[i];
                if ( (layerState.name != layer.name) || 
                     (layerState.inRange != layer.inRange) || 
                     (layerState.id != layer.id) || 
                     (layerState.visibility != layer.visibility) ) {
                    redraw = true;
                    break;
                }    
            }
        }    
        return redraw;
    },
    
    /** 
     * Method: redraw
     * Goes through and takes the current state of the Map and rebuilds the
     *     control to display that state. Groups base layers into a 
     *     radio-button group and lists each data layer with a checkbox.
     *
     * Returns: 
     * {DOMElement} A reference to the DIV DOMElement containing the control
     */  
    redraw: function() {
        //if the state hasn't changed since last redraw, no need 
        // to do anything. Just return the existing div.
        if (!this.checkRedraw()) { 
            return this.div; 
        } 

        //clear out previous layers 
        this.clearLayersArray("base");
        this.clearLayersArray("data");
        
        var containsOverlays = false;
        var containsBaseLayers = false;
        
        // Save state -- for checking layer if the map state changed.
        // We save this before redrawing, because in the process of redrawing
        // we will trigger more visibility changes, and we want to not redraw
        // and enter an infinite loop.
        var len = this.map.layers.length;
        this.layerStates = new Array(len);
        for (var i=0; i <len; i++) {
            var layer = this.map.layers[i];
            this.layerStates[i] = {
                'name': layer.name, 
                'visibility': layer.visibility,
                'inRange': layer.inRange,
                'id': layer.id
            };
        }    

        var layers = this.map.layers.slice();
        if (!this.ascending) { layers.reverse(); }
        for(var i=0, len=layers.length; i<len; i++) {
            var layer = layers[i];
            var baseLayer = layer.isBaseLayer;

            if (layer.displayInLayerSwitcher) {

                if (baseLayer) {
                    containsBaseLayers = true;
                } else {
                    containsOverlays = true;
                }    

                // only check a baselayer if it is *the* baselayer, check data
                //  layers if they are visible
                var checked = (baseLayer) ? (layer == this.map.baseLayer)
                                          : layer.getVisibility();
    
                // create input element
                var inputElem = document.createElement("input");
                inputElem.id = this.id + "_input_" + layer.name;
                inputElem.name = (baseLayer) ? this.id + "_baseLayers" : layer.name;
                inputElem.type = (baseLayer) ? "radio" : "checkbox";
                inputElem.value = layer.name;
                inputElem.checked = checked;
                inputElem.defaultChecked = checked;

                if (!baseLayer && !layer.inRange) {
                    inputElem.disabled = true;
                }
                var context = {
                    'inputElem': inputElem,
                    'layer': layer,
                    'layerSwitcher': this
                };
                OpenLayers.Event.observe(inputElem, "mouseup", 
                    OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context)
                );
                
                // #### edit by Raphael Rupprecht for changing the layer colors
                
                if(!baseLayer){
                    // cerate colorPicker input
                    var colorPickerInput = document.createElement('input');
                                   colorPickerInput.id = "colorPicker";
                                   colorPickerInput.value = layer.styleMap.styles.default.defaultStyle.strokeColor;
                                   colorPickerInput.size = "2";								  
                                   colorPickerInput.className = "color";
                                   colorPickerInput.style.color = colorPickerInput.value;
                                   colorPickerInput.style.backgroundColor = colorPickerInput.value;
								   colorPickerInput.style.margin = "0 10 0 0px"; // tpo right bottom left
								   colorPickerInput.style.width = "15px";
								   colorPickerInput.style.height = "13px";
								   colorPickerInput.style.border = "1px solid white";
								   colorPickerInput.style.cursor = "pointer";								 

                    var colorContext = {
                         'layerSwitcher': this,
                         'layer': layer,
                         'colorPickerInput': colorPickerInput,				// extended
                         'colorPickerInput': colorPickerInput
                    };
                    
                    OpenLayers.Event.observe(colorPickerInput, "click",
                        OpenLayers.Function.bindAsEventListener(this.onColorPickerClick,
                                                                colorContext)
                    );
                }          
  
				// in case of WOC.VectorStoringGML layer, some buttons are created
                if(layer.CLASS_NAME == "WOC.VectorStoringGML") {
                    // show GML Button
					var showGMLButton = document.createElement('input');
                    showGMLButton.type = 'button';
                    showGMLButton.value = 'Show GML';
                    showGMLButton.layer = layer;
                    OpenLayers.Event.observe(showGMLButton, "click",
                                    OpenLayers.Function.bindAsEventListener(
                                                    this.showGML, showGMLButton));
                    
					// layer delete Button
                    var deleteLayerButton = document.createElement('input');
                    deleteLayerButton.type = 'button';
                    deleteLayerButton.value = 'DEL';
                    deleteLayerButton.layer = layer;
                    OpenLayers.Event.observe(deleteLayerButton, "click",
                                    OpenLayers.Function.bindAsEventListener(
                                                    this.deleteGML, deleteLayerButton, {'layersw':this}));
                }
               // groupTable.appendChild(tableRow);                
                // ################################################################
                // create span
                var labelSpan = document.createElement("span");
                OpenLayers.Element.addClass(labelSpan, "labelSpan")
                if (!baseLayer && !layer.inRange) {
                    labelSpan.style.color = "gray";
                }
                labelSpan.innerHTML = layer.name;
                labelSpan.style.verticalAlign = (baseLayer) ? "bottom" 
                                                            : "baseline";
                OpenLayers.Event.observe(labelSpan, "click", 
                    OpenLayers.Function.bindAsEventListener(this.onInputClick,
                                                            context)
                );
                // create line break
                var br = document.createElement("br");
    
                var groupArray = (baseLayer) ? this.baseLayers
                                             : this.dataLayers;

                groupArray.push({
                    'layer': layer,
                    'inputElem': inputElem,
                    'labelSpan': labelSpan
                });    

                var groupDiv = (baseLayer) ? this.baseLayersDiv
                                           : this.dataLayersDiv;
 				if(!baseLayer){
					if(layer.CLASS_NAME == "WOC.VectorStoringGML"){
						groupDiv.appendChild(inputElem);
						groupDiv.appendChild(colorPickerInput);					// adding the color picker input
						groupDiv.appendChild(labelSpan);
						groupDiv.appendChild(showGMLButton);					// adding the showGML button
						groupDiv.appendChild(deleteLayerButton);				// adding the delete layer button
						groupDiv.appendChild(br);	
					} else {
						groupDiv.appendChild(inputElem);
						groupDiv.appendChild(colorPickerInput);					// adding the color picker input
						groupDiv.appendChild(labelSpan);
						groupDiv.appendChild(br);						
					}
				} else {
					groupDiv.appendChild(inputElem);
					groupDiv.appendChild(labelSpan);
					groupDiv.appendChild(br);
				}	
				
            }
        }

        // if no overlays, dont display the overlay label
        this.dataLbl.style.display = (containsOverlays) ? "" : "none";        
        
        // if no baselayers, dont display the baselayer label
        this.baseLbl.style.display = (containsBaseLayers) ? "" : "none";        

        return this.div;
    },
    
    onColorPickerClick: function(e) {
        var myPicker = new jscolor.color(this.colorPickerInput, this.layer, {});
            myPicker.showPicker();
    },    

    /** 
     * Method:
     * A label has been clicked, check or uncheck its corresponding input
     * 
     * Parameters:
     * e - {Event} 
     *
     * Context:  
     *  - {DOMElement} inputElem
     *  - {<OpenLayers.Control.LayerSwitcher>} layerSwitcher
     *  - {<OpenLayers.Layer>} layer
     */

    onInputClick: function(e) {

        if (!this.inputElem.disabled) {
            if (this.inputElem.type == "radio") {
                this.inputElem.checked = true;
                this.layer.map.setBaseLayer(this.layer);
            } else {
                this.inputElem.checked = !this.inputElem.checked;
                this.layerSwitcher.updateMap();
            }
        }
        OpenLayers.Event.stop(e);
    },
    
    /**
     * Method: onLayerClick
     * Need to update the map accordingly whenever user clicks in either of
     *     the layers.
     * 
     * Parameters: 
     * e - {Event} 
     */
    onLayerClick: function(e) {
        this.updateMap();
    },


    /** 
     * Method: updateMap
     * Cycles through the loaded data and base layer input arrays and makes
     *     the necessary calls to the Map object such that that the map's 
     *     visual state corresponds to what the user has selected in 
     *     the control.
     */
    updateMap: function() {

        // set the newly selected base layer        
        for(var i=0, len=this.baseLayers.length; i<len; i++) {
            var layerEntry = this.baseLayers[i];
            if (layerEntry.inputElem.checked) {
                this.map.setBaseLayer(layerEntry.layer, false);
            }
        }

        // set the correct visibilities for the overlays
        for(var i=0, len=this.dataLayers.length; i<len; i++) {
            var layerEntry = this.dataLayers[i];   
            layerEntry.layer.setVisibility(layerEntry.inputElem.checked);
        }

    },

    /** 
     * Method: maximizeControl
     * Set up the labels and divs for the control
     * 
     * Parameters:
     * e - {Event} 
     */
    maximizeControl: function(e) {

        // set the div's width and height to empty values, so
        // the div dimensions can be controlled by CSS
        this.div.style.width = "";
        this.div.style.height = "";

        this.showControls(false);

        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },
    
    /** 
     * Method: minimizeControl
     * Hide all the contents of the control, shrink the size, 
     *     add the maximize icon
     *
     * Parameters:
     * e - {Event} 
     */
    minimizeControl: function(e) {

        // to minimize the control we set its div's width
        // and height to 0px, we cannot just set "display"
        // to "none" because it would hide the maximize
        // div
        this.div.style.width = "0px";
        this.div.style.height = "0px";

        this.showControls(true);

        if (e != null) {
            OpenLayers.Event.stop(e);                                            
        }
    },

    /**
     * Method: showControls
     * Hide/Show all LayerSwitcher controls depending on whether we are
     *     minimized or not
     * 
     * Parameters:
     * minimize - {Boolean}
     */
    showControls: function(minimize) {

        this.maximizeDiv.style.display = minimize ? "" : "none";
        this.minimizeDiv.style.display = minimize ? "none" : "";

        this.layersDiv.style.display = minimize ? "none" : "";
    },
    
    /** 
     * Method: loadContents
     * Set up the labels and divs for the control
     */
    loadContents: function() {

        //configure main div

        OpenLayers.Event.observe(this.div, "mouseup", 
            OpenLayers.Function.bindAsEventListener(this.mouseUp, this));
        OpenLayers.Event.observe(this.div, "click",
                      this.ignoreEvent);
        OpenLayers.Event.observe(this.div, "mousedown",
            OpenLayers.Function.bindAsEventListener(this.mouseDown, this));
        OpenLayers.Event.observe(this.div, "dblclick", this.ignoreEvent);

        // layers list div        
        this.layersDiv = document.createElement("div");
        this.layersDiv.id = this.id + "_layersDiv";
        OpenLayers.Element.addClass(this.layersDiv, "layersDiv");

        this.baseLbl = document.createElement("div");
        this.baseLbl.innerHTML = OpenLayers.i18n("baseLayer");
        OpenLayers.Element.addClass(this.baseLbl, "baseLbl");
        
        this.baseLayersDiv = document.createElement("div");
        OpenLayers.Element.addClass(this.baseLayersDiv, "baseLayersDiv");

        this.dataLbl = document.createElement("div");
        this.dataLbl.innerHTML = OpenLayers.i18n("overlays");
        OpenLayers.Element.addClass(this.dataLbl, "dataLbl");
        
        this.dataLayersDiv = document.createElement("div");
        OpenLayers.Element.addClass(this.dataLayersDiv, "dataLayersDiv");

        if (this.ascending) {
            this.layersDiv.appendChild(this.baseLbl);
            this.layersDiv.appendChild(this.baseLayersDiv);
            this.layersDiv.appendChild(this.dataLbl);
            this.layersDiv.appendChild(this.dataLayersDiv);
        } else {
            this.layersDiv.appendChild(this.dataLbl);
            this.layersDiv.appendChild(this.dataLayersDiv);
            this.layersDiv.appendChild(this.baseLbl);
            this.layersDiv.appendChild(this.baseLayersDiv);
        }    
 
        this.div.appendChild(this.layersDiv);

        if(this.roundedCorner) {
            OpenLayers.Rico.Corner.round(this.div, {
                corners: "tl bl",
                bgColor: "transparent",
                color: this.roundedCornerColor,
                blend: false
            });
            OpenLayers.Rico.Corner.changeOpacity(this.layersDiv, 0.75);
        }

        var imgLocation = OpenLayers.Util.getImagesLocation();
        var sz = new OpenLayers.Size(18,18);        

        // maximize button div
        var img = imgLocation + 'layer-switcher-maximize.png';
        this.maximizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MaximizeDiv", 
                                    null, 
                                    sz, 
                                    img, 
                                    "fixed");
        OpenLayers.Element.addClass(this.maximizeDiv, "maximizeDiv");
        this.maximizeDiv.style.display = "none";
		
		OpenLayers.Event.observe(this.maximizeDiv, "click", 
            OpenLayers.Function.bindAsEventListener(this.maximizeControl, this)
        );
        
        this.div.appendChild(this.maximizeDiv);

        // minimize button div
        var img = imgLocation + 'layer-switcher-minimize.png';
        var sz = new OpenLayers.Size(18,18);        
        this.minimizeDiv = OpenLayers.Util.createAlphaImageDiv(
                                    "OpenLayers_Control_MinimizeDiv", 
                                    null, 
                                    sz, 
                                    img, 
                                    "fixed");
        OpenLayers.Element.addClass(this.minimizeDiv, "minimizeDiv");
        this.minimizeDiv.style.display = "none";
        OpenLayers.Event.observe(this.minimizeDiv, "click", 
            OpenLayers.Function.bindAsEventListener(this.minimizeControl, this)
        );

        this.div.appendChild(this.minimizeDiv);
    },
    
    /** 
     * Method: ignoreEvent
     * 
     * Parameters:
     * evt - {Event} 
     */
    ignoreEvent: function(evt) {
        OpenLayers.Event.stop(evt);
    },

    /** 
     * Method: mouseDown
     * Register a local 'mouseDown' flag so that we'll know whether or not
     *     to ignore a mouseUp event
     * 
     * Parameters:
     * evt - {Event}
     */
    mouseDown: function(evt) {
        this.isMouseDown = true;
        this.ignoreEvent(evt);
    },

    /** 
     * Method: mouseUp
     * If the 'isMouseDown' flag has been set, that means that the drag was 
     *     started from within the LayerSwitcher control, and thus we can 
     *     ignore the mouseup. Otherwise, let the Event continue.
     *  
     * Parameters:
     * evt - {Event} 
     */
    mouseUp: function(evt) {
        if (this.isMouseDown) {
            this.isMouseDown = false;
            this.ignoreEvent(evt);
        }
    },
    
    showGML: function(event) {
        var width  = 820;
        var height = 600;
        var left = (screen.width  - width)/2;
        var top = (screen.height - height)/2;
        var params = 'width=' + width + ', height=' + height +
                        ', top=' + top + ', left=' + left +
                        ', directories=no' +
                        ', location=no' +
                        ', menubar=no' +
                        ', resizable=yes' +
                        ', scrollbars=yes' +
                        ', status=yes' +
                        ', toolbar=yes';
        var newwin = window.open('', "_blank", params);
        var d = newwin.document;
        // Because the name has whitespace it has to be set here!
        newwin.name = 'GML data';
        d.open("text/html","replace");
        newwin.document.write("<html><head>" +
                        "<title>GML data</title>" +
                        "</head><body><pre>" +
                        this.layer.getGML().replace(/</g, "&lt;").replace(/>/g, "&gt;") +
                        "</pre></body></html>");
        newwin.document.close();
        if (window.focus) {
                newwin.focus();
        }
         if (event) {
                 OpenLayers.Event.stop(event);
         }
    },

	// RR: button DEL for deleting GML Output layers
	deleteGML: function(event) {
	         var layers = this.layer.map.layers;
	
	        
	         // 1. removing the layer from the processResultLayers Array
             var processResults = map.controls[8].processResultLayer;		// map.control[8] is the WPSClient
				  
	         for(var i=0; i<processResults.length; i++){
	                 if(this.layer == processResults[i]){
	                       var newProcessResultArray = map.controls[9].delElem(processResults, this.layer);	// delElem exists in this control (WpsResultLayerSwitcher)
	                       var newLayerArray = map.controls[9].delElem(map.layers, this.layer);
	                       // saving the new processResult layer back
	                       map.controls[8].processResultLayer = newProcessResultArray;	// update the client
	                       // saving the new layer list back
	                       map.layers = newLayerArray;
	                       map.controls[8].updateDescription();							// update the client
	                 }
	         }
	         
	         // 2. removing the layer from the map layers
	         this.layer.map.removeLayer(this.layer, true);
	
	         if (event) {
	                 OpenLayers.Event.stop(event);
	         }
	},

	/*
	* function added by raphael rupprecht for deleting an outputlayer out of the outputlayer array
	*
	* @param: array - the array which contains the object to delete
	* @param: object - the object to delete
	* @return: the new array without the deleted element, -1 if an error occured
	*/
	delElem: function(array, object){
	              // fall: array ist leer
	              if(array.length == 0){
	                 alert("Error: Cannot delete empty array!");
	                 return -1;
	              }
	              // fall: array hat nur 1 element
	              if(array.length == 1){
	                 array[0] = null;
	                 return array;
	              }
	
	              var cutPosition = -1;
	              for (var i=0; i<array.length; i++){
	                  if(array[i] == object){
	                       //alert("object found!");
	                       cutPosition = i;
	                       break;
	                  }
	              }
	              if(cutPosition == -1){
	                  alert("Error: The object you want to delete, does not exist in the array!");
	                  return -1;
	              }
	
	              // fall: object am anfang
	              if(cutPosition == 0){
	                  return array.slice(1, array.length);
	              }
	
	              // fall: object am ende
	              if(cutPosition == array.length-1){
	                  return array.slice(0, array.length-1);
	              }
	
	              // fall: object im array, aber nicht am anfang oder ende
	              var tempHeader = array.slice(0, cutPosition);
	              var tempTrailer = array.slice(cutPosition+1, array.length);
	              return tempHeader.concat(tempTrailer);
	},
    

    CLASS_NAME: "OpenLayers.Control.WpsResultLayerSwitcher"
});
