FROM node:16 AS base
WORKDIR /base
COPY package.json ./
COPY yarn.lock ./
RUN yarn install
COPY . .
ENV NODE_ENV=production
RUN npx expo export:web

FROM joseluisq/static-web-server:2
COPY --from=base /base/web-build /public
COPY ./entrypoint.sh /
RUN ls
ENTRYPOINT ["/entrypoint.sh"]
