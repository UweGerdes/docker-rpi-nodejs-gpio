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
	-p 5401:8080 \
	--privileged \
	--cap-add SYS_RAWIO \
	--device /dev/mem \
	--device /dev/vcio \
	uwegerdes/node-rpi-gpio \
	bash
```

