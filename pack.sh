#!/bin/bash
# Ignores any electron-or-metadata-specific content and builds files for AMO
# release. YOU DO NOT NEED TO BUILD THE EXTENSION WHILE DEVELOPING!

rm -r ./build
mkdir ./build

process () {
  mkdir -p $(dirname "./build/$1")
  if [[ ! $1 == ./source/lib/* ]] && [ ${1: -3} == ".js" ]; then
    echo "Building $1"
    cat $1 | node build.js > ./build/$1
  else
    echo "Copying $1"
    cp $1 ./build/$1
  fi
}

files=$(
  find -type f |\
  grep -Ev 'build|buildscripttest|node_modules|\.zip|\.xpi|\.git|electron|package(-lock)?\.json|desktop-manifest\.js|pack.sh|tpseimporter|makeTPSE'
)
for file in $files; do
  process $file
done
wait

# Replace vue with the runtime build now that everything is built
rm ./build/source/lib/vue.js
mv ./build/source/lib/vue.runtime.js ./build/source/lib/vue.js

cd build
zip -r ../tetrioplus.xpi -9 -u ./*
