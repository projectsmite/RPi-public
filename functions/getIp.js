const {spawn} = require("child_process")

getIp = (device, topic) =>{
    child = spawn('ifconfig',['wlan0'])

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
    child.on('close', (data) => {
        console.log(`close:\n${data}`);
        ipRaw = output.substring(output.indexOf('inet'), output.indexOf('netmask'))
        ipAddr = ipRaw.replace(/\s/g,"")
        ipAddr = ipAddr.replace("inet","")
        device.publish(topic,JSON.stringify({result:'success', ipAddr:ipAddr}))
    });
    
}

module.exports = getIp