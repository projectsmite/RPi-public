const { device } = require("aws-iot-device-sdk")
const { spawn } = require("child_process")

receive = (device, signalURL, filename, changeStatus) => {
    child = spawn('sudo', ['wget', '-O', `/usr/src/smite/infrared/${filename}.lircd.conf`, signalURL], { timeout: 10 * 1000 })

    child.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
    });

    child.on('error', (error) => {
        console.error(`Error:\n${error}`);
    })

    child.on('close', (data) => {
        console.log(`close:\n${data}`);
        if (data == 0) {
            device.publish('irReceiveResults', JSON.stringify({ result: 'success', data: data }))
            console.log("Successful")
        } else if (data == 1) {
            device.publish('irReceiveResults', JSON.stringify({ result: 'failure', reason: 'wrong command' }))
        }
        changeStatus()
    });
}

module.exports = receive
