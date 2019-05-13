FROM node:10.13-alpine
ENV NODE_ENV dev
WORKDIR /usr/src/app
COPY ["package.json", "package-lock.json*", "npm-shrinkwrap.json*", "./"]
RUN npm install --silent && mv node_modules ../
RUN npm install -g typescript
COPY . .
RUN npm run build-ts
EXPOSE 3000
CMD npm run serve