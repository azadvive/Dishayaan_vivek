#!/bin/sh
set -e
npm install
CI=false npm run build
rm -f netlify-upload.zip
(cd build && zip -qr ../netlify-upload.zip .)
echo "DONE: netlify-upload.zip created. Drag it onto https://app.netlify.com/drop"
