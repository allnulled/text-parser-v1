#!/usr/bin/bash

DIR2="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$DIR2"

pwd > cwd.txt
# -x 'node dev/build.js @{refrescador.file}' \

/usr/bin/refrescador \
    -w "$(pwd)" \
    -i "**/node_modules/**/*" \
    -i "**/dist/**/*" \
    -i "**/*.dist.*" \
    -i "**/coverage/**/*" \
    -i "**/.nyc_output/**/*" \
    -i "**/dist-instrumented/**/*" \
    -d 0 \
    -e "sh" \
    -e "ts" \
    -e "tsx" \
    -e "txt" \
    -e "js" \
    -e "json" \
    -e "css" \
    -e "html" \
    -e "md" \
    -x 'node test.js --from @{refrescador.file}' \
    -mf "TODO.md" \
