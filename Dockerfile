FROM node:11.10.1

ENV DOCKER 1

WORKDIR /app

ADD . ./

RUN yarn install

VOLUME /dist

CMD ["yarn", "run", "build-behaviors"]
