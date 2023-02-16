const fs = require('fs')
const {spawn} = require("child_process")


readMifare = (device,filename,changeStatus) =>{
    filenameExtended = filename+'.mfp'
    path = 'mifare/'+filenameExtended
    relativePath='./'+path
    if (fs.existsSync(relativePath)){
        device.publish('readMifareResults',JSON.stringify({ result:'failure',reason:'filenameExists'}))
        console.log('Filename Exists')
        changeStatus()
    } else {
        console.log("Reading Mifare Classic")
        child = spawn('sudo',['nfc-mfclassic','r','a','u',path])
        readMifareData=""
        readMifareError=""
        child.stdout.on('data', (data) => {
            readMifareData+=data.toString()
        });
        
        child.stderr.on('data', (data) => {
            readMifareError+=data.toString()
        });
        
        child.on('error', (error) => {
            console.error(`Error:\n${error}`);
        })
        child.on('close', (data) => {
            console.log(`Data:\n${readMifareData}`)
            console.log(`Error:\n${readMifareError}`)
            console.log(`close:\n${data}`);
            rawData = readMifareData.replace(/\s/g, "") //regex to replace whitespaces
            uidRaw = rawData.substring(0, rawData.indexOf('SAK(SEL_RES)'))
            uid = uidRaw.substring(uidRaw.length - 8)
            if (data==0){
                if (readMifareData.includes('Writing data to file')){
                    device.publish('readMifareResults',JSON.stringify({ result:'success', filepath: path, uid:uid}))
                    console.log("Successful")
                } else{
                    device.publish('readMifareResults',JSON.stringify({ result:'failure', reason:'failedToRead'}))
                    console.log("Failed to Read")
                }
            } else if (data==1){
                if (readMifareError.includes('Error opening NFC reader')){
                    device.publish('readMifareResults',JSON.stringify({ result:'failure',reason:'deviceIssue'}))
                    console.log("Reconnect")
                } else{
                    device.publish('readMifareResults',JSON.stringify({ result:'failure',reason:'noTagPresent'}))
                    console.log('No Tag is Present')
                }
            }
            changeStatus()
        });
    }

}

module.exports = readMifare