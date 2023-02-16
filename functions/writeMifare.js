const {spawn} = require("child_process")

writeMifare = (device, filepath, changeStatus) =>{
    child = spawn('sudo',['nfc-mfclassic','W','a','u',filepath])
    writeMifareData = ""
    writeMifareError = ""
    child.stdout.on('data', (data) => {
        writeMifareData+= data.toString()
      });
      
      child.stderr.on('data', (data) => {
        writeMifareError+= data.toString()
      });
      
      child.on('error', (error) => {
        console.error(`Error:\n${error}`);
      })
      child.on('close', (data) => {
        console.log(`Data:\n${writeMifareData}`)
        console.log(`Error:\n${writeMifareError}`)
        console.log(`close:\n${data}`);
        
        if (data == 0){
            if (writeMifareData.includes('Failure to write') && !writeMifareData.includes('Card unlocked')){
                device.publish('writeMifareResults',JSON.stringify({ result:'failure', reason:"wrongCardType"}))
                console.log("Wrong Card Type")
            } else if (writeMifareData.includes('Failure to write')){
                device.publish('writeMifareResults',JSON.stringify({ result:'failure', reason:"failedToWrite"}))
                console.log("Failed to Write")
            } else{
                console.log("Successful")
                device.publish('writeMifareResults',JSON.stringify({ result:'success'}))
            }
        } else if (data == 1){
            if (writeMifareError.includes('Error opening NFC reader')){
                device.publish('writeMifareResults',JSON.stringify({ result:'failure',reason:'deviceIssue'}))
                console.log("Reconnect PN532 Module")
            } else{
                device.publish('writeMifareResults',JSON.stringify({ result:'failure',reason:'noTagPresent'}))
                console.log("No Tag is Present")
            }
        }
        changeStatus()
      });
}

module.exports=writeMifare