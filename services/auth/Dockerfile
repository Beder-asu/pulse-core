FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl

COPY package*.json ./
COPY packages/common ./packages/common
COPY services/auth ./services/auth

RUN npm install --workspaces --include-workspace-root

WORKDIR /app/services/auth
RUN /app/node_modules/.bin/prisma generate

EXPOSE 3008
CMD ["node", "--require", "/app/node_modules/@pulsecore/common/src/tracing.js", "src/server.js"]
