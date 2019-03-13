ARG NODE=node:11.11.0
FROM $NODE

WORKDIR /app

COPY . ./

RUN yarn install && ./bin/cli behaviors -c ./behavior-config.yml -b

VOLUME /app/behaviors
VOLUME /app/dist
VOLUME /app/lib

EXPOSE 3030
ENV BEHAVIOR_API_HOST=0.0.0.0

CMD ["./bin/cli", "behaviors", "-c", "./behavior-config.yml", "-b"]
