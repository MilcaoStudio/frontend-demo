# Uprising app (demo)

This demo is a test playground for upcoming features of Uprising project.

## Developing

Once you've created a project and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```bash
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```bash
npm run build
```

## Creating a Docker image

Build the Docker image:

```bash
docker buildx b -t frontend .
```

You can then run the Docker image with:

```bash
docker run -e PUBLIC_VOSO_URL -p 3000:3000 frontend
```
