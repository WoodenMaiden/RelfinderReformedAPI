FROM node:16-alpine

ARG GIT_COMMIT=unknown

LABEL "fr.ird.maintainer"="yann.pomie@ird.fr" \
      "version"=${GIT_COMMIT} \
      "description"="Docker image for the RelFinderReformed API"
ENV VERSION=${GIT_COMMIT}

WORKDIR /web

COPY ./ .

RUN npm ci
RUN npm run build

CMD [ "npm", "run", "start:prod" ]