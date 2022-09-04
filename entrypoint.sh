#!/bin/sh
static-web-server --help
echo "SERVER PORT: " $SERVER_PORT
static-web-server --port 80 --page-fallback /public/index.html
