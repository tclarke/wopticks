import logging
from pywps.Process import WPSProcess
from osgeo import gdalconst,gdal
from numpy import asarray,isnan

class Process(WPSProcess):
   def __init__(self):
      WPSProcess.__init__(self,
            identifier = "CalcNdvi",
            title = "Calculate NDVI",
            abstract = "This calculates an NDVI map over WCS data.",
            version = "1.0",
            storeSupported = "true",
            statusSupported = "false")
      self.input = self.addComplexInput(identifier="data",
                                        title="WCS data reference",
                                        formats=[{
                                           "mimeType":"image/tiff",
                                           "encoding":"utf-8"
                                        }]
                   )
      self.output = self.addComplexOutput(identifier="ndvi",
                                          title="NDVI data",
                                          formats=[{"mimeType":"image/tiff"},
                                             {"mimeType":"image/png"}],
                                          useMapscript=True)

   def execute(self):
      d = gdal.Open(self.input.getValue(), gdalconst.GA_ReadOnly)
      red,nir = d.GetRasterBand(1),d.GetRasterBand(2)
      redData,nirData = asarray(red.ReadAsArray(), dtype="float"),asarray(nir.ReadAsArray(), dtype="float")
      ndvi = (nirData - redData) / (nirData + redData)
      ndvi[isnan(ndvi)] = 0.0
      logging.debug("%f-%f" % (ndvi.min(), ndvi.max()))
      ndvi -= ndvi.min()
      ndvi /= (ndvi.max() / 255.0)
      logging.debug("%f-%f" % (ndvi.min(), ndvi.max()))

      driver = gdal.GetDriverByName("GTiff")
      o = driver.Create("ndvi.tif", ndvi.shape[0], ndvi.shape[1], gdalconst.GDT_Byte)
      o.GetRasterBand(1).WriteArray(ndvi)
      o.SetGeoTransform(d.GetGeoTransform())
      self.output.setValue('ndvi.tif')
      logging.debug("output posted")
      return
