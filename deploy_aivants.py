import subprocess, sys

HOST = "194.164.150.247"
USER = "root"
PASS = "Mx8afe-LMHU1t4J"

# Correct Nginx configuration for Aivants
# Note the NO trailing slash on proxy_pass for /api/ to preserve the /api prefix
NGINX_CONFIG = r"""server {
    listen 80;
    server_name aivants.backendbots.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name aivants.backendbots.com;

    ssl_certificate /etc/letsencrypt/live/aivants.backendbots.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/aivants.backendbots.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    root /var/www/aivants/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
"""

def run(ssh, cmd):
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=300)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if err:
        print(f"Stderr: {err}")
    return out

try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko"])
    import paramiko

print("Connecting to server...")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=20)
print("Connected!")

# 1. Cleanup Conflicts
print("Step 1: Cleaning up sites-enabled...")
run(ssh, "rm -f /etc/nginx/sites-enabled/default")
run(ssh, "rm -f /etc/nginx/sites-enabled/school-mgmt.conf")

# 2. Rebuild Frontend
print("Step 2: Checking for build tools...")
has_bun = run(ssh, "command -v bun")
build_cmd = "bun install && bun run build" if has_bun else "npm install && npm run build"
print(f"Using build command: {build_cmd}")

print("Building Aivants frontend in /var/www/backendbots...")
# We use 'cd' inside the command string for paramiko
run(ssh, f"cd /var/www/backendbots && {build_cmd}")

# 3. Deploy Build to /var/www/aivants/dist
print("Step 3: Deploying dist to /var/www/aivants/dist...")
run(ssh, "mkdir -p /var/www/aivants")
run(ssh, "rm -rf /var/www/aivants/dist")
run(ssh, "cp -r /var/www/backendbots/dist /var/www/aivants/")

# 4. Write the correct Nginx config
print("Step 4: Writing correct Nginx config...")
sftp = ssh.open_sftp()
with sftp.file('/etc/nginx/sites-available/aivants', 'w') as f:
    f.write(NGINX_CONFIG)
sftp.close()
run(ssh, "ln -sf /etc/nginx/sites-available/aivants /etc/nginx/sites-enabled/aivants")

# 5. Fix permissions for the web root
print("Step 5: Fixing permissions for /var/www/aivants...")
run(ssh, "chown -R www-data:www-data /var/www/aivants")
run(ssh, "find /var/www/aivants -type d -exec chmod 755 {} \;")
run(ssh, "find /var/www/aivants -type f -exec chmod 644 {} \;")

# 6. Reload Nginx
print("Step 6: Testing and reloading Nginx...")
out_t = run(ssh, "nginx -t 2>&1")
print(f"nginx -t: {out_t}")
if "test is successful" in out_t:
    run(ssh, "systemctl reload nginx")
    print("Nginx reloaded successfully!")
else:
    print(f"Error in Nginx config: {out_t}")

# 7. Check PM2 status
print("\nFinal PM2 Status:")
print(run(ssh, "pm2 list --no-color"))

# 8. Check if index.html actually exists in the target dir
index_check = run(ssh, "ls -la /var/www/aivants/dist/index.html")
print(f"Index.html check: {index_check}")

ssh.close()
print("\nRestoration process completed.")
