# Captured

A modern, performant photography website built with Vue 3 and Cloudflare Workers.

🌐 Live Demo: https://captured.yyin.me

## Tech Stack

| 📌                  | 🚀                                     | 📝                                 |
|---------------------|------------------------------------------------|----------------------------------------------|
| 🎨 **Frontend**      | [Vue](https://vuejs.org/) + [tailwindcss v4](https://tailwindcss.com/) |  |
| ⚡ **Backend**        | [tRPC](https://trpc.io/)                       | End-to-end type-safe API                     |
| ☁️ **Runtime** | [Cloudflare Workers](https://workers.cloudflare.com/) | Serverless backend                           |
| 🗄 **Database**       | [D1](https://developers.cloudflare.com/d1/) + [Drizzle](https://orm.drizzle.team)    | Cloudflare's SQLite + type-safe ORM |
| 📦 **Object Storage** | [R2](https://developers.cloudflare.com/r2/)    | Cloudflare's S3 bucket to store images           |
| | |
| 🔐 **Authentication** | [WebAuthn](https://webauthn.guide/) | Passkey authentication |
|  🖼 **Image Handling** | [Responsive Images](https://developer.mozilla.org/en-US/docs/Web/HTML/Responsive_images#resolution_switching_different_sizes) + [Blurhash](https://blurha.sh) | Optimized delivery with low-bandwidth previews |
|  🎊 **Animations** | [View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API) | Smooth page transitions powered by the View Transition API |


## Local Development

This project uses a monorepo setup. All commands should be run from the project root.

1. Install dependencies:
  ```bash
  bun install
  ```

2. Configure environment:
Create `server/.dev.vars` with:
  ```bash
  secret="local"
  allowCors=1
  proxyR2=1

  accountId=<your-cloudflare-account-id>
  databaseId=<your-d1-database-id>
  token=<your-cloudflare-api-token>
  ```

3. Start development server:
  ```bash
  bun dev
  ```

4. Run database migrations:
  ```bash
  bun migrate
  ```

## Deployment

1. Verify Cloudflare credentials in `server/.dev.vars`

2. Run production database migrations:
  ```bash
  bun prod:migrate
  ```

3. Deploy:
  ```bash
  bun prod:deploy
  ```

4. (Optional) Update secret key:
  ```bash
  bun run wrangler secret --name <project> put secret
  ```

## Development Notes

When modifying `wrangler.jsonc`, regenerate types with:
  ```bash
  bun types
  ```
