/**
 * @author r_rupp01
 * Function for adding list of controls, this does not affect the original OL code
 */
OpenLayers.Map.prototype.addControls = function(controls){
	for(var i = 0; i < controls.length; i++){
		this.addControl(controls[i]);
	}
}

/**
 * @author r_rupp01
 * OVERRIDE
 * Function for random color while adding the layers, this function does affect the original OL code
 */
OpenLayers.Map.prototype.addLayer = function(layer){
    for(var i=0, len=this.layers.length; i <len; i++) {
        if (this.layers[i] == layer) {
            var msg = OpenLayers.i18n('layerAlreadyAdded', 
                                                  {'layerName':layer.name});
            OpenLayers.Console.warn(msg);
            return false;
        }
    }
    if(this.allOverlays) {
        layer.isBaseLayer = false;
    }

    if (this.events.triggerEvent("preaddlayer", {layer: layer}) === false) {
        return;
    }
    
    layer.div.className = "olLayerDiv";
    layer.div.style.overflow = "";
    this.setLayerZIndex(layer, this.layers.length);

    if (layer.isFixed) {
        this.viewPortDiv.appendChild(layer.div);
    } else {
        this.layerContainerDiv.appendChild(layer.div);
    }
    this.layers.push(layer);
    layer.setMap(this);

    if (layer.isBaseLayer || (this.allOverlays && !this.baseLayer))  {
        if (this.baseLayer == null) {
            // set the first baselaye we add as the baselayer
            this.setBaseLayer(layer);
        } else {
            layer.setVisibility(false);
        }
    } else {
    	this.setRandomColorForLayer(layer);			// EDIT by Raphael Rupprecht for random colors
        layer.redraw();
    }

    this.events.triggerEvent("addlayer", {layer: layer});
    layer.afterAdd();
}

/**
 * @author r_rupp01
 * Function for random colors while adding the layers, this does not affect the original OL code, just a extend
 */
OpenLayers.Map.prototype.setRandomColorForLayer = function(layer) {
    var colors = new Array('red','blue','yellow','green', 'darkblue', 'grey', 'black', 'orange',
                           'navy','teal','lime','aqua','maroon','purple','olive','silver');
    var min = 0;
    var max = colors.length-1;
    var randomInt = ( min + parseInt( Math.random() * ( max-min+1 ) ) );

    var randomStyleMap = new OpenLayers.StyleMap(OpenLayers.Util.applyDefaults(
          {strokeColor: colors[randomInt],
                        fillOpacity: 0.3,
                        strokeWidth: 2.0,
                        pointRadius: 10,
                        fillColor: colors[randomInt]},
          OpenLayers.Feature.Vector.style["default"]));

    layer.styleMap = randomStyleMap;
    //layer.styleMap.styles.default.defaultStyle.strokeColor = colors[randomInt];
    //layer.styleMap.styles.default.defaultStyle.fillColor = colors[randomInt];
}