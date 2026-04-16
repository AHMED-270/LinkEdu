FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

FROM node:20-alpine AS runtime

WORKDIR /app

RUN npm install -g serve@14

COPY --from=build /app/dist ./dist

ENV NODE_ENV=production \
    PORT=8080

EXPOSE 8080

CMD ["sh", "-c", "serve -s dist -l ${PORT:-8080}"]
