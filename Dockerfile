FROM node:22-alpine
WORKDIR /app
COPY package.json ./
COPY src ./src
COPY public ./public
COPY models ./models
COPY data/dataset-manifest.json ./data/dataset-manifest.json
EXPOSE 8080
CMD ["node", "src/server.js"]
