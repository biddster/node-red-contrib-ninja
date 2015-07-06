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

    function prepareD(did) {
        if (typeof did === 'string') {
            switch (did.toLowerCase()) {
                case 'rf':
                    return 11;
                case 'eyes':
                    return 1007;
                case 'led':
                    return 999;
                default:
                    throw new Error('Unrecognised DID symbol [' + did + '], try using the actual numeric value instead');
            }
        }
        return did;
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
                throw new Error('Cannot make a send request for Temparature');
            default:
                break;
        }
        return value;
    }

    function NinjaSend(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        this.d = config.d;
        this.da = config.da;
        this.on('input', function (msg) {
            try {
                // TODO - the preparation of these two could be at config time? How do errors work there? The same?
                var d = prepareD(node.d);
                var da = prepareDA(d, node.da);
                msg.payload = JSON.stringify({"DEVICE": [{"G": "0", "V": 0, "D": d, "DA": da}]}, null, 0) + '\r\n';
                node.send(msg);
            } catch (error) {
                node.error(error.message, msg);
            }
        });
    }

    RED.nodes.registerType("ninja-send", NinjaSend);
};