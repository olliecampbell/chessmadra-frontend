FROM node:18 AS base
RUN npm install -g pnpm
WORKDIR /base
COPY package.json ./
COPY pnpm-lock.yaml ./
RUN pnpm install
COPY . .
ENV NODE_ENV=production
RUN pnpm run build
CMD pnpm run start

