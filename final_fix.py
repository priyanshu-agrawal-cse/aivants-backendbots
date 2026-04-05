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
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out, err

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

# 1. Write the correct Nginx config
print("Writing correct Nginx config to /etc/nginx/sites-available/aivants...")
sftp = ssh.open_sftp()
with sftp.file('/etc/nginx/sites-available/aivants', 'w') as f:
    f.write(NGINX_CONFIG)
sftp.close()

# 2. Cleanup sites-enabled to avoid conflicts (remove school-mgmt if exists)
print("Cleaning up sites-enabled...")
run(ssh, "rm -f /etc/nginx/sites-enabled/default")
run(ssh, "rm -f /etc/nginx/sites-enabled/school-mgmt.conf")
run(ssh, "ln -sf /etc/nginx/sites-available/aivants /etc/nginx/sites-enabled/aivants")

# 3. Fix permissions for the web root
print("Fixing permissions for /var/www/aivants/dist...")
run(ssh, "mkdir -p /var/www/aivants/dist")
run(ssh, "chown -R www-data:www-data /var/www/aivants")
run(ssh, "chmod -R 755 /var/www/aivants")

# 4. Reload Nginx
print("Testing and reloading Nginx...")
out_t, err_t = run(ssh, "nginx -t 2>&1")
print(f"nginx -t: {out_t}")
if "test is successful" in out_t:
    run(ssh, "systemctl reload nginx")
    print("Nginx reloaded successfully!")
else:
    print(f"Error in Nginx config: {out_t}")

# 5. Check PM2 status
print("Checking PM2 status...")
out_pm2, _ = run(ssh, "pm2 list --no-color")
print(f"PM2 Status:\n{out_pm2}")

# 6. Verify one more thing: Does index.html exist?
index_check, _ = run(ssh, "ls -la /var/www/aivants/dist/index.html")
print(f"Index.html check: {index_check}")

ssh.close()
print("All tasks completed.")
