FROM node:10-alpine

VOLUME /app

EXPOSE 3000
WORKDIR "/app"
CMD ["/app/run.sh"]
