/**
 * Function: createCanvas
 * Creates a canvas element with specific attribute values.
 *  
 * Parameters:
 * id - {String} The id field for the canvas.  If none assigned one will be
 *               automatically generated.
 * px - {<OpenLayers.Pixel>} The left and top positions.
 * sz - {<OpenLayers.Size>} The style.width and style.height values.
 * position - {String} The style.position value.
 * border - {String} The border to place around the image.
 * opacity - {Float} Fractional value (0.0 - 1.0)
 * delayDisplay - {Boolean} If true waits until the image has been
 *                          loaded.
 * 
 * Returns:
 * {DOMElement} A DOM Image created with the specified attributes.
 */
createCanvas = function(id, px, sz, position, border,
                                       opacity, delayDisplay) {

    var canvas = document.createElement("canvas");

    //set generic properties
    if (!id) {
        id = OpenLayers.Util.createUniqueID("OpenLayersDiv");
    }
    if (!position) {
        position = "relative";
    }
    OpenLayers.Util.modifyDOMElement(canvas, id, px, sz, position, 
                                     border, null, opacity);


    canvas.style.zIndex = 2000;
    if(delayDisplay) {
    	canvas.style.display = "none";
        OpenLayers.Event.observe(canvas, "load", 
            OpenLayers.Function.bind(OpenLayers.Util.onImageLoad, canvas));
        OpenLayers.Event.observe(canvas, "error", 
            OpenLayers.Function.bind(OpenLayers.Util.onImageLoadError, canvas));
        
    }
    
    //set special properties
    canvas.style.alt = id;
    canvas.galleryImg = "no";
    
    return canvas;
};

OpenLayers.Layer.WebGL = OpenLayers.Class(OpenLayers.Layer.Image, {

    /**
     * Property: isBaseLayer
     * {Boolean} The layer is a base layer.  Default is false.  Set this property
     * in the layer options
     */
    isBaseLayer: false,
    
    /**
     * Property: url
     * {String} URL of the image to use
     */
    url: null,

    /**
     * Property: extent
     * {<OpenLayers.Bounds>} The image bounds in map units.  This extent will
     *     also be used as the default maxExtent for the layer.  If you wish
     *     to have a maxExtent that is different than the image extent, set the
     *     maxExtent property of the options argument (as with any other layer).
     */
    extent: null,
    
    /**
     * Property: size
     * {<OpenLayers.Size>} The image size in pixels
     */
    size: null,

    /**
     * Property: tile
     * {<OpenLayers.Tile.Image>}
     */
    tile: null,

    /**
     * Property: aspectRatio
     * {Float} The ratio of height/width represented by a single pixel in the
     * graphic
     */
    aspectRatio: null,

    /**
     * Constructor: OpenLayers.Layer.Image
     * Create a new image layer
     *
     * Parameters:
     * name - {String} A name for the layer.
     * url - {String} Relative or absolute path to the image
     * extent - {<OpenLayers.Bounds>} The extent represented by the image
     * size - {<OpenLayers.Size>} The size (in pixels) of the image
     * options - {Object} Hashtable of extra options to tag onto the layer
     */
    initialize: function(name, url, extent, size, options) {
        this.url = url;
        this.extent = extent;
        this.maxExtent = extent;
        this.size = size;
        OpenLayers.Layer.prototype.initialize.apply(this, [name, options]);

        this.aspectRatio = (this.extent.getHeight() / this.size.h) /
                           (this.extent.getWidth() / this.size.w);
    },    

    /**
     * Method: destroy
     * Destroy this layer
     */
    destroy: function() {
        if (this.tile) {
            this.removeTileMonitoringHooks(this.tile);
            this.tile.destroy();
            this.tile = null;
        }
        OpenLayers.Layer.prototype.destroy.apply(this, arguments);
    },
    
    /**
     * Method: clone
     * Create a clone of this layer
     *
     * Paramters:
     * obj - {Object} An optional layer (is this ever used?)
     *
     * Returns:
     * {<OpenLayers.Layer.Image>} An exact copy of this layer
     */
    clone: function(obj) {
        
        if(obj == null) {
            obj = new OpenLayers.Layer.WebGL(this.name,
                                               this.url,
                                               this.extent,
                                               this.size,
                                               this.getOptions());
        }

        //get all additions from superclasses
        obj = OpenLayers.Layer.prototype.clone.apply(this, [obj]);

        // copy/set any non-init, non-simple values here

        return obj;
    },    

    /**
     * Method: draw
     * Force a redraw of the layer
     */
    draw: function() {
       this.tile.drawGl()
    },
    
    /** 
     * Method: moveTo
     * Create the tile for the image or resize it for the new resolution
     * 
     * Parameters:
     * bounds - {<OpenLayers.Bounds>}
     * zoomChanged - {Boolean}
     * dragging - {Boolean}
     */
    moveTo:function(bounds, zoomChanged, dragging) {
        OpenLayers.Layer.prototype.moveTo.apply(this, arguments);

        var firstRendering = (this.tile == null);

        if(zoomChanged || firstRendering) {

            //determine new tile size
            this.setTileSize();

            //determine new position (upper left corner of new bounds)
            var ul = new OpenLayers.LonLat(this.extent.left, this.extent.top);
            var ulPx = this.map.getLayerPxFromLonLat(ul);

            if(firstRendering) {
                //create the new tile
                this.tile = new OpenLayers.Tile.WebGL(this, ulPx, this.extent, 
                                                      null, this.tileSize);
                this.addTileMonitoringHooks(this.tile);
            } else {
                //just resize the tile and set it's new position
                this.tile.size = this.tileSize.clone();
                this.tile.position = ulPx.clone();
            }
            this.tile.draw();
        }
    }, 

    CLASS_NAME: "OpenLayers.Layer.WebGL"
});

