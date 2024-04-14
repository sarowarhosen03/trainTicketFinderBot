#!/bin/bash

default_value=2000

if [ -z "$2" ]; then
    value="$default_value"
else
    value="$2"
fi

node index.mjs -d "$1" -f Dinajpur -c 706 -w "$value" &
node index.mjs -d "$1" -f 'B Sirajul Islam' -c 706 -w "$value" &
wait

