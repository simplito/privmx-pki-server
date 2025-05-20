#!/bin/bash
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

printf "***************************************************************************\n"
printf "*                                                                         *\n"
printf "*                         \e[1;36mPRIVMX PKI INSTALLER\e[0m                            *\n"
printf "*                                                                         *\n"
printf "***************************************************************************\n"
printf "\n"

printf "\e[1;36m-----------------\nBooting up\n-----------------\e[0m\n"

docker compose up -d --wait
printf "OK\n"
printf "\n"
sleep 1

API_KEY_ID="";
API_KEY_SECRET="";
DATA=`docker compose exec -T privmx-pki-server pmxpki_genkeys`
for KEY in $DATA; do 
    IFS="=" read name value <<< $KEY
    printf -v "$name" '%s' $value
done

printf "\n"
printf "***************************************************************************\n"
printf "*                                                                         *\n"
printf "*\e[1;32m           _____      _       __  ____   __  _____  _  _______           \e[0m*\n"
printf "*\e[1;32m          |  __ \    (_)     |  \/  \ \ / / |  __ \| |/ /_   _|          \e[0m*\n"
printf "*\e[1;32m          | |__) | __ ___   _| \  / |\ V /  | |__) | ' /  | |            \e[0m*\n"
printf "*\e[1;32m          |  ___/ '__| \ \ / / |\/| | > <   |  ___/|  <   | |            \e[0m*\n"
printf "*\e[1;32m          | |   | |  | |\ V /| |  | |/ . \  | |    | . \ _| |_           \e[0m*\n"
printf "*\e[1;32m          |_|   |_|  |_| \_/ |_|  |_/_/ \_\ |_|    |_|\_\_____|          \e[0m*\n"
printf "*                                                                         *\n"
printf "*           \e[1;32mInstallation Complete! Thank you for choosing us :)\e[0m           *\n"
printf "*                                                                         *\n"
printf "***************************************************************************\n"
printf "\n"
printf "           PrivMX PKI URL:  http://localhost:8101\n"
printf "\n"
printf "               API Key ID:  $API_KEY_ID\n"
printf "           API Key Secret:  $API_KEY_SECRET\n"
printf "\n"                                                      
