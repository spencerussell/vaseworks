# Multi-stage: build the static artifact, then serve it from nginx.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev
COPY src ./src
COPY scripts ./scripts
RUN npm run build

FROM nginx:1.27-alpine AS serve
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
