FROM node:18 AS base
RUN npm install -g bun
WORKDIR /base
COPY package.json ./
COPY bun.lockb ./
RUN bun install
COPY . .
ENV NODE_ENV=production
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN ${SENTRY_AUTH_TOKEN}
RUN bun build
CMD bun start --port=80

