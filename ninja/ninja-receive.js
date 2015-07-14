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

    RED.nodes.registerType("ninja-receive", function (config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.on('input', function (msg) {
            try {
                var payload = JSON.parse(msg.payload);
                node.log(payload);
                if (payload.hasOwnProperty('ERROR')) {
                    var error = 'Error code: ' + payload.ERROR[0].CODE;
                    node.error(error, msg);
                    node.status({fill: "red", shape: "dot", text: error});
                } else {
                    var firstDevice = payload.DEVICE[0];
                    var value = firstDevice.DA;
                    switch (firstDevice.D) {
                        case 11:
                            value = parseInt(value, 2).toString(16);
                            while (value.length < 6) {
                                value = '0' + value;
                            }
                            break;
                        case 30:
                        case 31:
                            value = parseInt(value);
                            break;
                        default:
                            break;
                    }
                    msg.topic = firstDevice.D;
                    msg.payload = value;
                    node.send(msg);
                    node.status({fill: "green", shape: "dot", text: "OK"});
                }
            } catch (error) {
                node.log(error.stack);
                node.error(error, msg);
                node.status({fill: "red", shape: "dot", text: error.message});
            }
        });
    });
};