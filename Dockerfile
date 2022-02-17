FROM node:16-alpine

COPY ./ /web

WORKDIR /web

RUN npm i
RUN npm build

RUN rm -rf src typings

CMD node /web