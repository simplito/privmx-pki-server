FROM node:22.11.0-bullseye-slim AS base


FROM base AS builder
COPY . /app
ARG MONGO_URL
ARG E2E_TESTS
RUN cd /app && ./scripts/build.sh

FROM slatedocs/slate AS docs
RUN rm -rf /srv/slate/source
COPY --from=builder /app/slatedocs /srv/slate/source
RUN cd /srv/slate && /srv/slate/slate.sh build --verbose

FROM base AS runner

COPY --from=builder /app/docker/bin /usr/bin
COPY --from=builder /app/build /work/webapp
COPY --from=docs /srv/slate/build /work/webapp/public/docs

EXPOSE 3000

CMD ["webapp"]
