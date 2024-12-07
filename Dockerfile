FROM oven/bun:latest AS base
WORKDIR /usr/app

# bun install
FROM base AS install
RUN mkdir -p /temp/dev
COPY package.json /temp/dev/
RUN cd /temp/dev && bun install

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# build app
ENV NODE_ENV=production
RUN bun run build

# copy production code into final image
FROM base AS release
COPY --from=prerelease /usr/app/build build
COPY --from=prerelease /usr/app/node_modules node_modules

# run the app
## some node modules are read-protected, root user is needed
#USER bun
EXPOSE 3000/tcp
ENTRYPOINT ["bun", "build/index.js"]
