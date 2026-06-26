# Deploying MenuDrop next to Quasar (no cross-restart)

MenuDrop runs as its **own** Docker Compose project on its **own** localhost
port, behind the **same host nginx** that already serves
`quasar.quasarlabs.in`. Deploying or rebuilding MenuDrop never touches Quasar.

## Why one app can't restart the other

- `docker build` only produces an image — it never restarts a running
  container.
- `docker compose` only acts on services in **its own project**. This compose
  file sets `name: menudrop`, so `docker compose ... ` here only ever
  affects the `menudrop-web` container. Quasar is a different project.
- The app binds to `127.0.0.1:3001` only, so it can't collide with Quasar's
  port and isn't exposed to the internet directly.
- Adding the subdomain is an nginx **reload** (`systemctl reload nginx`),
  which is graceful — Quasar keeps serving with zero downtime.

The golden rules: never run `docker compose down` or `docker system prune -a`
at a global scope, and always run compose commands from this directory (or with
`-p menudrop`).

## One-time setup on the server

1. **DNS** — add an A record: `menudrop.quasarlabs.in` → the server's IP
   (same IP as quasar).

2. **Environment** — create `.env.local` on the server (do NOT commit it):
   ```bash
   cp .env.example .env.local
   # then fill real values, and set:
   #   DEMO_MODE=false
   #   NEXT_PUBLIC_APP_URL=https://menudrop.quasarlabs.in
   #   NODE_ENV=production
   ```
   Also: add `https://menudrop.quasarlabs.in` to Supabase Auth → URL config,
   and point the Razorpay webhook to
   `https://menudrop.quasarlabs.in/api/payments/webhook`.

3. **Database** — run `supabase/schema.sql` in your Supabase project (or the
   `ALTER TABLE` migrations if upgrading an existing one).

4. **Start the container** (only affects menudrop). Use `--env-file .env.local`
   so the public `NEXT_PUBLIC_*` values get inlined into the browser bundle at
   build time (server secrets stay runtime-only and are never baked in):
   ```bash
   docker compose --env-file .env.local up -d --build
   docker compose ps           # menudrop-web should be healthy on 127.0.0.1:3001
   curl -I http://127.0.0.1:3001/login
   ```
   > If you build without `--env-file .env.local`, the build still succeeds but
   > the browser bundle uses placeholder Supabase values and client-side auth
   > won't work. Always pass it for production.

5. **nginx** — install the server block and reload (graceful):
   ```bash
   sudo cp deploy/nginx/menudrop.quasarlabs.in.conf \
           /etc/nginx/sites-available/menudrop.quasarlabs.in
   sudo ln -s /etc/nginx/sites-available/menudrop.quasarlabs.in \
              /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

6. **TLS** — certbot only edits MenuDrop's server block:
   ```bash
   sudo certbot --nginx -d menudrop.quasarlabs.in
   ```

## Redeploys (safe, scoped to MenuDrop)

```bash
cd /path/to/menudrop
git pull
docker compose --env-file .env.local up -d --build   # ONLY menudrop-web
docker image prune -f                                 # removes only dangling images
```

Quasar's container is never referenced, so it keeps running throughout.

## If your nginx runs as a container (nginx-proxy / jwilder)

Instead of the host server block, put MenuDrop on the proxy's external network
and let it auto-configure:

```yaml
# in docker-compose.yml
services:
  web:
    # remove the published port; the proxy reaches it on the network
    expose: ["3000"]
    networks: [proxy]
    environment:
      VIRTUAL_HOST: menudrop.quasarlabs.in
      VIRTUAL_PORT: "3000"
      LETSENCRYPT_HOST: menudrop.quasarlabs.in
      LETSENCRYPT_EMAIL: you@quasarlabs.in
networks:
  proxy:
    external: true
    name: <the network your nginx-proxy uses>
```

The proxy regenerates its config and reloads itself when the new container
appears — again, without restarting Quasar's container.
