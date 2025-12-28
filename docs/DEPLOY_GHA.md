# Deploying TKMS with GitHub Actions → EC2 (PM2 + Nginx)

This document explains how to set up a simple GitHub Actions-based deploy pipeline that builds your Next.js app using `pnpm`, uploads the repo to an EC2 host via SSH/rsync, installs production dependencies, builds on the server, and starts/reloads the app using `pm2`. Nginx is reloaded at the end (if available).

## What the workflow does

- Runs on `push` to `main`.
- Installs dependencies and runs `pnpm build` in CI to ensure the build passes locally.
- Uses `rsync` to copy the repository to a directory on your EC2 instance (excluding `node_modules`, `.git`, and `.github`).
- SSHs into the server and ensures `pnpm` and `pm2` are installed, runs `pnpm install --prod`, runs `pnpm build` on the server, and then runs `pm2 startOrReload ecosystem.config.js --env production` if `ecosystem.config.js` exists.

## Required GitHub repository secrets

Go to your repository → Settings → Secrets → Actions and add:

- `SSH_PRIVATE_KEY` — the private key for the user that can SSH to your EC2 instance (no passphrase is easier for automation).
- `SSH_HOST` — the EC2 server public IP or DNS name.
- `SSH_USER` — user to SSH as (e.g., `ubuntu`, `ec2-user`, or a custom deploy user).
- `SSH_PORT` — SSH port (usually `22`).
- `DEPLOY_PATH` — absolute path on the server where the app should be deployed (e.g., `/var/www/tkms`).

Optional: add any runtime environment variables in your server environment or expand the workflow to write a `.env.production` from repo secrets (be careful with sensitive values).

## Server prerequisites (on EC2)

1. Node.js (v18+) installed.
2. `pnpm` installed globally (workflow will attempt to install it if missing).
3. `pm2` installed globally (workflow will attempt to install it if missing).
4. Nginx configured as a reverse proxy pointing to your Node/PM2 app (e.g., upstream at `http://127.0.0.1:3000`), and `systemctl` available to reload it.
5. A deploy user that has permissions to write to `DEPLOY_PATH` and run `pm2` and (optionally) `sudo systemctl reload nginx`.

Example simple `ecosystem.config.js` for PM2 (place in repo root):

```js
module.exports = {
  apps: [
    {
      name: 'tkms',
      script: 'node',
      args: 'server.js', // if you use a custom server; otherwise use `next start` or the correct entry
      cwd: __dirname,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
```

If your project uses `next start` for production (Next.js App Router with a custom server is possible), update `args` accordingly, or replace `script` with `npm`/`pnpm` invocation. Example using `next start`:

```js
module.exports = {
  apps: [
    {
      name: 'tkms',
      script: 'pnpm',
      args: 'start',
      env: { NODE_ENV: 'production' },
    },
  ],
};
```

## Example Nginx server block (basic)

```
server {
  listen 80;
  server_name your.domain.example;

  location /_next/static/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

Adjust ports and paths based on how you start Next (port used by `next start` or your custom server).

## Security notes

- Use a deploy-only SSH key with limited access. Consider restricting the key in `~/.ssh/authorized_keys` with a `command=` or `from=` option if you need extra security.
- Avoid writing production secrets into the repository. Use GitHub Secrets for CI and environment variables set on the server for runtime secrets.

## Troubleshooting

- If rsync fails, make sure the user, host, and path are correct and the deploy user has write access to `DEPLOY_PATH`.
- If `pm2` start/reload fails, check logs on the server (`pm2 logs` / `pm2 show <app>`).
- If Nginx needs a full restart, use `sudo systemctl restart nginx` (workflow uses `reload` to be safer).

---
If you want, I can:

- Tailor the workflow to upload only the build output (and invoke a different server-side build strategy).
- Add a job for creating a versioned release/artifact.
- Add health-check and rollback steps.

Tell me which you'd prefer and I'll patch the workflow accordingly.
