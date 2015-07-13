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

    RED.nodes.registerType("ninja-send", function (config) {
        this.log('Ninja send create node - d [' + JSON.stringify(config, null, 4) + ']\n');
        RED.nodes.createNode(this, config);
        var node = this;
        node.d = config.d;
        node.da = config.da;
        node.on('input', function (msg) {
            try {
                node.log('Sending - d [' + node.d + '] da [' + node.da + '] topic [' + msg.topic + '] payload [' + msg.payload + ']\n');
                var d = msg.topic || node.d;
                var da = msg.payload || node.da;
                if (!d) {
                    nodeError(node, 'No d value', msg);
                } else if (!da) {
                    nodeError(node, 'No da value', msg);
                } else {
                    d = prepareD(d);
                    da = prepareDA(d, da);
                    msg.payload = JSON.stringify({"DEVICE": [{"G": "0", "V": 0, "D": d, "DA": da}]}, null, 0) + '\r\n';
                    node.send(msg);
                    node.status({fill: "green", shape: "dot", text: "OK"});
                }
            } catch (error) {
                nodeError(node, error.message, msg);
            }
        });
    });

    function nodeError(node, errorMessage, msg) {
        node.error(errorMessage, msg);
        node.status({fill: "red", shape: "dot", text: errorMessage});
    }

    function prepareD(did) {
        switch (did.toLowerCase()) {
            case 'rf':
                return 11;
            case 'eyes':
                return 1007;
            case 'led':
                return 999;
            default:
                return parseInt(did);
        }
    }

    function prepareDA(did, value) {
        switch (did) {
            case 11:
                value = parseInt(value).toString(2);
                while (value.length < 24) {
                    value = '0' + value;
                }
                break;
            case 30:
                throw new Error('Cannot make a send request for Humidity');
            case 31:
                throw new Error('Cannot make a send request for Temperature');
            default:
                break;
        }
        return value;
    }
};