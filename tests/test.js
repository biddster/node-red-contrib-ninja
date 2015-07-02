/**
 * Created by luke on 21/06/15.
 */
"use strict";
var assert = require('chai').assert;
var ninja = require('../ninja/node-red-contrib-ninja');

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
