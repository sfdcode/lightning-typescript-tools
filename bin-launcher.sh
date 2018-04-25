#!/bin/bash
unameOut="$(uname -s)"
case "${unameOut}" in
    Linux*)     machine=Linux;;
    Darwin*)    machine=Mac;;
    CYGWIN*)    machine=Cygwin;;
    MINGW*)     machine=MinGw;;
    *)          machine="UNKNOWN:${unameOut}"
esac


if [ "${machine}" = "Mac" ]; then
    binary=$1-darwin-amd64
elif [ "${machine}" = "Linux" ]; then
    binary=$1-linux-amd64
elif [ "${machine}" = "MinGw" ]; then
    binary=$1-windows-amd64.exe
else
    echo "System not recognized: ${unameOut}"
    exit -1
fi
./$binary