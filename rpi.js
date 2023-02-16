const awsIot = require('aws-iot-device-sdk');
const pollCardData = require('./functions/nfcPoll.js')
const readMifare = require('./functions/readMifare.js')
const writeMifare = require('./functions/writeMifare.js')
const emulate = require('./functions/emulate.js')
const changeUid = require('./functions/changeUid.js')
const receive = require('./functions/receiveIR.js')
const transmit = require('./functions/transmitIR.js')
const changingSignalFile = require('./functions/editConfiguration.js')
const getIp = require('./functions/getIp.js')
const captureImage = require('./functions/captureImage.js')
const convertVideo = require('./functions/convertVideo.js')

const {spawn, exec} = require("child_process");
const { S3Client, PutObjectCommand} = require("@aws-sdk/client-s3");

const s3 = new S3Client({
    region:'placeholder',
    credentials:{
        accessKeyId:'placeholder',
        secretAccessKey:'placeholder'
    }
})


const device = awsIot.device({
    clientId: 'smite-device',
    host: 'a1u41qfqathikf-ats.iot.ap-southeast-1.amazonaws.com',
    port: 8883,
    keyPath: './smite-perms/smite-private.pem.key',
    certPath: './smite-perms/smite-certificate.pem.crt',
    caPath: './smite-perms/AmazonRootCA1.pem',
    keepalive: 6
});

var inProcess = false
var inLiveStream = false
var isRecording = false
var takingPic = false

changeStatus = () =>{
    inProcess=false
    console.log("Process Status changed to:",inProcess)
}

changePicStatus = () =>{
    takingPic=false
    console.log("Process Status changed to:",inProcess)
}


device.on('connect', function (connack) {
    console.log('Connected')
    device.subscribe({ 'nfcPoll': { qos: 1 }, 'readMifare': { qos: 1 }, 'writeMifare': { qos: 1 }, 'emulate': { qos: 1 }, 'readingSignal': { qos: 1 }, 'editConfiguration': { qos: 1 }, 'transmittingSignal': { qos: 1 } })
    device.subscribe({'changeUid': {qos: 1},'liveStream': {qos: 1},'killLiveStream': {qos: 1},'liveStreamStatus': {qos: 1}, 'takePic': {qos: 1}, 'startVideo': {qos: 1}, 'endVideo': {qos: 1}})
    console.log("Topics Subscribed")
    console.log(connack)
})

