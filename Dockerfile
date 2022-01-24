FROM node:16-alpine

COPY ./ /web
#TODO create a bind volume so we don't have to copy node modules

CMD node /web