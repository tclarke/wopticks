var map, layer, styleMap;

function initHistogram(dataUrl, wgl, isLt)
{
  var histData = null;
  var url = "http://10.81.22.100/pywps/pywps.cgi?";
  var wps = new OpenLayers.WPS(url,
         {
            onDescribedProcess: function(process) {
                  process.inputs[0].setValue(1)
                  process.inputs[1].asReference = true;
                  process.inputs[1].mimeType = "image/tiff";
                  process.inputs[1].setValue(dataUrl);
                  wps.execute(process.identifier);
               },
            onSucceeded: function(process) {
                 histUrl = process.outputs[0].getValue();
                 var hloader = new Ajax.Request(histUrl,
                        {onSuccess: function(r) {
                          histData = r.responseJSON;
                          var hplot = Flotr.draw(
                              $('histogram'), [histData],
                              {bars: {show:true},
                               mouse: {track:true, position:'nw', radius: 0}}
                           );
                          hplot.overlay.color = '#ff0000';
                          if (isLt) {
                             hplot.selection.first.x = hplot.axes.x.min;
                             hplot.selection.second.x = (wgl.tile.currentThreshValue - hplot.axes.x.min) * hplot.axes.x.scale;
                          } else {
                             hplot.selection.first.x = (wgl.tile.currentThreshValue - hplot.axes.x.min) * hplot.axes.x.scale;
                             hplot.selection.second.x = hplot.axes.x.max;
                          }
                          hplot.selection.first.y = 0.0;
                          hplot.selection.second.y = hplot.plotHeight;
                          hplot.overlay.show();
                          hplot.drawSelection();

                          $('histogram').observe('flotr:click', function(evt) {
                                 var position = evt.memo[0];
                                 wgl.tile.currentThreshValue = position.x;
                                 if (isLt) {
                                    hplot.selection.second.x = (wgl.tile.currentThreshValue - hplot.axes.x.min) * hplot.axes.x.scale;
                                 } else {
                                    hplot.selection.first.x = (wgl.tile.currentThreshValue - hplot.axes.x.min) * hplot.axes.x.scale;
                                 }
                                 hplot.clearSelection();
                                 hplot.drawSelection();
                                 map.layers[1].tile.positionImage();
                           });
                         map.layers[1].tile.positionImage();
                     }});
               }
         });
  wps.describeProcess("CalcHist");
}

function initNdvi(wcs)
{
  var url = "http://10.81.22.100/pywps/pywps.cgi?";
  var wps = new OpenLayers.WPS(url,
         {
            onDescribedProcess: function(process) {
                  process.inputs[0].asReference = true;
                  process.inputs[0].mimeType = "image/png";
                  process.inputs[0].setValue(wcs.getCoverageUrl("boulder", {format:"GTiff", rangesubset:"5,7", size:["X(512)", "Y(512)"]}));
                  wps.execute(process.identifier);
               },
            onSucceeded: function(process) {
                 var imgUrl = unescape(process.outputs[0].getValue());
                 imgUrl = imgUrl.replace("tiff", "png");
                 var glLayer = new OpenLayers.Layer.WebGL(
                   'NDVI',
                   imgUrl,
                   new OpenLayers.Bounds(-180,-90,180,90),
                   new OpenLayers.Size(512, 512),
                   {
                      isBaseLayer: false
                   }
                 );

                 var aliasProj = new OpenLayers.Projection("EPSG:3857");
                 glLayer.projection = aliasProj;
                 OpenLayers.Projection.addTransform("EPSG:4326", "EPSG:3857", OpenLayers.Layer.SphericalMercator.projectForward);
                 OpenLayers.Projection.addTransform("EPSG:3857", "EPSG:4326", OpenLayers.Layer.SphericalMercator.projectInverse);
                 map.addLayer(glLayer);
                 initHistogram(imgUrl, glLayer, true);
               }
         });
  wps.describeProcess("CalcNdvi");
}

function init() {
    OpenLayers.ProxyHost = "/cgi-bin/proxy.cgi?url=";
    var bounds = new OpenLayers.Bounds(
                -11742027.0, 4894200.8,
                -11695629.7, 4857816.8
         );
    map = new OpenLayers.Map('map', {units: 'm', projection: "EPSG:3857", maxResolution: 21});

    // prepare to style the data
    styleMap = new OpenLayers.StyleMap({
        strokeColor: "black",
        strokeWidth: 2,
        strokeOpacity: 0.5,
        fillOpacity: 0.2
    });

    var wcs = new OpenLayers.WCS("http://10.81.22.100/cgi-bin/mapserv?map=/var/www/wopticks/etc/boulder.map")
    var imgLayer = new OpenLayers.Layer.Image(
      'Test Image',
       wcs.getCoverageUrl("base", {format:"png", rangesubset:"1", size:["X(512)", "Y(512)"]}),
      new OpenLayers.Bounds(-180,-90,180,90),
      new OpenLayers.Size(512, 512),
      {
         isBaseLayer: true
      }
    );

    var aliasProj = new OpenLayers.Projection("EPSG:3857");
    imgLayer.projection = aliasProj;
    OpenLayers.Projection.addTransform("EPSG:4326", "EPSG:3857", OpenLayers.Layer.SphericalMercator.projectForward);
    OpenLayers.Projection.addTransform("EPSG:3857", "EPSG:4326", OpenLayers.Layer.SphericalMercator.projectInverse);
    map.addLayer(imgLayer);
    map.addControls([
       new OpenLayers.Control.MousePosition(),
       new OpenLayers.Control.ScaleLine($('scale')),
       new OpenLayers.Control.Navigation(),
       new OpenLayers.Control.PanZoomBar(),
       new OpenLayers.Control.MouseDefaults(),
       new OpenLayers.Control.LayerSwitcher()
      ]);
    map.zoomToExtent(bounds);
    if (!map.getCenter()) map.zoomToMexExtent();
    initNdvi(wcs);
}
