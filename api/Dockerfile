FROM node:11.10.1

EXPOSE 3030

CMD ["node", "--harmony-await-optimization", "run.js"]

ENV INDOCKER="1" WR_BEHAVIOR_DIR="/behaviorDir" WR_BEHAVIOR_METADATA_PATH="/behaviorDir/behaviorMetadata.js"

WORKDIR /app
COPY . ./

RUN yarn install
VOLUME /behaviorDir

