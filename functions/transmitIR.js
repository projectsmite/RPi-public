const { device } = require("aws-iot-device-sdk")
const { spawn } = require("child_process")

transmit = (device, signalFile, command, changeStatus) => {
    child = spawn('irsend', ['SEND_ONCE', signalFile, command], { timeout: 2 * 1000 })

    child.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
    });

    child.on('error', (error) => {
        console.error(`Error:\n${error}`);
    })

    child.on('close', (data) => {
        console.log(`close:\n${data}`);
        if (data == 0) {
            device.publish('irTransmitResults', JSON.stringify({ result: 'success', data: data }))
        }
        else if (data == 1) {
            device.publish('irTransmitResults', JSON.stringify({ result: 'failure', reason: 'wrong command' }))
        }
        changeStatus()
    });
}

module.exports = transmit
