FROM node:10-alpine

VOLUME /app
VOLUME /certs


EXPOSE 3000
WORKDIR "/app"
RUN npm install

CMD ["/app/run.sh"]
