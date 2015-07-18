/**
 The MIT License (MIT)

 Copyright (c) 2015 @biddster

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

module.exports = function (RED) {
    'use strict';
    var _ = require('lodash-node');

    RED.nodes.registerType("ninja-receive", function (config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', function (msg) {
            try {
                var device = parseDevice(msg);
                var value = device.DA;
                if (device.D === 11) {
                    // RF (11) values come back as base 2 e.g. 000011000000111100110011
                    value = parseInt(value, 2).toString(16);
                    value = '0x' + value;
                }
                msg.topic = device.D;
                msg.payload = value;
                node.send(msg);
                node.status({fill: "green", shape: "dot", text: "OK"});
            } catch (error) {
                node.log(error.stack);
                node.error(error, msg);
                node.status({fill: "red", shape: "dot", text: error.message});
            }
        });
    });


    function parseDevice(msg) {
        // We have to do some repairs to msg.payload as the Ninja sometimes sends a response like this:
        //     ""{\"ERROR\":[{\"CODE\":2}]}\r\n""
        // For JSON.parse we have to strip leading and trailing ", remove \r\n and unescape the \".
        // TODO - can we do this easier using regex?
        var payload = msg.payload.replace(/\\"/g, '"');
        var start = 0, end = payload.length - 1;
        while (payload.charAt(start) !== '{') start++;
        while (payload.charAt(end) != '}') end--;
        payload = payload.substring(start, end + 1);

        var obj = JSON.parse(payload);
        if (obj.ERROR) {
            throw new Error('Error code: ' + _.pluck(obj.ERROR, 'CODE').join(','));
        }
        return obj.DEVICE[0];
    }
};