OpenLayers.Tile.WebGL = OpenLayers.Class(OpenLayers.Tile, {

	/**
	 * Property: gl
	 * WebGL context.
	 */
    gl: null,

    /** 
     * Property: url
     * {String} The URL of the image being requested. No default. Filled in by
     * layer.getURL() function. 
     */
    url: null,
    
    /** 
     * Property: canvasDiv
     * {DOMElement} The div element which wraps the image.
     */
    canvasDiv: null,

    /**
     * Property: frame
     * {DOMElement} The image element is appended to the frame.  Any gutter on
     * the image will be hidden behind the frame. 
     */ 
    frame: null, 
    
    /**
     * Property: lastRatio
     * {Float} Used in transition code only.  This is the previous ratio
     *     of the back buffer tile resolution to the map resolution.  Compared
     *     with the current ratio to determine if zooming occurred.
     */
    lastRatio: 1,

    /**
     * Property: isFirstDraw
     * {Boolean} Is this the first time the tile is being drawn?
     *     This is used to force resetBackBuffer to synchronize
     *     the backBufferTile with the foreground tile the first time
     *     the foreground tile loads so that if the user zooms
     *     before the layer has fully loaded, the backBufferTile for
     *     tiles that have been loaded can be used.
     */
    isFirstDraw: true,

    g_texture: null,
    g_textureLoc: -1,
    g_threshValLoc: -1,
    //g_programObject: null,
    g_vbo: null,
    g_texCoordOffset: 0,
    buffer: null,
    currentThreshValue: null,

    /** TBD 3.0 - reorder the parameters to the init function to remove 
     *             URL. the getUrl() function on the layer gets called on 
     *             each draw(), so no need to specify it here.
     * 
     * Constructor: OpenLayers.Tile.Image
     * Constructor for a new <OpenLayers.Tile.Image> instance.
     * 
     * Parameters:
     * layer - {<OpenLayers.Layer>} layer that the tile will go in.
     * position - {<OpenLayers.Pixel>}
     * bounds - {<OpenLayers.Bounds>}
     * size - {<OpenLayers.Size>}
     */   
    initialize: function(layer, position, bounds, url, size) {
        OpenLayers.Tile.prototype.initialize.apply(this, arguments);

        this.frame = document.createElement('div'); 
        this.frame.style.overflow = 'hidden'; 
        this.frame.style.position = 'absolute';
        this.currentThreshValue = 150.0;
    },

    /** 
     * APIMethod: destroy
     * nullify references to prevent circular references and memory leaks
     */
    destroy: function() {
        if (this.canvasDiv != null)  {
            // unregister the "load" and "error" handlers.
            OpenLayers.Event.stopObservingElement(this.canvasDiv);
            
            if (this.canvasDiv.parentNode == this.frame) {
                this.frame.removeChild(this.canvasDiv);
            }
        }
        this.canvasDiv = null;
        if ((this.frame != null) && (this.frame.parentNode == this.layer.div)) { 
            this.layer.div.removeChild(this.frame); 
        }
        this.frame = null; 
        
        this.layer.events.unregister("loadend", this, this.resetBackBuffer);
        
        if (this.g_texture != null) {
        	this.gl.deleteTexture(this.g_texture);
        	this.g_texture = null;
        }
        
        /*if (this.g_programObject != null) {
        	this.gl.deleteProgram(this.g_programObject);
        	this.g_programObject = null;
        }*/
        
        if (this.g_vbo != null) {
        	this.gl.deleteBuffer(this.g_vbo);
        	this.g_vbo = null;
        }
        
        if (this.g_texture != null) {
        	this.gl.deleteTexture(this.g_texture);
        	this.g_texture = null;
        }
        
        /*if (this.vertexShader == null) {
        	this.gl.deleteShader(this.vertexShader);
        	this.vertexShader = null;
        }*/
        
        /*if (this.fragmentShader == null) {
        	this.gl.deleteShader(this.fragmentShader);
        	this.fragmentShader = null;
        }*/
        
        OpenLayers.Tile.prototype.destroy.apply(this, arguments);
    },

    /**
     * Method: clone
     *
     * Parameters:
     * obj - {<OpenLayers.Tile.Image>} The tile to be cloned
     *
     * Returns:
     * {<OpenLayers.Tile.Image>} An exact clone of this <OpenLayers.Tile.Image>
     */
    clone: function (obj) {
        if (obj == null) {
            obj = new OpenLayers.Tile.WebGL(this.layer, 
                                            this.position, 
                                            this.bounds, 
                                            this.size);        
        } 
        
        //pick up properties from superclass
        obj = OpenLayers.Tile.prototype.clone.apply(this, [obj]);
        
        //dont want to directly copy the canvas div
        obj.canvasDiv = null;
        obj.buffer = null;
        
        return obj;
    },
    
    /**
     * Method: draw
     * Check that a tile should be drawn, and draw it.
     * 
     * Returns:
     * {Boolean} Always returns true.
     */
    draw: function() {
        if (this.layer != this.layer.map.baseLayer && this.layer.reproject) {
            this.bounds = this.getBoundsFromBaseLayer(this.position);
        }
        var drawTile = OpenLayers.Tile.prototype.draw.apply(this, arguments);
        
        if (drawTile && this.isFirstDraw) {
            this.events.register('loadend', this, this.show);
            this.isFirstDraw = false;
        }   
        
        if (!drawTile) {
            return false;
        }
        
        if (this.isLoading) {
            //if we're already loading, send 'reload' instead of 'loadstart'.
            this.events.triggerEvent("reload"); 
        } else {
            this.isLoading = true;
            this.events.triggerEvent("loadstart");
        }
        
        return this.renderTile();
    },
    
    /**
     * Method: renderTile
     * Internal function to actually initialize the image tile,
     *     position it correctly, and set its url.
     */
    renderTile: function() {
        if (this.canvasDiv == null) {
            this.initCanvasDiv();
        }

        this.canvasDiv.viewRequestID = this.layer.map.viewRequestID;
        
        if (this.layer.async) {
            // Asyncronous image requests call the asynchronous getURL method
            // on the layer to fetch an image that covers 'this.bounds', in the scope of
            // 'this', setting the 'url' property of the layer itself, and running
            // the callback 'positionFrame' when the image request returns.
            this.layer.getURLasync(this.bounds, this, "url", this.positionImage);
        } else {
            // syncronous image requests get the url and position the frame immediately,
            // and don't wait for an image request to come back.
          
            // needed for changing to a different server for onload error
            if (this.layer.url instanceof Array) {
                this.canvasDiv.urls = this.layer.url.slice();
            }
          
            this.url = this.layer.getURL(this.bounds);
          
            // position the frame immediately
            this.positionImage(); 
        }
        return true;
    },

    /**
     * Method: positionImage
     * Using the properties currenty set on the layer, position the tile correctly.
     * This method is used both by the async and non-async versions of the Tile.Image
     * code.
     */
     positionImage: function() {
        // if the this layer doesn't exist at the point the image is
        // returned, do not attempt to use it for size computation
        if (this.layer === null) {
            return;
        }
        if (this.buffer != null) {
        	this.buffer = new Image();
                OpenLayers.Event.observe(this.buffer, "error",
                                 OpenLayers.Function.bind(onerror, this));
        }
        // position the frame 
        OpenLayers.Util.modifyDOMElement(this.frame, 
                                          null, this.position, this.size);   

        var imageSize = this.layer.getImageSize(this.bounds); 
        OpenLayers.Util.modifyDOMElement(this.canvasDiv,
                null, null, imageSize);
        OpenLayers.Util.modifyDOMElement(this.buffer, null, null, imageSize);
        
        // Create and initialize the WebGLTexture object.
        this.g_texture = this.gl.createTexture();
        this.gl.activeTexture(this.gl.TEXTURE0);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.g_texture);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.buffer.onload = this.drawGl;
        this.buffer.canvas = this;
        this.buffer.src = this.url;
    },

    /** 
     * Method: clear
     *  Clear the tile of any bounds/position-related data so that it can 
     *   be reused in a new location.
     */
    clear: function() {
        if(this.canvasDiv) {
            this.hide();
            if (OpenLayers.Tile.Image.useBlankTile) { 
                this.canvasDiv.src = OpenLayers.Util.getImagesLocation() + "blank.gif";
            }    
        }
    },
    
    /**
     * Method: drawGl
     * Draw items to OpenGL context
     */
    drawGl: function()
    {
       if (this.canvas.isLoading) { 
           this.canvas.isLoading = false; 
           this.canvas.show()
       }
       var gl = this.canvas.gl;
       gl.clear(gl.COLOR_BUFFER_BIT);
       //gl.useProgram(this.canvas.g_programObject);
       gl.bindBuffer(gl.ARRAY_BUFFER, this.canvas.g_vbo);
       gl.enableVertexAttribArray(0);
       gl.vertexAttribPointer(0, 3, gl.FLOAT, gl.FALSE, 0, 0);
       gl.enableVertexAttribArray(1);
       gl.vertexAttribPointer(1, 2, gl.FLOAT, gl.FALSE, 0, this.canvas.g_texCoordOffset);
       gl.uniform1f(this.canvas.g_threshValLoc, this.canvas.currentThreshValue / 255.0);

       // Bind the texture to texture unit 0
       gl.activeTexture(gl.TEXTURE0);
       gl.bindTexture(gl.TEXTURE_2D, this.canvas.g_texture);
       gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
       gl.texImage2D(
               gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this);
       // Point the uniform sampler to texture unit 0
       gl.uniform1i(this.canvas.g_textureLoc, 0);
       // Draw the array
       gl.drawArrays(gl.TRIANGLES, 0, 6);
       gl.flush();
},
    
    /**
     * Method: initCanvasDiv
     * Creates the canvasDiv property on the tile.
     */
    initCanvasDiv: function() {
        var offset = this.layer.imageOffset; 
        var size = this.layer.getImageSize(this.bounds); 
     
        this.canvasDiv = createCanvas(null,
                                      offset,
                                      size,
                                      "relative",
                                      null,
                                      null,
                                      true);
        
        this.canvasDiv.className = 'olTileImage';

        this.frame.style.zIndex = 1000;
        this.frame.appendChild(this.canvasDiv); 
        this.layer.div.appendChild(this.frame); 

        if(this.layer.opacity != null) {
            OpenLayers.Util.modifyDOMElement(this.canvasDiv, null, null, null,
                                             null, null, null, 
                                             this.layer.opacity);
        }

        //bind a listener to the onload of the image div so that we 
        // can register when a tile has finished loading.
        var onload = function() {
            
            //normally isLoading should always be true here but there are some 
            // right funky conditions where loading and then reloading a tile
            // with the same url *really*fast*. this check prevents sending 
            // a 'loadend' if the msg has already been sent
            //
            if (this.isLoading) { 
                this.isLoading = false; 
                this.events.triggerEvent("loadend"); 
            }
        };
        

        // Bind a listener to the onerror of the image div so that we
        // can registere when a tile has finished loading with errors.
        var onerror = function() {

            // If we have gone through all image reload attempts, it is time
            // to realize that we are done with this image. Since
            // OpenLayers.Util.onImageLoadError already has taken care about
            // the error, we can continue as if the image was loaded
            // successfully.
            if (this.canvasDiv._attempts > OpenLayers.IMAGE_RELOAD_ATTEMPTS) {
                onload.call(this);
            }
        };
        
        if (this.gl == null) {
           //this.gl = initWebGL("debugCanvas", "vshader", "fshader",
           this.gl = initWebGL(this.canvasDiv.id, "vshader", "fshader",
                        ["g_Position", "g_TexCoord0"], [0, 0, 0, 0], 10000);
           this.gl = WebGLDebugUtils.makeDebugContext(this.gl);
           if (this.gl == null) {
        	   alert("Unable to initialize WebGL!");
           }
           this.gl.viewport(0, 0, this.canvasDiv.width, this.canvasDiv.height);
           this.initObjs();
        }
        if (this.buffer == null) {
            this.buffer = new Image();
            OpenLayers.Event.observe(this.buffer, "error",
                                 OpenLayers.Function.bind(onerror, this));
        
         }
    },

    initObjs: function() {
       this.g_textureLoc = this.gl.getUniformLocation(this.gl.program, "thresh");
       this.g_threshValLoc = this.gl.getUniformLocation(this.gl.program, "threshold");
       this.g_vbo = this.gl.createBuffer();
       this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.g_vbo);
       var vertices = new Float32Array([
           1.0,  1.0, 0.0,
          -1.0,  1.0, 0.0,
          -1.0, -1.0, 0.0,
           1.0,  1.0, 0.0,
          -1.0, -1.0, 0.0,
           1.0, -1.0, 0.0]);
       var texCoords = new Float32Array([
          1.0, 1.0,
          0.0, 1.0,
          0.0, 0.0,
          1.0, 1.0,
          0.0, 0.0,
          1.0, 0.0]);
       this.g_texCoordOffset = vertices.byteLength;
       this.gl.bufferData(this.gl.ARRAY_BUFFER,
    		   		 this.g_texCoordOffset + texCoords.byteLength,
                     this.gl.STATIC_DRAW);
       this.gl.bufferSubData(this.gl.ARRAY_BUFFER, 0, vertices);
       this.gl.bufferSubData(this.gl.ARRAY_BUFFER, this.g_texCoordOffset, texCoords);
    },

    /** 
     * Method: show
     * Show the tile by showing its frame.
     */
    show: function() {
        this.frame.style.display = '';
        this.canvasDiv.style.display = '';
        // Force a reflow on gecko based browsers to actually show the element
        // before continuing execution.
        if (OpenLayers.Util.indexOf(this.layer.SUPPORTED_TRANSITIONS, 
                this.layer.transitionEffect) != -1) {
            if (navigator.userAgent.toLowerCase().indexOf("gecko") != -1) { 
                this.frame.scrollLeft = this.frame.scrollLeft; 
            } 
        }
    },
    
    /** 
     * Method: hide
     * Hide the tile by hiding its frame.
     */
    hide: function() {
        this.frame.style.display = 'none';
    },
    
    CLASS_NAME: "OpenLayers.Tile.Image"
  }
);
