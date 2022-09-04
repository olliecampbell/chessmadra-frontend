#!/bin/sh
static-web-server --help
SERVER_PORT=80 static-web-server --port 80 --page-fallback /public/index.html --cache-control-headers=false
