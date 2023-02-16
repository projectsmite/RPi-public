const {spawn} = require("child_process")

changeUid = (device, uid, changeStatus) =>{
    child = spawn('nfc-mfsetuid',[uid])
    var setUidData = ""
    var setUidError = ""
    child.stdout.on('data', (data) => {
        setUidData+=data.toString()
      });
      
      child.stderr.on('data', (data) => {
        setUidError+=data.toString()
      });
      
      child.on('error', (error) => {
        console.log(error)
      })
      child.on('close', (data) => {
        console.log(`Data:\n${setUidData}`)
        console.log(`Error:\n${setUidError}`)
        console.log(`close:\n${data}`);
        if (data==1 && setUidError.includes('Error opening NFC reader')){
            device.publish('changeUidResults',JSON.stringify({ result:'failure',reason:'deviceIssue'}))
            console.log('Device Issue')
        } else if (data==1 && setUidData.includes('No tag available')){
            device.publish('changeUidResults',JSON.stringify({ result:'failure',reason:'noTagPresent'}))
            console.log('Tag Not Present')
        } else if (data==0 && setUidData.includes('failed')){
            device.publish('changeUidResults',JSON.stringify({ result:'failure',reason:'failedToChange'}))
            console.log('Failed to Change UID')
        } else{
            device.publish('changeUidResults',JSON.stringify({ result:'success'}))
            console.log('Success')
        }
        
        changeStatus()
      });
}

module.exports=changeUid