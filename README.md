# TypeScript Express Server Starter

This is a minimal starter project for a Node.js server using **Express** with **TypeScript** in a simple, clean structure.

## Structure

- `src/server.ts` – main server entry point (Express app)
- `tsconfig.json` – TypeScript configuration
- `package.json` – scripts and dependencies

The root route (`GET /`) responds with:

> `Hello server is running successfully`

## Setup

Install dependencies:

```bash
npm install
```

## Development

Run the development server with hot reload:

```bash
npm run dev
```

Then open `http://localhost:3000` in your browser; you should see:

> `Hello server is running successfully`

## Build & Run in Production

```bash
npm run build
npm start
```

