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
    const _ = require('lodash');

    const parse = function (msg) {
        // We have to do some repairs to msg.payload as the Ninja sometimes sends a response like this:
        //     ""{\"ERROR\":[{\"CODE\":2}]}\r\n""
        // For JSON.parse we have to strip leading and trailing ", remove \r\n and unescape the \".
        // TODO - can we do this easier using regex?
        let payload = msg.payload.replace(/\\"/g, '"');
        let start = 0;
        let end = payload.length - 1;
        while (payload.charAt(start) !== '{') {
            start++;
        }

        while (payload.charAt(end) !== '}') {
            end--;
        }

        payload = payload.substring(start, end + 1);

        const obj = JSON.parse(payload);
        if (_.isString(obj)) {
            throw new Error(
                'Ninja response parse error. Please report on GitHub along with the payload.'
            );
        }

        return obj;
    };

    RED.nodes.registerType('ninja-receive', function (config) {
        RED.nodes.createNode(this, config);

        // eslint-disable-next-line consistent-this
        const node = this;
        const ignoredErrors = _.chain(config.ignoreErrors || '')
            .split(/\s+/)
            .compact()
            .map(Number)
            .value();

        const send = function (type, devices) {
            devices.forEach((device) => {
                device.T = type;
                if (device.D === 11) {
                    // RF (11) values come back as base 2 e.g. 000011000000111100110011
                    device.DA = '0x' + parseInt(device.DA, 2).toString(16);
                }

                node.send({
                    topic: device.D + '::' + device.G + '::' + device.V,
                    payload: device,
                });
            });
            node.status({ fill: 'green', shape: 'dot', text: 'OK' });
        };

        const raiseError = function (obj) {
            if (obj.ERROR) {
                const errors = _.map(obj.ERROR, 'CODE');
                _.pullAll(errors, ignoredErrors);
                if (errors.length) {
                    throw new Error('Error code: ' + errors.join(','));
                }

                node.status({ fill: 'yellow', shape: 'dot', text: 'Errors were ignored' });
            } else {
                throw new Error('Unexpected payload: ' + JSON.stringify(obj, null, 0));
            }
        };

        node.on('input', (msg) => {
            try {
                const obj = parse(msg);
                if (obj.ACK) {
                    send('ACK', obj.ACK);
                } else if (obj.DEVICE) {
                    send('DEVICE', obj.DEVICE);
                } else {
                    raiseError(obj);
                }
            } catch (error) {
                node.error(error, msg);
                node.status({ fill: 'red', shape: 'dot', text: error.message });
            }
        });
    });
};
