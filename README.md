> **Note:** 🛠️ This documentation is a work in progress. 🚧
>
> In the mean time, checkout the deployed version at: https://captured.yyin.me/


## Local setup
This uses a monorepo setup. Run all commands at the root of the project.

1. Install dependencies
  ```
  bun install
  ```

2. Create config file `server/.dev.vars`
  ```
  cat > server/.dev.vars << EOF
  secret="local"
  allowCors=1
  proxyR2=1

  accountId=...
  databaseId=...
  token=...
  EOF
  ```

2. Start development server
  ```
  bun dev
  ```

3. Run database migration (on your local sqlite file generated by wrangler)
  ```
  bun migrate
  ```

### To deploy

1. Ensure the accountId, databaseId, token in your `server/.dev.vars` are correct. See [Drizzle Kit Doc](https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit).

2. Run database migration
  ```
  bun prod:migrate
  ```

3. Deploy your code
  ```
  bun prod:deploy
  ```

4. Update the secret key if necessary
  ```
  bun run wrangler secret --name <project> put secret
  ```

### During development
If you make any changes to `wrangler.jsonc`, run this to regenerate `worker-configuration.d.ts`
  ```
  bun types
  ```
