import logging
from pywps.Process import WPSProcess
import json
import os
import numpy
import types
from osgeo import gdalconst,gdal

class Process(WPSProcess):
   def __init__(self):
      WPSProcess.__init__(self,
            identifier = "CalcHist",
            title = "Calculate histogram",
            abstract = "This calculates a histogram over WCS data.",
            version = "1.0",
            storeSupported = "true",
            statusSupported = "false")
      self.input = self.addComplexInput(identifier="data",
                                        title="WCS data reference",
                                        formats=[{"mimeType":"image/tiff", "encoding":"utf-8"}]
                   )
      self.inputBand = self.addLiteralInput(identifier="band",
                                            title="Band to process.",
                                            minOccurs=1,
                                            maxOccurs=1,
                                            type=types.IntType)
      self.output = self.addComplexOutput(identifier="histogram",
                                          title="Histogram data",
                                          formats=[{"mimeType":"application/json"}])

   def execute(self):
      logging.debug(str(dir(self.input)))
      d = gdal.Open(self.input.getValue(), gdalconst.GA_ReadOnly)
      b = d.GetRasterBand(self.inputBand.getValue())
      a = b.ReadAsArray()
      h = numpy.histogram(a, bins=256)
      histData = map(lambda a,b,c: [a+(b-a)/2.0, float(c)], h[1][:-1], h[1][1:], h[0])
      del b,a,h,d
      open('out.json', 'wt').write(json.dumps(histData))
      self.output.setValue('out.json')
      return
