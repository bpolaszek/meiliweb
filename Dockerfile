FROM node:18-alpine
RUN apk add --no-cache bash git openssh

WORKDIR /app

COPY package*.json ./

RUN yarn install

COPY . .

RUN yarn build

EXPOSE 3000

CMD ["yarn", "preview"]
