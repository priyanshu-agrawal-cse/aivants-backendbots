import subprocess, sys

HOST = "194.164.150.247"
USER = "root"
PASS = "Mx8afe-LMHU1t4J"

def run(ssh, cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=20)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    return out, err

try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)
print("Connected!")

# 1. Find where index.html actually is
out, _ = run(ssh, "find /var/www/aivants -name index.html")
print("--- INDEX.HTML LOCATIONS ---")
print(out)

# 2. Check Nginx user
out, _ = run(ssh, "grep '^user' /etc/nginx/nginx.conf")
print("--- NGINX USER ---")
print(out)

# 3. Check permissions of the path
out, _ = run(ssh, "namei -om /var/www/aivants/dist/index.html")
print("--- PATH PERMISSIONS ---")
print(out)

# 4. Check if we need to rebuild
# If index.html is missing, maybe we need to run npm run build?
# The user said they messed up Nginx, not the files, but let's check.

# 5. Fix permissions again just in case
print("Fixing permissions for www-data...")
run(ssh, "chown -R www-data:www-data /var/www/aivants")
run(ssh, "chmod -R 755 /var/www/aivants")

# 6. Ensure the config is correct (restoring from bak if needed)
# I already did this, but let's make sure it's the right one.
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

print("\nWriting Nginx config...")
sftp = ssh.open_sftp()
with sftp.file('/etc/nginx/sites-available/aivants', 'w') as f:
    f.write(NGINX_CONFIG)
sftp.close()

# Ensure ONLY aivants is enabled
run(ssh, "rm -f /etc/nginx/sites-enabled/default")
run(ssh, "rm -f /etc/nginx/sites-enabled/school-mgmt.conf")
run(ssh, "ln -sf /etc/nginx/sites-available/aivants /etc/nginx/sites-enabled/aivants")

# Test and reload
out, err = run(ssh, "nginx -t 2>&1")
print("nginx -t:", out, err)
run(ssh, "systemctl reload nginx")

ssh.close()
print("Done!")
