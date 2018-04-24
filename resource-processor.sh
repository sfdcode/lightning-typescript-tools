#!/bin/bash
for i in $(ls dist)
do
    tail -n +2 dist/$i > aux.js
    mv aux.js dist/$i
done 

#rm dist/CommonFunctions.js
rm dist/auraTypes.js

node node_modules/lightning-typescript-tools/upload.js $(ls dist)

echo "FILES PROCCESED"