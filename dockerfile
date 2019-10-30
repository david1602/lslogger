FROM node:10-alpine

VOLUME /app
VOLUME /certs

EXPOSE 3000
WORKDIR "/app"
CMD ["/app/run.sh"]
