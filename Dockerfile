# specify the node base image with your desired version node:<version>
FROM node:alpine
RUN apk add --no-cache task jq
COPY package.json .
RUN npm install --quiet
COPY . .
RUN mkdir /home/node/.task
RUN chown node:node /home/node/.task
USER node

