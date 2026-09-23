# ToolBox frontend — build from the repository root (pnpm workspace):
#   docker build -f frontend/Dockerfile .
# The build context must include frontend/ and packages/api-client/.
FROM node:24-slim AS build
WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com
RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY frontend/package.json frontend/package.json
COPY packages/api-client/package.json packages/api-client/package.json
RUN --mount=type=cache,target=/root/.local/share/pnpm/store pnpm install --frozen-lockfile

COPY packages/api-client packages/api-client
COPY frontend frontend

# Baked into the client bundle at build time: public address of the API.
# nginx routes /api/* to the backend, so the default is the compose entrypoint.
ARG NEXT_PUBLIC_API_URL=http://localhost
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @toolbox/frontend build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production

# Keep the workspace layout (frontend/node_modules symlinks point into the
# root node_modules), then run from frontend/ as pnpm does on the host.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/frontend/node_modules ./frontend/node_modules
COPY --from=build /app/frontend/.next ./frontend/.next
COPY --from=build /app/packages ./packages
COPY --from=build /app/frontend/package.json ./frontend/package.json
COPY --from=build /app/frontend/next.config.ts ./frontend/next.config.ts

EXPOSE 3000

WORKDIR /app/frontend

CMD ["./node_modules/.bin/next", "start", "--port", "3000"]
