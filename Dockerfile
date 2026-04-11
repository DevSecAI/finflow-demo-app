# Deliberately insecure — for security training / scanner demos only. Do not use in production.

FROM node:latest

USER root

ARG DB_PASSWORD=Sup3rS3cr3t!
# GitHub push protection blocks known Stripe-shaped literals; use a fake pattern for demos.
ARG STRIPE_SECRET=sk_live_FINFLOW_DEMO_FAKE_NOT_REAL_XXXXXXXXXXXX
ENV DB_PASSWORD=${DB_PASSWORD}
ENV STRIPE_SECRET=${STRIPE_SECRET}

WORKDIR /app

COPY . .

RUN cd backend && npm install

EXPOSE 22
EXPOSE 3001

CMD ["node", "backend/server.js"]
