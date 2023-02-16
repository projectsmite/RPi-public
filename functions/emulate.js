const { device } = require("aws-iot-device-sdk")
const {spawn} = require("child_process")

emulate = (device,uid,changeStatus) => {
    child = spawn('./emulate/publish/emulate',[uid],{timeout: 10 * 1000})
    emulateData = ""
    emulateError = ""
    child.stdout.on('data', (data) => {
        emulateData+= data.toString()
        console.log(`child stdout:\n${data}`);
    });
    
    child.stderr.on('data', (data) => {
        emulateError+= data.toString()
        console.error(`child stderr:\n${data}`);
    });
    
    child.on('error', (error) => {
        console.error(`Error:\n${error}`);
    })

    child.on('close', (data) => {
    console.log(`Data:\n${emulateData}`)
    console.log(`Error:\n${emulateError}`)
    console.log(`close:\n${data}`);
    if (data == null){
        if (emulateError.includes('Error 110 performing I2C data transfer')){
            device.publish('emulateResults',JSON.stringify({ result:'failure',reason:'deviceIssue'}))
            console.log('Device Error')
        } else if (emulateError.includes('PN532 is not ready for I2C communication')){
            device.publish('emulateResults',JSON.stringify({ result:'failure',reason:'deviceIssue'}))
            console.log('Device Error')
        }
    } else if (data == 0){
        device.publish('emulateResults',JSON.stringify({ result:'success'}))
        console.log('Success')
    } else if (data == 143){
        device.publish('emulateResults',JSON.stringify({ result:'failure',reason:'timeout'}))
        console.log('Timeout')
    }
    changeStatus()
    });
}

module.exports=emulate
