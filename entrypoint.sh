#!/bin/sh
static-web-server --help
SERVER_PORT=80 static-web-server --page-fallback /public/index.html --cache-control-headers=false -w /static-web-server.toml
