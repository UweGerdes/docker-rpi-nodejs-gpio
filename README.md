# Docker uwegerdes/node-rpi-gpio

Using the Raspberry Pi 3 GPIO pins with node wrapped in a docker container.

## Building 

```bash
$ docker build -t uwegerdes/node-rpi-gpio .
```

## Usage

Run the container and start tests or use the web server to control the gpio pins.

```bash
$ docker run -it --rm \
	-v $(pwd):/home/node/app \
	-p 5401:8080 \
	-v /dev/gpiochip0:/dev/gpiochip0 \
	-v /dev/gpiochip1:/dev/gpiochip1 \
	-v /dev/gpiochip2:/dev/gpiochip2 \
	-v /dev/gpiomem:/dev/gpiomem \
	--privileged \
	uwegerdes/node-rpi-gpio \
	bash
```

