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

    const prepareD = function (d) {
        if (!d) {
            throw new Error('No D value');
        }

        switch (d.toLowerCase()) {
            case 'rf':
                return 11;
            case 'eyes':
                return 1007;
            case 'led':
                return 999;
            default:
                return parseInt(d);
        }
    };

    const prepareDA = function (d, da) {
        if (!da) {
            throw new Error('No DA value');
        }

        switch (d) {
            case 11:
                da = _.padStart(parseInt(da).toString(2), 24, '0');
                break;
            case 30:
                throw new Error('Cannot make a send request for Humidity');
            case 31:
                throw new Error('Cannot make a send request for Temperature');
            default:
                break;
        }

        return da;
    };

    RED.nodes.registerType('ninja-send', function (config) {
        RED.nodes.createNode(this, config);

        // eslint-disable-next-line consistent-this
        const node = this;
        node.on('input', (msg) => {
            try {
                const d = prepareD(msg.topic || config.d);
                const da = prepareDA(d, msg.payload || config.da);
                msg.payload =
                    JSON.stringify({ DEVICE: [{ G: '0', V: 0, D: d, DA: da }] }, null, 0) +
                    '\r\n';
                node.send(msg);
                node.status({ fill: 'green', shape: 'dot', text: 'OK' });
            } catch (error) {
                node.error(error, msg);
                node.status({ fill: 'red', shape: 'dot', text: error.message });
            }
        });
    });
};
