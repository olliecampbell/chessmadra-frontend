FROM node:16.3-alpine3.12 AS base
WORKDIR /base
COPY package.json ./
COPY yarn.lock ./
RUN mkdir -p packages/next
RUN mkdir -p packages/app
RUN mkdir -p packages/expo
COPY packages/next/package.json packages/next
COPY packages/app/package.json packages/app
COPY packages/expo/package.json packages/expo
RUN yarn install
COPY . .
ENV NODE_ENV=production
# RUN npm set progress=false && \
#   npm install -g expo-cli
RUN yarn build
RUN yarn export

FROM nginx:latest
# RUN rm -rf /etc/nginx
# COPY nginx /etc/nginx
COPY templates /etc/nginx/templates/
COPY --from=base /base/packages/next/out /usr/share/nginx/html
