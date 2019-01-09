FROM node:11.9.0

ENV DOCKER 1

WORKDIR /app

ADD . ./

RUN yarn install

VOLUME /dist

CMD ["yarn", "run", "build-behaviors"]
