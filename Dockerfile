FROM ubuntu:18.04

RUN apt update \
 && apt install -y \
    curl \
    gnupg \
    gcc \
    g++ \
    make \
 && curl -sL http://deb.nodesource.com/setup_8.x | bash - \
 && apt install -y nodejs \
 && rm -rf /var/lib/apt/lists/*
RUN apt-get update
RUN apt-get install -y libjpeg-dev libpng-dev autoconf libtool nasm pkg-config
RUN npm install -g gulp
RUN apt-get install -y python3-pip
RUN pip3 install awscli --upgrade --user
ENV PATH="/root/.local/bin:${PATH}"

