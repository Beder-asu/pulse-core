FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl

COPY package*.json ./
COPY packages/common ./packages/common
COPY services/billing ./services/billing

RUN npm install --workspaces --include-workspace-root

WORKDIR /app/services/billing
RUN /app/node_modules/.bin/prisma generate

EXPOSE 3006
CMD ["node", "--require", "/app/node_modules/@pulsecore/common/src/tracing.js", "src/server.js"]
