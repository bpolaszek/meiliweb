FROM node:18-alpine

RUN apk add --no-cache bash git openssh

WORKDIR /app

COPY package*.json yarn.lock ./

RUN yarn install

COPY . .

WORKDIR /app/app  # Correct working directory for the Nuxt build

RUN yarn build

EXPOSE 3000

CMD ["yarn", "preview"]
