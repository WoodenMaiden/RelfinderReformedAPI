#!/bin/bash

set -e 

normal='\e[0m'
green='\e[32m'
blue='\e[32m'


has_frontend="false"

nest build &

echo -e "${blue}Building backend 🖥️${normal}"

if [[ -d "./frontend/build" ]]; then 
    cd frontend
    npm run build &
    cd -

    echo -e "${blue}Building Frontend 📄${normal}"
    has_frontend="true"
fi


wait
echo -e "${green}Build complete 🎉${normal}"

if [[ $has_frontend -eq "true" && ! -L "./dist/frontend" ]]; then
    ln -s "$(pwd)/frontend/build" "$(pwd)/dist/frontend"
    echo -e "${blue}Frontend linked to dist folder ${normal}"
fi
