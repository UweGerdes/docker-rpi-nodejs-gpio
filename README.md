# Docker uwegerdes/rpi-nodejs-gpio

Using the Raspberry Pi 3 GPIO pins with node wrapped in a docker container.

## Building

Before you build this image please build my `docker-baseimage-arm32v7` and `docker-rpi-nodejs`.

```bash
$ docker build -t uwegerdes/rpi-nodejs-gpio \
	--build-arg GPIO_GROUP="$(sed -nr "s/^gpio:x:([0-9]+):.*/\1/p" /etc/group)" \
	.
```

The `GPIO_GROUP` is needed to give the docker internal user `node` access to `/dev/gpio*`.

## Usage

Set up your gpio connections in `server.js` - be aware that sensor doesn't work with all gpio pins.

Run the container and start tests or gulp and use the web server to control the gpio pins.

```bash
$ docker run -it --rm \
	-v $(pwd):/home/node/app \
	--name nodejs-gpio \
	-p 8080:8080 \
	-p 8081:8081 \
	-p 8443:8443 \
	--privileged \
	--cap-add SYS_RAWIO \
	uwegerdes/rpi-nodejs-gpio \
	bash
```

## Wiring

The wiring is configured in configuration.yaml - the items I use were in the (Raspberry Pi Adventskalender from Conrad Electronic)[https://www.conrad.de/de/adventskalender-conrad-adventskalender-raspberry-pi-1662785.html] but it's cheaper to buy the things at your preferred electronis dealer.

See the links below for the numbering of the GPIO pins - and be aware that the GPIO pins are in an order that someone might have considered useful.

Never shortcut 3.3V and 5V. This could damage you Pi 2, 3 and 4.

### LED

I have LEDs with integrated 220 Ohm resistor. Or calculate the resistor with 3.3V and the maximum current of the LED. Check your LED, they should never be used without resistor!

The long wire at the is for the GPIO pin, the short wire is for ground connection.

### RGB LED

Check for integrated resistor - if not, use 220 Ohm for ever input wire.

The wires differ: the longest one is for ground, the others are for red, green and blue.

My RGB LEDs have wires in the order red, ground, green, blue. But check yours.

### Servo

There are several different types, the often have three connectors for power, control and ground.

Check the data sheet for correct connection. And perhaps tweak some settings in gpio/servo.js.

### Push-button

The push-button connects 3.3 Volt with a GPIO pin if pressed - check your button for the best wiring.

### Sensor

The GPIO pins are very sensible - if you pull one up with a 20 MOhm resistor it detects if you touch a wire that is connected with this GPIO pin.

So you should connect: - extra wire - GPIO - 20 MOhm - 3.3V

I've tried different GPIO pins - not sure that all of them work (the are a little bit different). It worked with GPIO-8.

## More information on GPIO usage

Show the pinout of your Raspberry Pi:

```bash
$ pinout
```

Please do not use GPIO-3 (Pin 5) - that is the reboot pin if the Raspberry Pi has been shutdown.
Just ground GPIO-3 and it reboots.

## Helpful links

- (https://www.npmjs.com/package/pigpio)[https://www.npmjs.com/package/pigpio]
- (https://www.elektronik-kompendium.de/sites/raspberry-pi/1907101.htm [de])[https://www.elektronik-kompendium.de/sites/raspberry-pi/1907101.htm]


## Changelog

0.1.2 added coverage and updated form elements

0.1.1 added https for socket.io

0.1.0 refactoring and updates from boilerplate

0.0.10 boilerplate refactoring

0.0.9 expressjs with pug templates

0.0.8 message passing reworked, refactoring
