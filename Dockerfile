FROM node:16-alpine

COPY ./ /web

WORKDIR /web

RUN npm i
RUN npm run build

RUN rm -rf src typings tsconfig.json tslint.json

CMD node /web