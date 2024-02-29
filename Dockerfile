FROM node:20-alpine as builder

COPY ./ .

RUN npm ci
RUN npm run build

############################################

FROM node:20-alpine

ARG GIT_COMMIT=unknown
WORKDIR /app

ENV NODE_ENV=production
ENV VERSION=${GIT_COMMIT}

LABEL "fr.ird.maintainer"="yann.pomie@ird.fr" \
      "version"=${GIT_COMMIT} \
      "description"="Docker image for the RelFinderReformed API"

USER node

COPY --from=builder --chown=node:node ./dist .
COPY --from=builder --chown=node:node ./node_modules ./node_modules

CMD [ "node", "./src/main.js" ]
