/* eslint-disable no-undef */
/* eslint-disable prefer-arrow-callback */
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

const Assert = require('chai').assert;
const _ = require('lodash');
const Mock = require('node-red-contrib-mock-node');
const NinjaSend = require('../ninja/ninja-send.js');
const NinjaReceive = require('../ninja/ninja-receive.js');

describe('Ninja', function () {
    describe('send', function () {
        it('should error if you send humidity (30)', function () {
            const node = Mock(NinjaSend, { d: '30', da: 'blah' });
            node.emit('input', {});
            Assert(node.error());
            Assert.strictEqual(node.status().fill, 'red');
        });
        it('should error if you send temparature (31)', function () {
            const node = Mock(NinjaSend, { d: '31', da: 'blah' });
            node.emit('input', {});
            Assert(node.error());
            Assert.strictEqual(node.status().fill, 'red');
        });
        it('should error if D is missing', function () {
            const node = Mock(NinjaSend, {});
            node.emit('input', {});
            Assert(node.error());
            Assert.strictEqual(node.error().message, 'No D value');
            Assert.strictEqual(node.status().fill, 'red');
        });
        it('should error if DA is missing', function () {
            const node = Mock(NinjaSend, { d: 'RF' });
            node.emit('input', {});
            Assert(node.error());
            Assert.strictEqual(node.error().message, 'No DA value');
            Assert.strictEqual(node.status().fill, 'red');
        });
        it('should build the correct JSON for RF', function () {
            const node = Mock(NinjaSend, { d: 'RF', da: '0xc0f33' });
            node.emit('input', {});
            Assert.isUndefined(node.error());
            Assert.strictEqual(node.status().fill, 'green');
            Assert.strictEqual(node.sent().length, 1);
            Assert.strictEqual(
                node.sent(0).payload,
                '{"DEVICE":[{"G":"0","V":0,"D":11,"DA":"000011000000111100110011"}]}\r\n'
            );
        });
        it('should override the static config is msg.topic and msg.payload are supplied.', function () {
            const node = Mock(NinjaSend, { d: 'RF', da: '0xc0f33' });
            node.emit('input', {});
            Assert.isUndefined(node.error());
            Assert.strictEqual(node.status().fill, 'green');
            Assert.strictEqual(node.sent().length, 1);
            Assert.strictEqual(
                node.sent(0).payload,
                '{"DEVICE":[{"G":"0","V":0,"D":11,"DA":"000011000000111100110011"}]}\r\n'
            );

            // Now override the config with a msg.topic and payload.
            node.emit('input', { topic: 'EYES', payload: 'green' });
            Assert.isUndefined(node.error());
            Assert.strictEqual(node.status().fill, 'green');
            Assert.strictEqual(
                node.sent(1).payload,
                '{"DEVICE":[{"G":"0","V":0,"D":1007,"DA":"green"}]}\r\n'
            );
        });
        it('should build the correct JSON for 11', function () {
            const node = Mock(NinjaSend, { d: '11', da: '0x155157' });
            node.emit('input', {});
            Assert.isUndefined(node.error());
            Assert.strictEqual(node.status().fill, 'green');
            Assert.strictEqual(node.sent().length, 1);
            Assert.strictEqual(
                node.sent(0).payload,
                '{"DEVICE":[{"G":"0","V":0,"D":11,"DA":"000101010101000101010111"}]}\r\n'
            );
        });
    });
    describe('receive', function () {
        it('should handle DEVICE', function () {
            const node = Mock(NinjaReceive, { outputs: 1 });
            node.emit('input', {
                payload:
                    '{"DEVICE":[{"G":"0","V":0,"D":11,"DA":"000011000000111100110011"}]}\r\n',
            });
            Assert.isUndefined(node.error());
            Assert.strictEqual(node.sent().length, 1);
            Assert.strictEqual(node.sent(0).topic, '11::0::0');
            Assert.strictEqual(node.sent(0).payload.T, 'DEVICE');
            Assert.strictEqual(node.sent(0).payload.D, 11);
            Assert.strictEqual(node.sent(0).payload.DA, '0xc0f33');
        });
        it('should handle ACK', function () {
            const node = Mock(NinjaReceive, { outputs: 1 });
            node.emit('input', {
                payload: '{"ACK":[{"G":"0","V":0,"D":999,"DA":"00FF00"}]}\r\n',
            });
            Assert.isUndefined(node.error());
            Assert.strictEqual(node.sent().length, 1);
            Assert.strictEqual(node.sent(0).topic, '999::0::0');
            Assert.strictEqual(node.sent(0).payload.T, 'ACK');
            Assert.strictEqual(node.sent(0).payload.D, 999);
            Assert.strictEqual(node.sent(0).payload.DA, '00FF00');
        });
        it('should handle an ERROR', function () {
            const node = Mock(NinjaReceive, { outputs: 1 });
            node.emit('input', { payload: '"{\\"ERROR\\":[{\\"CODE\\":2}]}\r\n"' });
            Assert(node.error());
            Assert.strictEqual(node.error().message, 'Error code: 2');
            Assert.strictEqual(node.status().fill, 'red');
        });
        it('should handle a single ERROR ignore', function () {
            const node = Mock(NinjaReceive, { outputs: 1, ignoreErrors: ' 1' });
            node.emit('input', { payload: '"{\\"ERROR\\":[{\\"CODE\\":1}]}\r\n"' });
            Assert.isUndefined(node.error());
            Assert.strictEqual(node.status().fill, 'yellow');
        });
        it('should handle unexpected JSON', function () {
            const node = Mock(NinjaReceive, { outputs: 1 });
            node.emit('input', { payload: '"{\\"UNEXPECTED\\":[{\\"CODE\\":2}]}\r\n"' });
            Assert(node.error());
            Assert(_.startsWith(node.error().message, 'Unexpected payload'));
            Assert.strictEqual(node.status().fill, 'red');
        });
        it('should handle multiple ERRORs', function () {
            const node = Mock(NinjaReceive, { outputs: 1 });
            node.emit('input', {
                payload: '"{\\"ERROR\\":[{\\"CODE\\":1},{\\"CODE\\":2},{\\"CODE\\":3}]}\r\n"',
            });
            Assert(node.error());
            Assert.strictEqual(node.error().message, 'Error code: 1,2,3');
            Assert.strictEqual(node.status().fill, 'red');
        });
        it('should handle multiple ERROR ignores', function () {
            const node = Mock(NinjaReceive, { outputs: 1, ignoreErrors: '1  2 ' });
            node.emit('input', {
                payload: '"{\\"ERROR\\":[{\\"CODE\\":1},{\\"CODE\\":2},{\\"CODE\\":3}]}\r\n"',
            });
            Assert(node.error());
            Assert.strictEqual(node.error().message, 'Error code: 3');
            Assert.strictEqual(node.status().fill, 'red');
        });
        it('should parse temp as a floating point', function () {
            const node = Mock(NinjaReceive, { outputs: 1 });
            node.emit('input', {
                payload: '"{"DEVICE":[{"G":"0101","V":0,"D":31,"DA":23.80000}]}\r\n"',
            });
            Assert.isUndefined(node.error());
            Assert.strictEqual(node.sent().length, 1);
            Assert.strictEqual(node.sent(0).topic, '31::0101::0');
            Assert.strictEqual(node.sent(0).payload.T, 'DEVICE');
            Assert.strictEqual(node.sent(0).payload.D, 31);
            Assert.strictEqual(node.sent(0).payload.DA, 23.8);
        });
        it('should handle multiple devices', function () {
            const node = Mock(NinjaReceive, { outputs: 1 });
            node.emit('input', {
                payload:
                    '"{"DEVICE":[{"G":"0101","V":0,"D":31,"DA":23.80000},{"G":"0102","V":0,"D":31,"DA":22.50000}]}\r\n"',
            });
            Assert.isUndefined(node.error());
            Assert.strictEqual(node.sent().length, 2);
            Assert.strictEqual(node.sent(0).topic, '31::0101::0');
            Assert.strictEqual(node.sent(0).payload.T, 'DEVICE');
            Assert.strictEqual(node.sent(0).payload.D, 31);
            Assert.strictEqual(node.sent(0).payload.DA, 23.8);
            Assert.strictEqual(node.sent(1).topic, '31::0102::0');
            Assert.strictEqual(node.sent(1).payload.T, 'DEVICE');
            Assert.strictEqual(node.sent(1).payload.D, 31);
            Assert.strictEqual(node.sent(1).payload.DA, 22.5);
        });
    });
});
