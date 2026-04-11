# Deliberately insecure — for security training / scanner demos only. Do not use in production.

FROM node:latest

USER root

ARG DB_PASSWORD=Sup3rS3cr3t!
ARG STRIPE_SECRET=sk_live_4eC39HqLyjWDarjtT1zdp7dc
ENV DB_PASSWORD=${DB_PASSWORD}
ENV STRIPE_SECRET=${STRIPE_SECRET}

WORKDIR /app

COPY . .

RUN cd backend && npm install

EXPOSE 22
EXPOSE 3001

CMD ["node", "backend/server.js"]
