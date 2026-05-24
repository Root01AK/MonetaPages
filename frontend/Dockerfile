# ── Build Stage ──────────────────────────────────────────────────
FROM node:20-alpine as build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

ENV VITE_API_URL=https://api.getmoneta.tech/api/

RUN npm run build

# ── Serve Stage ──────────────────────────────────────────────────
FROM nginx:stable-alpine as production-stage

COPY --from=build-stage /app/dist /usr/share/nginx/html

# Custom nginx config to handle React Router (SPA)
RUN printf 'server {\n    listen 80;\n    location / {\n        root /usr/share/nginx/html;\n        index index.html;\n        try_files $uri $uri/ /index.html;\n    }\n    location /api {\n        proxy_pass http://backend:8008/api;\n    }\n    location /uploads {\n        proxy_pass http://backend:8008/uploads;\n    }\n}\n' > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
