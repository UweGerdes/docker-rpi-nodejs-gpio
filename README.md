# Docker uwegerdes/rpi-nodejs-gpio

Using the Raspberry Pi 3 GPIO pins with node wrapped in a docker container.

## Building

Before you build this image please build my `docker-baseimage-rpi-raspbian` and `docker-rpi-nodejs`, you might want to use the following command more than once and this saves some 20 mins build time.

```bash
$ docker build -t uwegerdes/rpi-nodejs-gpio \
	--build-arg GPIO_GROUP="$(sed -nr "s/^gpio:x:([0-9]+):.*/\1/p" /etc/group)" \
	--network=host \
	.
```

The `GPIO_GROUP` is needed to give the docker internal user `node` access to `/dev/gpio*`.

`--network=host` is needed if you used hostnames for apt or npm cache services. If you used ip address or no cache servers you should omit that line.

## Usage

Set up your gpio connections in `server.js` - be aware that sensor doesn't work with all gpio pins.

Run the container and start tests or gulp and use the web server to control the gpio pins.

```bash
$ docker run -it --rm \
	-v $(pwd):/home/node/app \
	--name nodejs-gpio \
	-p 8080:8080 \
	-p 8081:8081 \
	--privileged \
	--cap-add SYS_RAWIO \
	uwegerdes/rpi-nodejs-gpio \
	bash
```

## More information on GPIO usage

Show the pinout of your Raspberry Pi:

```bash
$ pinout
```

## Helpful links

- (https://www.npmjs.com/package/pigpio)[https://www.npmjs.com/package/pigpio]
- (https://www.elektronik-kompendium.de/sites/raspberry-pi/1907101.htm [de])[https://www.elektronik-kompendium.de/sites/raspberry-pi/1907101.htm]


## Changelog

0.0.10 boilerplate refactoring

0.0.9 expressjs with pug templates

0.0.8 message passing reworked, refactoring
