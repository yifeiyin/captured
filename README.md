> **Note:** 🛠️ This documentation is a work in progress. 🚧
>
> In the mean time, checkout the deployed version at: https://captured.yyin.me/


## Monorepo Setup
```
bun run setup
bun run dev
bun run migrate

bun run prod:migrate
bun run prod:deploy
```

## Frontend

- **Lint the code:**
  ```sh
  bun run lint
  ```

- **Start the development server:**
  ```sh
  bun dev
  ```

## Backend

- **Create `.dev.cars` with:**
  ```sh
  secret="local"
  allowCors=1
  proxyR2=1

  accountId=...
  databaseId=...
  token=...
  ```

- **Start the development server:**
  ```sh
  bun dev
  ```

- **Generate TypeScript types after making changes to `wrangler.jsonc`:**
  ```sh
  bun types
  ```

- **Run database migrations using Drizzle Kit:**
  ```sh
  bunx --bun drizzle-kit --config=src/db/config.local.ts migrate
  ```

<!--
- **Alternative command for running database migrations:**
  ```sh
  bun run node_modules/drizzle-kit/bin.cjs --config=src/db/config.local.ts migrate
  ```
-->

## Deploy

Run these from project root.

- **Update secret if needed:**
  ```sh
  wrangler secret --name <project> put secret
  ```

- **Run database migrations for production:**
  ```sh
  bun --cwd=./server run --env-file=.dev.vars node_modules/drizzle-kit/bin.cjs --config=src/db/config.prod.ts migrate
  ```

- **Build app and deploy:**
  ```sh
  bun --cwd=./client run build --emptyOutDir --outDir ../server/.client_dist && bun --cwd=./server run deploy
  ```
