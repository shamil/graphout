FROM mhart/alpine-node:4.7

# install graphout
RUN apk --no-cache add tini && \
    npm install --global graphout

# configure container environment
VOLUME ["/etc/graphout"]
ENTRYPOINT ["/sbin/tini", "--", "/usr/bin/graphout"]
