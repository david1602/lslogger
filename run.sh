#!/bin/sh


if [ ! -d "node_modules" ]
then
    # Install dependencies and create a file indicating successful installation
    npm install && touch node_modules/.all-deps-installed
fi

if [ ! -d "tmp" ]
then
    mkdir tmp
fi

# Wait until dependencies have been installed
while [ ! -f node_modules/.all-deps-installed ]
do
    echo "Waiting for dependencies to be installed..."
    sleep 5
done

exec npm run start
