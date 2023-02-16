from time import sleep
from picamera import PiCamera
import sys



filename=sys.argv[1]

camera = PiCamera()
camera.resolution = (1024, 768)
camera.capture(filename)
camera.close()