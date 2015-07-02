/**
 * Created by luke on 21/06/15.
 */
"use strict";
var assert = require('chai').assert;
var ninja = require('../ninja/node-red-contrib-ninja');

describe('Ninja', function () {
    describe('send', function () {
        it('should throw an exception if the topic is a string and is not recognised', function () {
            assert.throws(function () {
                ninja.arduinoSend({topic: 'wibble', payload: 'blah'});
            }, Error);
        });
        it('should build the correct JSON', function () {
            var msg = ninja.arduinoSend({
                topic: 'RF',
                payload: '0xc0f33'
            });
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
