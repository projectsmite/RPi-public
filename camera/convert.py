import sys
from subprocess import call
filename =sys.argv[1]
command = "sudo MP4Box -add video.h264 {}".format(filename)
call([command],shell=True)