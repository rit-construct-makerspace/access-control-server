FROM node:22-alpine AS base
WORKDIR /usr/src/app
COPY package*.json ./
COPY tsconfig*.json ./
COPY server/ ./
COPY client/ ./
RUN npm i
COPY . .
RUN npm run build

FROM node:22-alpine AS dep
WORKDIR /usr/src/app
COPY --from=base /usr/src/app/package.json ./
COPY --from=base /usr/src/app/server/dist ./
RUN npm install

FROM node:22-alpine AS production
WORKDIR /usr/src/app
COPY --from=dep /usr/src/app ./
COPY --from=base /usr/src/app/server/dist ./dist
ENV NODE_ENV=production 
ENV NODE_PATH=./dist
EXPOSE 3000
CMD npm run start:staging

FROM postgres:16-alpine
# On Windows root will own the files, and they will have permissions 755
COPY server/cert/key.pem /var/lib/postgresql/key.pem
COPY server/cert/cert.pem /var/lib/postgresql/cert.pem
# update the privileges on the .key
RUN chmod 600 /var/lib/postgresql/key.pem
RUN chown postgres:postgres /var/lib/postgresql/key.pem