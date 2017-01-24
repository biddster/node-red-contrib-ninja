# node-red-contrib-ninja

A NodeRED module which allows one to control a Ninja Block. It provides two NodeRED nodes, one to transmit data (Ninja TX) to the
Ninja and one to receive data from it (Ninja RX).

## Installation

Change directory to your NodeRED installation and issue:

    $ npm install node-red-contrib-ninja
    
## Getting Started
    
In this repo there is example-flow.json. You can import that into a NodeRED workspace and it will provide a template
        for getting working with the Ninja Block.

## How do the Ninja TX and RX nodes work?

The Ninja Block has an Arduino cloak for communicating with its hardware (internal sensors and 433mHz tx/rx). 
It sends and receives data via the serial port at /dev/ttyO1 (9600 baud). NodeRED can easily communicate with serial devices
 using ‘serial in’ and ‘serial out’ nodes. 
 
 The Ninja TX and RX nodes take care of marshalling between NodeRED and the JSON messages required by the cloak.
 
 At this stage, it's worth reading this http://docs.ninja.is/core-concepts.html as it explains the messages that go back
 and forth via the cloak.
 
 For example, when the Ninja tells us about the temperature, we are supplied with this string of JSON:
 
    "{\"DEVICE\":[{\"G\":\"0101\",\"V\":0,\"D\":31,\"DA\":23.80000}]}\r\n"
 
 The Ninja RX node cleans it up and parses it out into a NodeRED message.
 
 Conversely, if we wanted to turn on the 433mhz lamp in our lounge (0x155157), we need to send this JSON string to the cloak:
 
    "{\"DEVICE\":[{\"G\":\"0\",\"V\":0,\"D\":11,\"DA\":\"000101010101000101010111\"}]}\r\n"

The Ninja TX node takes care of building the string so you just specify 11 and 0x155157.


For reference, here's what the JSON properties refer to:

| Property | Description |
| --------------- | --------------- |  
|  D | the device ID, unique within a manufacturer's devices |
|  DA | the data value being reported by the device |
|  V | the vendor ID of the device, unique to the manufacturer |
|  G | a number corresponding to the port that the device is attached to |

## Receiving data from Ninja sensors and 433mz peripherals

A 'serial in' node is wired directly into the Ninja RX node. 

![Ninja RX](https://github.com/biddster/node-red-contrib-ninja/raw/node-red-contrib-ninja-1/examples/NinjaRX.png)

The Ninja RX node understands the JSON payloads that the cloak
sends and parses them into a NodeRED message so the data can be acted upon in a NodeRED flow. For example, this output 
can be wired into a switch node (part of NodeRED) so that action can then be taken depending upon the received data value. 

These are the values that you can expect:

| Identifier (D) | Value (DA) | Description |
| --------------- | --------------- | --------------- | 
|  11   | Hex value e.g. 0xc0f33 | The value received by the cloak over 433mhz. |
|  30   | Floating point | Humidity value. Received every 30 seconds via the cloak. |
|  31   | Floating point | Temperature value. Received every 30 seconds via the cloak. |
|  999  | Hex colour value  | Current status led colour, received every 30 seconds via the cloak. |
|  1007 | Hex colour value  | Current eye colour, received every 30 seconds via the cloak. |


For example, the output of the Ninja RX node for temperature would look like this:
```
{
    "topic": "31::0101::0",
    "payload": {
        "T": "DEVICE",
        "D": 31,
        "DA": 23.8
    }
}
```
The above message is described here:

| Property | Description |
| --------------- | --------------- |  
|  topic | A composite value of the identifier (D) , the vendor ID (V) and port (G). The format is `D::V::G`. |
|  payload.T | The type of the message, DEVICE |
|  payload.D | The identifier, 31 i.e. temperature |
|  payload.DA | The value, e.g. 23.8  |


### Dealing with Errors from the Ninja Cape

Recent reports from users have suggested that the Ninja cape (via the 'serial in' node) can report significant volumes of
errors via the Ninja RX Node. This has unfortunate side effects such as filling up the NodeRED log and causing crashes etc.

The Cape provides no other context to help diagnose the cause, you simply see:
 
    { "ERROR": [ { "CODE": 1 } ] }

The Ninja RX node has the ability to ignore errors. Generally this isn't a great idea, but in this instance there are
limited options. Simply enter the codes you want to ignore into the Ninja RX node configuration in NodeRED.


## Sending data to Ninja sensors and 433mz peripherals

A 'serial out' node is wired into the output of the Ninja TX node. 

![Ninja TX](https://github.com/biddster/node-red-contrib-ninja/raw/node-red-contrib-ninja-1/examples/NinjaTX.png)

The Ninja TX node takes care of building the necessary JSON 
required for comprehension by the cloak via the serial port.

### Supported values

When sending data, you can use the numeric identifier or the friendly identifier as specified below:

| Identifier | Friendly Identifier | Value | Description |
| --------------- | --------------- | --------------- | --------------- |
|  11   | rf | Hex value e.g. 0xc0f33 | This instructs the cloak to broadcast the value over 433mhz. |
|  999  | led | Hex colour value  | This instructs the Ninja to turn its led to the supplied colour value |
|  1007 | eyes | Hex colour value  | This instructs the Ninja to turn its eyes to the supplied colour value |



__Note that you cannot send temperature and humidity, you can only receive data from these Ninja sensors.__

### Static sending of data

You can configure the data to send via static configuration in NodeRED. When you drag this node on 
 to the workspace, you can enter the values you want to send as per the table above.  
       
### Dynamic sending of data
        
Any configuration entered when configuring this node in NodeRED can be overridden by the incoming message.

For example, to turn the ninja eyes green, send a message to the TX node like this:

```
{
    "topic": "eyes",
    "payload": "00ff00"
}
```
        
## Further reading

http://docs.ninja.is/core-concepts.html

There's an excellent tutorial here for setting up NodeRED and this ninja module:

https://discuss.ninjablocks.com/t/node-red/1069/16



