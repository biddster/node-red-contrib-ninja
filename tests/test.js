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

"use strict";
var assert = require('chai').assert;


function loadNode(config, mod) {
    var RED = {
        nodes: {
            registerType: function (nodeName, nodeConfigFunc) {
                this.nodeConfigFunc = nodeConfigFunc;
            },
            createNode: function () {
            }
        },
        on: function (name, onFunc) {
            this.onInput = onFunc;
        },
        send: function (msg) {
            this.msg = msg;
        },
        error: function (error) {
            this.nodeError = error;
        },
        status: function (status) {
            this.nodeStatus = status;
        },
        log: function () {
            console.log.apply(this, arguments);
        }
    };
    mod(RED);
    RED.nodes.nodeConfigFunc.call(RED, config);
    return RED;
}


var ninjaSend = require('../ninja/ninja-send.js');
var ninjaReceive = require('../ninja/ninja-receive.js');


describe('Ninja', function () {
    describe('send', function () {
        it('should error if you send humidity (30)', function () {
            var send = loadNode({d: '30', da: 'blah'}, ninjaSend);
            send.onInput({});
            assert(send.nodeError);
            assert.strictEqual(send.nodeStatus.fill, 'red');
        });
        it('should error if you send temparature (31)', function () {
            var send = loadNode({d: '31', da: 'blah'}, ninjaSend);
            send.onInput({});
            assert(send.nodeError);
            assert.strictEqual(send.nodeStatus.fill, 'red');
        });
        it('should error if D is missing', function () {
            var send = loadNode({}, ninjaSend);
            send.onInput({});
            assert(send.nodeError);
            assert.strictEqual(send.nodeError.message, 'No D value');
            assert.strictEqual(send.nodeStatus.fill, 'red');
        });
        it('should error if DA is missing', function () {
            var send = loadNode({d: 'RF'}, ninjaSend);
            send.onInput({});
            assert(send.nodeError);
            assert.strictEqual(send.nodeError.message, 'No DA value');
            assert.strictEqual(send.nodeStatus.fill, 'red');
        });
        it('should build the correct JSON for RF', function () {
            var send = loadNode({d: 'RF', da: '0xc0f33'}, ninjaSend);
            send.onInput({});
            assert.isUndefined(send.nodeError);
            assert.strictEqual(send.nodeStatus.fill, 'green');
            assert.strictEqual(send.msg.payload, "{\"DEVICE\":[{\"G\":\"0\",\"V\":0,\"D\":11,\"DA\":\"000011000000111100110011\"}]}\r\n");
        });
        it('should override the static config is msg.topic and msg.payload are supplied.', function () {
            var send = loadNode({d: 'RF', da: '0xc0f33'}, ninjaSend);
            send.onInput({});
            assert.isUndefined(send.nodeError);
            assert.strictEqual(send.nodeStatus.fill, 'green');
            assert.strictEqual(send.msg.payload, "{\"DEVICE\":[{\"G\":\"0\",\"V\":0,\"D\":11,\"DA\":\"000011000000111100110011\"}]}\r\n");

            // Now override the config with a msg.topic and payload.
            send.onInput({topic: 'EYES', payload: 'green'});
            assert.isUndefined(send.nodeError);
            assert.strictEqual(send.nodeStatus.fill, 'green');
            assert.strictEqual(send.msg.payload, "{\"DEVICE\":[{\"G\":\"0\",\"V\":0,\"D\":1007,\"DA\":\"green\"}]}\r\n");
        });
        it('should build the correct JSON for 11', function () {
            var send = loadNode({d: '11', da: '0x155157'}, ninjaSend);
            send.onInput({});
            assert.isUndefined(send.nodeError);
            assert.strictEqual(send.nodeStatus.fill, 'green');
            assert.strictEqual(send.msg.payload, "{\"DEVICE\":[{\"G\":\"0\",\"V\":0,\"D\":11,\"DA\":\"000101010101000101010111\"}]}\r\n");
        });
    });
    describe('receive', function () {
        it('should parse real JSON', function () {
            var receive = loadNode({}, ninjaReceive);
            receive.onInput({payload: "{\"DEVICE\":[{\"G\":\"0\",\"V\":0,\"D\":11,\"DA\":\"000011000000111100110011\"}]}\r\n"});
            assert.isUndefined(receive.nodeError);
            assert.strictEqual(receive.msg.topic, 11);
            assert.strictEqual(receive.msg.payload, '0xc0f33');
        });
        it('should handle an ERROR', function () {
            var receive = loadNode({}, ninjaReceive);
            receive.onInput({payload: '"{\\\"ERROR\\\":[{\\\"CODE\\\":2}]}\r\n"'});
            assert(receive.nodeError);
            assert.strictEqual(receive.nodeError.message, 'Error code: 2');
            assert.strictEqual(receive.nodeStatus.fill, 'red');
        });
        it('should handle multiple ERRORs', function () {
            var receive = loadNode({}, ninjaReceive);
            receive.onInput({payload: '"{\\\"ERROR\\\":[{\\\"CODE\\\":1},{\\\"CODE\\\":2},{\\\"CODE\\\":3}]}\r\n"'});
            assert(receive.nodeError);
            assert.strictEqual(receive.nodeError.message, 'Error code: 1,2,3');
            assert.strictEqual(receive.nodeStatus.fill, 'red');
        });
        it('should parse temp as a floating point', function () {
            var receive = loadNode({}, ninjaReceive);
            receive.onInput({payload: '"{\"DEVICE\":[{\"G\":\"0101\",\"V\":0,\"D\":31,\"DA\":23.80000}]}\r\n"'});
            assert.isUndefined(receive.nodeError);
            assert.strictEqual(receive.msg.topic, 31);
            assert.strictEqual(receive.msg.payload, 23.80000);
        });
    });
});
