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
var ninja = require('./node-red-contrib-ninja');

describe('Ninja', function () {
    describe('send', function () {
        it('should throw an exception if the topic (DID) is a string and is not recognised', function () {
            assert.throws(function () {
                ninja.arduinoSend({topic: 'wibble', payload: 'blah'});
            }, Error);
        });
        it('should throw an exception if you send humidity (30)', function () {
            assert.throws(function () {
                ninja.arduinoSend({topic: 30, payload: 'blah'});
            }, Error);
        });
        it('should throw an exception if you send temparature (31)', function () {
            assert.throws(function () {
                ninja.arduinoSend({topic: 31, payload: 'blah'});
            }, Error);
        });
        it('should build the correct JSON for RF', function () {
            var msg = ninja.arduinoSend({topic: 'RF', payload: '0xc0f33'});
            assert.strictEqual("{\"DEVICE\":[{\"G\":\"0\",\"V\":0,\"D\":11,\"DA\":\"000011000000111100110011\"}]}\r\n", msg);
        });
        it('should build the correct JSON for 11', function () {
            var msg = ninja.arduinoSend({topic: 11, payload: '0xc0f33'});
            assert.strictEqual("{\"DEVICE\":[{\"G\":\"0\",\"V\":0,\"D\":11,\"DA\":\"000011000000111100110011\"}]}\r\n", msg);
        });
    });
    describe('receive', function () {
        it('should parse real JSON', function () {
            var msg = ninja.arduinoReceive({payload: "{\"DEVICE\":[{\"G\":\"0\",\"V\":0,\"D\":11,\"DA\":\"000011000000111100110011\"}]}\r\n"});
            assert.strictEqual(11, msg.topic);
            assert.strictEqual('0c0f33', msg.payload);
        });
    });
});