device.on('message', function (topic, payload) {
    message = JSON.parse(payload.toString())
    console.log(topic, message);

    if (topic == 'nfcPoll' && message.message == "execute") {
        if (inProcess == false) {
            inProcess = true
            pollCardData(device, changeStatus)
        } else {
            device.publish('nfcPollResults', JSON.stringify({ result: 'failure', reason: 'inOtherProcess' }))
            console.log("Other Processes are running")
        }
    }

    else if (topic == 'readMifare' && message.message == "execute") {
        if (inProcess == false) {
            inProcess = true
            readMifare(device, message.filename, changeStatus)
        } else {
            device.publish('readMifareResults', JSON.stringify({ result: 'failure', reason: 'inOtherProcess' }))
            console.log("Other Processes are running")
        }
    }

    else if (topic == "writeMifare" && message.message == "execute") {
        if (inProcess == false) {
            inProcess = true
            writeMifare(device, message.filepath, changeStatus)
        } else {
            device.publish('writeMifareResults', JSON.stringify({ result: 'failure', reason: 'inOtherProcess' }))
            console.log("Other Processes are running")
        }
    }

    else if (topic == "emulate" && message.message == "execute") {
        if (inProcess == false) {
            inProcess = true
            emulate(device, message.uid, changeStatus)
        } else {
            device.publish('emulateResults', JSON.stringify({ result: 'failure', reason: 'inOtherProcess' }))
            console.log("Other Processes are running")
        }
    }

    else if (topic == "changeUid" && message.message == "execute") {
        if (inProcess == false) {
            inProcess = true
            changeUid(device, message.uid, changeStatus)
        } else {
            device.publish('changeUidResults', JSON.stringify({ result: 'failure', reason: 'inOtherProcess' }))
            console.log("Other Processes are running")
        }
    }

    else if (topic == "readingSignal" && message.message == "execute") {
        if (inProcess == false) {
            inProcess = true
            receive(device, message.signalURL, message.filename, changeStatus)
        } else {
            device.publish('receiveResults', JSON.stringify({ result: 'failure', reason: 'inOtherProcess' }))
            console.log("Other Processes are running")
        }
    }

    else if (topic == "editConfiguration" && message.message == "execute") {
        if (inProcess == false) {
            inProcess = true
            changingSignalFile(device, message.signalFile, changeStatus)
        } else {
            device.publish('irEditResults', JSON.stringify({ result: 'failure', reason: 'inOtherProcess' }))
            console.log("Other Processes are running")
        }
    }

    else if (topic == "transmittingSignal" && message.message == "execute") {
        if (inProcess == false) {
            inProcess = true
            transmit(device, message.signalFile, message.command, changeStatus)
        } else {
            device.publish('irTransmitResults', JSON.stringify({ result: 'failure', reason: 'inOtherProcess' }))
            console.log("Other Processes are running")
        }
    }

    else if (topic=="liveStream" && message.message=="execute"){
        if (inLiveStream==false && isRecording==true || inLiveStream==false && takingPic==true){
            device.publish('liveStreamResults',JSON.stringify({result:'failure', reason:'cameraBusy'}))
        }
        else if (inLiveStream==false){
            inLiveStream=true
            childCamera = spawn('python3',['./camera/camerastream.py'])
            childCamera.stdout.on('data', (data) => {
                console.log(`child stdout:\n${data}`);
            });
            
            childCamera.stderr.on('data', (data) => {
                console.error(`child stderr:\n${data}`);
            });
            
            childCamera.on('error', (error) => {
                console.error(`Error:\n${error}`);
            })
            childCamera.on('close', (data) => {
                console.log(`close:\n${data}`);
            });
            getIp(device,'liveStreamResults')
        } else{
            device.publish('liveStreamResults',JSON.stringify({result:'failure', reason:'liveStreamRunning'}))
        }

    }

    else if (topic=="killLiveStream" && message.message=="execute"){
        if (inLiveStream==true){
            childCamera.kill()
            device.publish('killLiveStreamResults',JSON.stringify({result:'success', reason:'liveStreamKilled'}))
            inLiveStream=false
        } else{
            device.publish('killLiveStreamResults',JSON.stringify({result:'failure', reason:'liveStreamNotRunning'}))
        }

    }

    else if (topic=="liveStreamStatus" && message.message=="execute"){
        if (inLiveStream==true){
            getIp(device,'liveStreamStatusResults')
        } else{
            device.publish('liveStreamStatusResults',JSON.stringify({result:'failure', reason:'liveStreamNotRunning'}))

        }
    }

    else if (topic=="takePic" && message.message=="execute"){
        if (takingPic == true || isRecording==true){
            device.publish('takePicResults',JSON.stringify({message:'failure',reason:'cameraBusy'}))
        } else if (inLiveStream==true){
            takingPic=true
            async function takeImage(){
                await childCamera.kill()
                await captureImage(device, s3, changePicStatus)
            }
            takeImage()
            inLiveStream=false
        } else{
            takingPic=true
            captureImage(device, s3, changePicStatus)
        }
    }

    else if (topic=="startVideo" && message.message=="execute"){
        if (isRecording == true){
            device.publish('startVideoResults',JSON.stringify({result:'failure', reason:'alreadyRecording'}))
        } else if (takingPic == true){
            device.publish('startVideoResults',JSON.stringify({result:'failure', reason:'cameraBusy'}))
        } else if (isRecording==false && inLiveStream==true){
            childCamera.kill()
            inLiveStream=false
            isRecording=true
            childVideo= spawn('sudo',['raspivid','-t','999999','-o','video.h264'])
            device.publish('startVideoResults',JSON.stringify({result:'success'}))
        } else if (isRecording==false){
            isRecording=true
            childVideo= spawn('sudo',['raspivid','-t','999999','-o','video.h264'])
            device.publish('startVideoResults',JSON.stringify({result:'success'}))
        }

    }

    else if (topic=="endVideo" && message.message=="execute"){
        if (isRecording == false){
            device.publish('endVideoResults',JSON.stringify({result:'failure', reason:'notRecording'}))
        }else{
            async function saveVideo(){
                await spawn('sudo',['pkill','raspivid'])
                await convertVideo(device,s3)
            }
            saveVideo()
            isRecording=false
        }
    }
});

device.on('reconnect', function () {
    console.log("Attempting to reconnect...")
})

device.on('close', function () {
    console.log('Connection lost')
})

device.on('offline', function () {
    console.log('Lost internet connection')
})

device.on('error', function (err) {
    //console.log(err)
})

// device
//     .on('message', function(topic, payload) {
//         console.log('message', topic, payload.toString());
//     });

