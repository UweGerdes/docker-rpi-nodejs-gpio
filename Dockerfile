# Dockerfile for rpi gpio with nodejs

FROM uwegerdes/expressjs-boilerplate

MAINTAINER Uwe Gerdes <entwicklung@uwegerdes.de>

ARG SERVER_PORT='8080'
ARG HTTPS_PORT='8443'
ARG LIVERELOAD_PORT='8081'
ARG GPIO_GROUP='997'

ENV SERVER_PORT ${SERVER_PORT}
ENV HTTPS_PORT ${HTTPS_PORT}
ENV LIVERELOAD_PORT ${LIVERELOAD_PORT}
ENV GPIO_GROUP ${GPIO_GROUP}

USER root

RUN apt-get update && \
	apt-get dist-upgrade -y && \
	apt-get install -y python3-distutils && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* && \
	mv ${NODE_HOME}/node_modules ${NODE_HOME}/boilerplate_node_modules && \
	cd /opt && \
	git config --global http.sslVerify false && \
	git clone https://github.com/joan2937/pigpio && \
	cd /opt/pigpio && \
	make && \
	make install && \
	rm -r /opt/pigpio && \
	ln -s /usr/local/lib/libpigpio.so /usr/lib/libpigpio.so && \
	mkdir -p  /etc/svscan/pigpiod && \
	echo "#!/bin/bash\nif [ ! -f /var/run/pigpio.pid ]; then\n	echo 'Starting'\n	exec /usr/local/bin/pigpiod\nfi" > /etc/svscan/pigpiod/run && \
	chmod +x /etc/svscan/pigpiod/run && \
	groupadd -g ${GPIO_GROUP} gpio && \
	adduser ${USER_NAME} gpio && \
	echo "${USER_NAME} ALL=(ALL) NOPASSWD: ALL" > /etc/sudoers.d/020_node_nopass && \
	chmod 0440 /etc/sudoers.d/020_node_nopass

ENV NODE_PATH ${NODE_PATH}:${NODE_HOME}/boilerplate_node_modules

COPY --chown=${USER_NAME}:${USER_NAME} package.json ${NODE_HOME}/

WORKDIR ${NODE_HOME}

RUN npm install --cache /tmp/node-cache && \
	rm -r /tmp/*

WORKDIR ${APP_HOME}

COPY --chown=${USER_NAME}:${USER_NAME} . ${APP_HOME}

USER ${USER_NAME}

EXPOSE ${SERVER_PORT} ${HTTPS_PORT} ${LIVERELOAD_PORT}

CMD [ "npm", "start" ]
