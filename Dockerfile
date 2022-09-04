FROM node:16 AS base
WORKDIR /base
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
ENV NODE_ENV=production
RUN npx expo export:web

FROM joseluisq/static-web-server
# RUN rm -rf /etc/nginx
# COPY nginx /etc/nginx
ENV SERVER_FALLBACK_PAGE=./public/index.html
COPY --from=base /base/web-build /public
