# Deliberately insecure — for security training / scanner demos only. Do not use in production.

FROM node:latest

USER root

WORKDIR /app

COPY . .

RUN cd backend && npm install

EXPOSE 22
EXPOSE 3001

CMD ["node", "backend/server.js"]