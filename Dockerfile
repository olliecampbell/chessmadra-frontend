FROM node:18 AS base
RUN npm install -g bun
RUN npm install -g pnpm
WORKDIR /base
COPY package.json ./
COPY bun.lockb ./
RUN bun install
COPY . .
ENV NODE_ENV=production
ARG SENTRY_AUTH_TOKEN
ENV SENTRY_AUTH_TOKEN ${SENTRY_AUTH_TOKEN}
RUN pnpm run build
CMD pnpm run start --port=80

