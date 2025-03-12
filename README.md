## Prerequisites

### Mongo

Webapp Template Server requires a connection to MongoDB with a replica set enabled. If you don't have one, you can set it up using the script below (Docker-based):

```
./scripts/mongo.sh
```

### Nodejs

The project is written in TypeScript, so it requires a Node.js environment to run (version 22).

## Run

Install dependencies, compile the code, and run it:

```
npm install
npm run compile
npm start
```

## Develop

First, run the compilation in watch mode (it will recompile the project whenever any changes are made):

```
npm run watch
```

Then, in a separate console, run the server (it will restart whenever any changes are made):

```
npm start
```

## Documentation

### Build Documentation

To build the documentation, run:

```
./scripts/build-docs.sh
```

### Visit Documentation

If your server runs on port 3000, the documentation will be available at [http://localhost:3000/docs](http://localhost:3000/docs).

### Develop Documentation

WebApp uses [Slate](https://github.com/slatedocs/slate) for the Bridge documentation. First, run it in watch mode:

```
./scripts/develop-docs.sh
```

Navigate to [http://127.0.0.1:4567](http://127.0.0.1:4567). Whenever you make any changes, run the script below to generate markdowns for Slate and then refresh the page:

```
npm run gen-docs
```

## Testing

Unit test:

```
npm t
```

E2E test:

```
npm run e2e-tests
```

## Build Docker Image

It will produce a Docker image with the `webapp-template` tag:

```
./scripts/build-docker.sh
```
