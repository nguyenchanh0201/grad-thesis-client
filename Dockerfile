ARG NODE_IMAGE=node:24-alpine

FROM ${NODE_IMAGE} AS base
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

RUN corepack enable

COPY package.json pnpm-lock.yaml ./

FROM base AS deps
RUN pnpm install --frozen-lockfile --ignore-scripts

FROM deps AS builder
ARG NEXT_PUBLIC_API_URL=http://ticketing.localhost/api/v1
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

COPY next.config.ts tsconfig.json postcss.config.mjs eslint.config.mjs ./
COPY app ./app
COPY components ./components
COPY core ./core
COPY hooks ./hooks
COPY lib ./lib
COPY public ./public
COPY schemas ./schemas
COPY services ./services

RUN pnpm run build

FROM ${NODE_IMAGE} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nextjs && adduser -S nextjs -G nextjs

COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
