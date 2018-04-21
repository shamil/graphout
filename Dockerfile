FROM node:8-alpine
LABEL maintainer "Alex Simenduev <shamil.si@gmail.com>"

# install graphout
RUN apk --no-cache add tini && \
    npm install --global graphout

# configure container environment
VOLUME ["/etc/graphout"]
ENTRYPOINT ["/sbin/tini", "--", "/usr/local/bin/graphout"]
