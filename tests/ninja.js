/**
 * Created by luke on 21/06/15.
 */
"use strict";
var assert = require('assert');


var DID = {
    RF: {
        id: 11,
        toNinja: function (value) {
            var val = parseInt(value).toString(2);
            while (val.length < 24) {
                val = '0' + val;
            }
            return val;
        },
        fromNinja: function (value) {
            return parseInt(value, 2);
        }
    },
    Humidity: {
        id: 30
    },
    Temperature: {
        id: 31
    },
    StatusLED: {
        id: 999
    },
    Eyes: {
        id: 1007
    }
};

function ninjaArduinoSend(message) {
    var split = message.payload.split('/');
    var did = split[0];
    var value = split[1];
    var deviceId = DID[did];
    if (!deviceId) {
        throw new Error('No such device id (DID): ' + did);
    }
    if (deviceId.toNinja) {
        value = deviceId.toNinja(value);
    }
    return {
        payload: JSON.stringify({
            "DEVICE": [
                {
                    "G": "0",
                    "V": 0,
                    "D": deviceId.id,
                    "DA": value
                }
            ]
        }, null, 0)
    };
}

function ninjaArduinoReceive(message) {
    var payload = JSON.parse(message.payload);
    var firstDevice = payload.DEVICE[0];
    var key = Object.keys(DID).filter(function (key) {
        return DID[key].id === firstDevice.D;
    })[0];
    if (!key) {
        throw new Error('Unable to match DID: ' + firstDevice.D);
    }
    var deviceId = DID[key];
    var value = firstDevice.DA;
    if (deviceId.fromNinja) {
        value = deviceId.fromNinja(value);
    }
    return {
        payload: value
    }
}


var fromArduino = {"payload": "{\"DEVICE\":[{\"G\":\"0\",\"V\":0,\"D\":11,\"DA\":\"000011000000111100110011\"}]}"};

var message = ninjaArduinoReceive(fromArduino);

assert.strictEqual(0xc0f33, message.payload);
console.log(message.payload.toString(16));

message = ninjaArduinoSend({ payload: 'RF/0xc0f33'});

// message is  { "payload": "{\"DEVICE\":[{\"G\":\"0\",\"V\":0,\"D\":11,\"DA\":\"000011000000111100110011\"}]}" }

assert.strictEqual(fromArduino.payload, message.payload);


/*

 function nodeRedFunction(devicesFromSerialPort) {
 var device = devicesFromSerialPort.DEVICE[0];
 var code = parseInt(device.DA, 2);
 console.log('Parsed code: ' + code.toString(16));
 return {
 payload: code
 }
 }


 var devices = {
 "DEVICE": [
 {
 "G": "0",
 "V": 0,
 "D": 11,
 "DA": "001011110001111101010110"
 }
 ]
 };

 var message = nodeRedFunction(devices);

 assert.strictEqual(0x2F1F56, message.payload);
 */