FROM node:16 AS base
WORKDIR /base
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
ENV NODE_ENV=production
RUN npx expo export:web

FROM joseluisq/static-web-server
ENV SERVER_FALLBACK_PAGE=./public/index.html
ENV SERVER_PORT=80
COPY --from=base /base/web-build /public
