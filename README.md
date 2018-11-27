# Docker uwegerdes/node-rpi-gpio

Using the Raspberry Pi 3 GPIO pins with node wrapped in a docker container.

## Building

```bash
$ docker build -t uwegerdes/node-rpi-gpio \
	--build-arg GPIO_GROUP="$(sed -nr "s/^gpio:x:([0-9]+):.*/\1/p" /etc/group)" \
	.
```

## Usage

Run the container and start tests or use the web server to control the gpio pins.

```bash
$ docker run -it --rm \
	-v $(pwd):/home/node/app \
	--name gpio \
	-p 8080:8080 \
	-p 8081:8081 \
	--privileged \
	--cap-add SYS_RAWIO \
	uwegerdes/node-rpi-gpio \
	bash
```

## More information on GPIO usage

Show the pinout of your Raspberry Pi:

```bash
$ pinout
```

## Helpful links

- (https://www.npmjs.com/package/pigpio)[https://www.npmjs.com/package/pigpio]
- (https://www.elektronik-kompendium.de/sites/raspberry-pi/1907101.htm)[https://www.elektronik-kompendium.de/sites/raspberry-pi/1907101.htm]
