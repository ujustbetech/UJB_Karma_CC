# Developer Guide

This project is a Next.js app with Firebase on the client and Firebase Admin on the server.

## Prerequisites

- Node.js 22 or newer is recommended
- npm
- Firebase env values for the environment you want to run

## Install

```bash
npm install
```

## Environment Files

The project supports three Firebase environments:

- `.env.development`
- `.env.staging`
- `.env.production`

Local development also supports `.env.local`, which overrides development values. This is the safest place for your personal local secrets.

For Firebase setup details, see [separateFirebaseEnv.md](/C:/Ruchita/Next/Universe_CC_tool/UJB_Karma_CC/docs/separateFirebaseEnv.md).

## Common Commands

Start local development:

```bash
npm run dev
```

Start the app against staging env values:

```bash
npm run dev:staging
```

Run tests:

```bash
npm test
```

Run lint:

```bash
npm run lint
```

Create a development build:

```bash
npm run build:development
```

Create a staging build:

```bash
npm run build:staging
```

Create a production build:

```bash
npm run build:production
```

Run the built app in staging mode:

```bash
npm run start:staging
```

Run the built app in production mode:

```bash
npm run start:production
```

## Daily Workflow

1. Install dependencies with `npm install`
2. Put your local Firebase and server secrets in `.env.local`
3. Start the app with `npm run dev`
4. Run `npm test` before handing off changes
5. Run `npm run lint` if the ESLint config is working in your environment

## Useful Notes

- `npm run dev` uses the development environment and lets `.env.local` override `.env.development`
- `npm run dev:staging` uses `.env.staging`
- The active app environment is exposed in code through `publicEnv.appEnv` and `serverEnv.appEnv`
- Firebase collection names are centralized through `COLLECTIONS` in `lib/utility_collection.js`

## Troubleshooting

If you see a Firebase API key error:

- check that `.env.local` or the selected env file has valid Firebase client keys
- restart the dev server after changing env files

If staging or production does not start:

- confirm the corresponding `.env.staging` or `.env.production` file has real values instead of placeholders

If lint fails immediately:

- verify the ESLint config dependencies are installed and compatible with the repo
