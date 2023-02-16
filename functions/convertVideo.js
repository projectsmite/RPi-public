const {spawn, exec} = require("child_process")
const { S3Client, PutObjectCommand} = require("@aws-sdk/client-s3");
var fs = require('fs');


convertVideo = (device, s3) =>{

    var today = new Date()
    var filename = today.getFullYear()+'-'+today.getDate()+'-'+(today.getMonth()+1)+'-'+today.getHours() + "-" + today.getMinutes()+'-'+today.getSeconds()+'.mp4'
    child = spawn('python3',['camera/convert.py',filename])
    convertVideoData=""
    convertVideoError=""
    child.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
        convertVideoData+=data.toString()
    });
    
    child.stderr.on('data', (data) => {
        console.error(`child stderr:\n${data}`);
        convertVideoError+=data.toString()
    });
    
    child.on('error', (error) => {
        console.error(`Error:\n${error}`);
    })
    child.on('close', async (data) => {
        console.log(`close:\n${data}`);
        console.log('ConvertVideoData:',convertVideoData)
        console.log('ConvertVideoError:',convertVideoError)
        if (data==0){
            device.publish('endVideoResults',JSON.stringify({result:'success', filename:filename}))
            fileContent = fs.readFileSync(filename)
            const params ={
                Bucket: 'smite-assets',
                Key: filename,
                Body: fileContent,
                ContentType:'video/mp4'
            }
            const command = new PutObjectCommand(params)
            await s3.send(command)
            fs.unlink('video.h264',function(err){
                if(err) return console.log(err);
                console.log('h264 file deleted successfully');
            });  
            fs.unlink(filename,function(err){
                if(err) return console.log(err);
                console.log('mp4 file deleted successfully');
            });     

        } else{
            device.publish('endVideoResults',JSON.stringify({result:'failure'}))
        }

    });
    
}

module.exports = convertVideo