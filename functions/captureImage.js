const {spawn} = require("child_process")
const { S3Client, PutObjectCommand} = require("@aws-sdk/client-s3");
var fs = require('fs');


captureImage = (device, s3, changePicStatus) =>{

    var today = new Date()
    var filename = today.getFullYear()+'-'+today.getDate()+'-'+(today.getMonth()+1)+'-'+today.getHours() + "-" + today.getMinutes()+'-'+today.getSeconds()+'.jpg'
    child = spawn('sudo',['python3','camera/takepic.py',filename])

    child.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
        output = data.toString()
    });
    
    child.stderr.on('data', (data) => {
        console.error(`child stderr:\n${data}`);
    });
    
    child.on('error', (error) => {
        console.error(`Error:\n${error}`);
    })
    child.on('close', async (data) => {
        console.log(`close:\n${data}`);
        if (data==0){
            fileContent = fs.readFileSync(filename)
            const params ={
                Bucket: 'smite-assets',
                Key: filename,
                Body: fileContent,
                ContentType:'image/jpeg'
            }
            const command = new PutObjectCommand(params)
            s3.send(command).then(
                (data)=>{
                    console.log(data)
                    device.publish('takePicResults',JSON.stringify({result:'success', filename:filename}))
                    fs.unlink(filename,function(err){
                        if(err) return console.log(err);
                        console.log('jpg file deleted successfully');
                    });     
                },
                (error)=>{
                    console.log(error)
                }
            )
        } else{
            device.publish('takePicResults',JSON.stringify({result:'failure'}))
        }
        changePicStatus()
    });
    
}

module.exports = captureImage