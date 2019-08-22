#!/usr/bin/env bash

pdir=$(cd $(dirname $0)/..; pwd)
node --experimental-modules $pdir/main.js $@
