#
# Dockerfile for rpi gpio with nodejs

ARG NODEIMAGE_VERSION=latest
FROM uwegerdes/nodejs:${NODEIMAGE_VERSION}

MAINTAINER Uwe Gerdes <entwicklung@uwegerdes.de>

ARG SERVER_PORT='8080'
ARG LIVERELOAD_PORT='8081'
ARG GPIO_GROUP='997'

ENV SERVER_PORT ${SERVER_PORT}
ENV LIVERELOAD_PORT ${LIVERELOAD_PORT}
ENV GPIO_GROUP ${GPIO_GROUP}

USER root

COPY package.json ${NODE_HOME}/

RUN apt-get update && \
	apt-get dist-upgrade -y && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/* && \
	cd /opt && \
	git config --global http.sslVerify false && \
	git clone https://github.com/joan2937/pigpio && \
	cd /opt/pigpio && \
	make && \
	make install && \
	ln -s /usr/local/lib/libpigpio.so /usr/lib/libpigpio.so && \
	mkdir -p  /etc/svscan/pigpiod && \
	echo "#!/bin/bash\nif [ ! -f /var/run/pigpio.pid ]; then\n	echo 'Starting'\n	exec /opt/pigpio/pigpiod\nfi" > /etc/svscan/pigpiod/run && \
	chmod +x /etc/svscan/pigpiod/run && \
	groupadd -g ${GPIO_GROUP} gpio && \
	adduser ${USER_NAME} gpio && \
	echo "${USER_NAME} ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/020_node_nopass && \
	chmod 0440 /etc/sudoers.d/020_node_nopass && \
	cd ${NODE_HOME} && \
	chown -R ${USER_NAME}:${USER_NAME} ${NODE_HOME}/package.json && \
	npm -g config set user ${USER_NAME} && \
	npm install -g --cache /tmp/root-cache \
				gulp-cli \
				nodemon

COPY . ${APP_HOME}

RUN chown -R ${USER_NAME}:${USER_NAME} ${APP_HOME}

USER ${USER_NAME}

WORKDIR ${NODE_HOME}

RUN export NODE_TLS_REJECT_UNAUTHORIZED=0 && \
	npm install --cache /tmp/node-cache

WORKDIR ${APP_HOME}

EXPOSE ${SERVER_PORT} ${LIVERELOAD_PORT}

CMD [ "npm", "run", "dev" ]
