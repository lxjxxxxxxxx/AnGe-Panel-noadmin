# build frontend
FROM node:18-alpine as frontend_image

WORKDIR /build

RUN npm install -g pnpm@8

# 只复制构建所需文件，利用 Docker 缓存层
COPY package.json pnpm-lock.yaml ./
COPY vite.config.ts tsconfig.json postcss.config.js tailwind.config.js ./
COPY index.html ./
COPY add-frontend-version.js ./
COPY .env ./
COPY public ./public
COPY src ./src

RUN pnpm install \
    && npx vite build


# build backend
# 最新alpine3.19导致sqlite3编译失败(https://github.com/mattn/go-sqlite3/issues/1164，
# 临时解决方案:https://github.com/mattn/go-sqlite3/pull/1177)
# sun-panel暂时解决方案使用golang:1.21-alpine3.18（因旧版本使用没问题，短期内较稳定）
FROM golang:1.21-alpine3.18 as server_image

WORKDIR /build

# 仅复制 Go 后端相关目录（Go 项目已上移到仓库根目录）
COPY ./go.mod ./go.sum ./main.go ./
COPY ./api ./api
COPY ./assets ./assets
COPY ./conf ./conf
COPY ./global ./global
COPY ./initialize ./initialize
COPY ./lang ./lang
COPY ./lib ./lib
COPY ./models ./models
COPY ./router ./router
COPY ./runtime ./runtime
COPY ./structs ./structs

RUN apk add --no-cache bash curl gcc git musl-dev

RUN go env -w GO111MODULE=on \
    && go build -o ange-panel --ldflags="-X sun-panel/global.RUNCODE=release -X sun-panel/global.ISDOCKER=docker" ./main.go


# run_image
FROM alpine

WORKDIR /app

# 前端产物
COPY --from=frontend_image /build/dist /app/web

COPY --from=server_image /build/ange-panel /app/ange-panel

# Seed template (db + uploads + conf) shipped with image
COPY ./seed /app/seed

# Entrypoint prepares /data and symlinks /app/{conf,database,uploads,runtime} -> /data/*
COPY ./docker/entrypoint.sh /entrypoint.sh

EXPOSE 3005

RUN apk add --no-cache bash ca-certificates su-exec tzdata \
    && chmod +x /app/ange-panel /entrypoint.sh \
    && test -f /app/ange-panel \
    && /app/ange-panel -config \
    && mkdir -p /app/defaults \
    && rm -rf /app/defaults/conf \
    && mv /app/conf /app/defaults/conf

ENTRYPOINT ["/entrypoint.sh"]
CMD ["/app/ange-panel"]
