const { device } = require("aws-iot-device-sdk")
const { spawn } = require("child_process")

changingSignalFile = (device, signalFile, changeStatus) => {
    console.log(signalFile)
    child = spawn('sudo', ['lircd', signalFile], { timeout: 2 * 1000 })

    child.stdout.on('data', (data) => {
        console.log(`child stdout:\n${data}`);
    });

    child.on('error', (error) => {
        console.error(`Error:\n${error}`);
    })

    child.on('close', (data) => {
        if (data == 0) {
            device.publish('irEditResults', JSON.stringify({ result: 'success', data: data }))
        }
        else if (data == 1) {
            child = spawn('sudo', ['rm', '/var/run/lirc/lircd.pid'], { timeout: 2 * 1000 })

            child.stdout.on('data', (data) => {
                console.log(`child stdout:\n${data}`);
            });

            child.on('error', (error) => {
                console.error(`Error:\n${error}`);
            })

            child.on('close', (data) => {
                if (data == 0) {
                    child = spawn('sudo', ['lircd', signalFile], { timeout: 2 * 1000 })

                    child.stdout.on('data', (data) => {
                        console.log(`child stdout:\n${data}`);
                    });

                    child.on('error', (error) => {
                        console.error(`Error:\n${error}`);
                    })

                    child.on('close', (data) => {
                        if (data == 0) {
                            device.publish('irEditResults', JSON.stringify({ result: 'success', data: data }))
                        }
                        changeStatus()
                    })
                }
            })
        }
        changeStatus()
    });
}

module.exports = changingSignalFile
