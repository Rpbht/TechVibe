# Deploy TechVibe to a Google Cloud free-tier VM

This runbook deploys the application as one Docker container with a persistent Docker volume for SQLite.

## 1. Create the VM

In Google Cloud Console, create a Compute Engine VM with:

- Machine type: `e2-micro`
- Region: `us-west1`, `us-central1`, or `us-east1`
- Operating system: Ubuntu 24.04 LTS
- Boot disk: Standard persistent disk, no more than 30 GB if you want to remain within the documented free-tier disk allowance
- External IPv4 address enabled

Enable billing alerts before deployment. Free-tier eligibility and network charges depend on the account, region, and monthly usage.

For an initial private test, add a VPC firewall rule allowing TCP port `5000` only from your own public IP. Do not expose the content import API key in a firewall rule, URL, source file, or browser configuration.

## 2. Install Docker on the VM

Connect to the VM with SSH and run:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo \"${UBUNTU_CODENAME:-$VERSION_CODENAME}\") stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker "$USER"
```

Sign out and reconnect so the Docker group membership takes effect, then verify:

```bash
docker version
docker compose version
```

## 3. Clone and configure TechVibe

The repository is private. Authenticate with GitHub using a fine-grained token, SSH deploy key, or GitHub CLI, then clone it:

```bash
git clone https://github.com/Rpbht/TechVibe.git
cd TechVibe
cp .env.example .env
```

Generate a strong content-import key:

```bash
openssl rand -base64 48
```

Place that value in `.env` as `CONTENT_API_KEY`. Keep `.env` only on the VM; it is ignored by Git and Docker build context.

## 4. Build and run

```bash
docker compose up -d --build
docker compose ps
docker compose logs --tail=100 techvibe
curl http://127.0.0.1:5000/api/health
```

Open `http://EXTERNAL_IP:5000` after the restricted firewall rule is active.

The first container starts with all versioned question batches already seeded. Runtime data is stored in the named volume `techvibe-data`, mounted at `/app/data`. Rebuilding or replacing the container does not remove this volume.

## 5. Inspect and back up the database

Show the database location and safe record counts:

```bash
docker compose exec techvibe node scripts/database-inspect.ts
```

Create an application-consistent SQLite backup:

```bash
docker compose exec techvibe node -e "const {DatabaseSync}=require('node:sqlite'); const db=new DatabaseSync('/app/data/techvibe.db'); db.exec(\"VACUUM INTO '/app/data/techvibe-backup.db'\"); db.close();"
docker cp techvibe:/app/data/techvibe-backup.db ./techvibe-backup.db
```

Also configure a Compute Engine persistent-disk snapshot schedule. A container volume is persistent across container replacement, but it is not a substitute for an off-VM backup.

## 6. Update the deployment

```bash
git pull origin master
docker compose up -d --build
docker image prune -f
```

Never run `docker compose down -v` unless you intentionally want to delete the database volume.

## 7. Production internet access

The port-5000 setup is suitable for a restricted smoke test. Before allowing public sign-in, place the container behind an HTTPS reverse proxy and a domain name, expose only ports 80 and 443, and close public port 5000. Passwords and session cookies must not travel over plain public HTTP.
