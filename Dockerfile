FROM node:10

ENV DOCKER 1

WORKDIR /build

ADD . /build

RUN yarn install

VOLUME /dist

CMD ["yarn", "run", "build-docker"]
