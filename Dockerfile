FROM node:16-alpine

ENV RFR_PORT 80
ENV INCLUDED_CLASSES ""
ENV EXCLUDED_CLASSES ""
ENV INCLUDED_GRAPHS ""
ENV INCLUDED_NAMESPACES ""
ENV EXCLUDED_NAMESPACES ""

COPY ./ /web

WORKDIR /web

RUN npm i
RUN npm run build

RUN rm -rf src typings tsconfig.json tslint.json

ENTRYPOINT [ "docker-entrypoint.sh", "node" ] 
CMD [ "/web", "-c", "no-crash", "--loglevel", "INFO" ]