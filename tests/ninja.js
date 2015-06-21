/**
 * Created by luke on 21/06/15.
 */
"use strict";
var assert = require('assert');


var DID = {
    RF: {
        id: 11,
        toNinja: function (value) {
            var val = value.toString(2);
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

function ninjaArduinoSend(did, value) {
    var deviceId = DID[did];
    if (!deviceId) {
        throw new Error('No such device id (DID): ' + did);
    }
    if (deviceId.toNinja) {
        value = deviceId.toNinja(value);
    }
    return {
        payload: {
            "DEVICE": [
                {
                    "G": "0",
                    "V": 0,
                    "D": deviceId.id,
                    "DA": value
                }
            ]
        }
    };
}

function ninjaArduinoReceive(payload) {
    var firstDevice = payload.DEVICE[0];
    for (var deviceString in DID) {
        if (DID.hasOwnProperty(deviceString)) {
            var deviceId = DID[deviceString];
            if (deviceId.id === firstDevice.D) {
                var value = firstDevice.DA;
                if (deviceId.fromNinja) {
                    value = deviceId.fromNinja(value);
                }
                return {
                    payload: value
                }
            }
        }
    }
    throw new Error('Unable to match DID: ' + firstDevice.D);
}


var message = ninjaArduinoSend('RF', 0x2F1F56);


assert.strictEqual(message.payload.DEVICE[0].D, 11);
assert.strictEqual(message.payload.DEVICE[0].DA, '001011110001111101010110');


message = ninjaArduinoReceive(message.payload);


assert.strictEqual(0x2F1F56, message.payload);


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