# syntax=docker/dockerfile:1.7

FROM reg.mini.dev/node:24.21.0-dev AS build

USER root
WORKDIR /build

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run check
RUN mkdir -p /build/runtime-data \
    && DATABASE_PATH=/build/runtime-data/techvibe.db npm run data:seed

FROM reg.mini.dev/node:24.21.0

WORKDIR /app
ENV NODE_ENV=production \
    PORT=5000 \
    DATABASE_PATH=/app/data/techvibe.db

COPY --chown=1000:1000 package.json ./
COPY --chown=1000:1000 --from=build /build/dist ./dist
COPY --chown=1000:1000 --from=build /build/server/index.ts /build/server/database.ts ./server/
COPY --chown=1000:1000 --from=build /build/src/data ./src/data
COPY --chown=1000:1000 --from=build /build/src/types ./src/types
COPY --chown=1000:1000 --from=build /build/scripts/database-inspect.ts /build/scripts/profile-admin.ts ./scripts/
COPY --chown=1000:1000 --from=build /build/runtime-data ./data

EXPOSE 5000
VOLUME ["/app/data"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:5000/api/health').then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"]

CMD ["node", "server/index.ts"]
