FROM node:23-alpine AS build
RUN apk add --no-cache git
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN git init
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]