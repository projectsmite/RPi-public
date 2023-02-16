const {spawn} = require("child_process")

var pollCardData = (device, changeStatus) =>{
  console.log("Starting to Poll Card")
  child = spawn('nfc-poll',['-v'],{timeout: 10 * 1000})

  child.stdout.on('data', (data) => {
      if (data.toString()!="done.\n"){
          console.log(`child stdout:\n${data}`);
          //Formatting Data
          pollRaw=data.toString()
          pollRaw=pollRaw.replace('nfc-poll uses libnfc 1.8.0\nNFC reader: PN532 over I2C opened\nNFC device will poll during 36000 ms (20 pollings of 300 ms for 6 modulations)\n','')
          pollData=pollRaw.replace('\nWaiting for card removing...','')
          console.log(JSON.stringify(pollData))
      }
    });
    
    child.stderr.on('data', (data) => {
      console.error(`child stderr:\n${data}`);
    });
    
    child.on('error', (error) => {
      console.error(`Error:\n${error}`);
    }) 
    child.on('close', (data) => {
      console.log(`close:\n${data}`);
      if (data==0){
          device.publish('nfcPollResults',JSON.stringify({ result:'success',data:pollData}))
        console.log("Successful")
      } else if (data==null){
          device.publish('nfcPollResults',JSON.stringify({ result:'failure',reason:'timeout'}))
          console.log("Timeout")
      } else if (data==1){
          device.publish('nfcPollResults',JSON.stringify({ result:'failure',reason:'deviceIssue'}))
          console.log("Reconnect")
      }
      changeStatus()
    });
}

module.exports=pollCardData

