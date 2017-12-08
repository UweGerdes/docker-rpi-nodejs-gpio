#
# Dockerfile for rpi gpio with nodejs

FROM uwegerdes/nodejs-rpi:stretch

MAINTAINER Uwe Gerdes <entwicklung@uwegerdes.de>

ARG SERVER_HTTP='8080'

ENV NODE_ENV development
ENV HOME ${NODE_HOME}
ENV APP_HOME ${NODE_HOME}/app
ENV SERVER_HTTP ${SERVER_HTTP}

COPY package.json ${NODE_HOME}/

USER root

WORKDIR ${NODE_HOME}

RUN apt-get update && \
	apt-get dist-upgrade -y && \
	apt-get install -y \
					python && \
	apt-get clean && \
	rm -rf /var/lib/apt/lists/* && \
	adduser ${USER_NAME} gpio && \
	cd ${NODE_HOME} && \
	chown -R ${USER_NAME}:${USER_NAME} ${NODE_HOME}/package.json && \
	npm -g config set user ${USER_NAME} && \
	npm install -g \
				gulp \
				jshint && \
	npm install && \
	chown -R ${USER_NAME}:${USER_NAME} ${NODE_HOME} && \
	npm cache clean

#COPY entrypoint.sh /usr/local/bin/
#RUN chmod 755 /usr/local/bin/entrypoint.sh
#ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]

COPY . ${APP_HOME}

RUN chown -R ${USER_NAME}:${USER_NAME} ${APP_HOME}

WORKDIR ${APP_HOME}

USER ${USER_NAME}

VOLUME [ "${APP_HOME}" ]

EXPOSE ${SERVER_HTTP}

CMD [ "npm", "start" ]

