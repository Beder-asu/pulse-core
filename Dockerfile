FROM node:22-alpine

ARG SERVICE_PATH

WORKDIR /app

# Copy root package.json and workspace config
COPY package.json package-lock.json* ./
COPY packages/common ./packages/common

# Copy specific service
COPY services/${SERVICE_PATH} ./services/${SERVICE_PATH}

# Install dependencies
RUN npm install --workspace=packages/common --workspace=services/${SERVICE_PATH}

WORKDIR /app/services/${SERVICE_PATH}

EXPOSE 3000

# OpenTelemetry must be loaded before the app
CMD ["node", "src/index.js"]
