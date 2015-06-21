/**
 * Created by luke on 21/06/15.
 */
"use strict";
var assert = require('assert');


var DID = {
    RF: 11,
    Humidity: 30,
    Temperature: 31,
    StatusLED: 999,
    Eyes: 1007
};


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
