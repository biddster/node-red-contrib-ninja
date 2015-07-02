function arduinoSend(msg) {
    var did = msg.topic;
    if (typeof did === 'string') {
        switch (did.toLowerCase()) {
            case 'rf':
                did = 11;
                break;
            case 'eyes':
                did = 1007;
                break;
            case 'led':
                did = 999;
                break;
            default:
                throw new Error('Unrecognised DID symbol [' + did + '], try using the actual numeric value instead');
        }
    }
    var value = msg.payload;
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
    return JSON.stringify({"DEVICE": [{"G": "0", "V": 0, "D": did, "DA": value}]}, null, 0) + '\r\n';
}

function arduinoReceive(msg) {
    var payload = JSON.parse(msg.payload);
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
    return {
        topic: firstDevice.D,
        payload: value
    }
}


module.exports = {
    arduinoSend: arduinoSend,
    arduinoReceive: arduinoReceive
};