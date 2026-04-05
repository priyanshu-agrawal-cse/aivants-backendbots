import subprocess, sys

HOST = "194.164.150.247"
USER = "root"
PASS = "Mx8afe-LMHU1t4J"

# Aivants Nginx Configuration
# No trailing slash on proxy_pass to preserve /api/ path
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
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    out = stdout.read().decode().strip()
    err = stderr.read().decode().strip()
    if err and "error" in err.lower():
        print(f"Warning/Error: {err}")
    return out

try:
    import paramiko
except ImportError:
    subprocess.check_call([sys.executable, "-m", "pip", "install", "paramiko"])
    import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)
print("Connected to VM!")

# 1. Cleanup Conflicts
print("Removing conflicting Nginx configurations...")
run(ssh, "rm -f /etc/nginx/sites-enabled/default")
run(ssh, "rm -f /etc/nginx/sites-enabled/school-mgmt.conf")
run(ssh, "rm -f /etc/nginx/sites-available/school-mgmt.conf")

# 2. Re-apply Aivants Config
print("Writing Aivants Nginx configuration...")
sftp = ssh.open_sftp()
with sftp.file('/etc/nginx/sites-available/aivants', 'w') as f:
    f.write(NGINX_CONFIG)
sftp.close()
run(ssh, "ln -sf /etc/nginx/sites-available/aivants /etc/nginx/sites-enabled/aivants")

# 3. Ensure Build Dir exists
print("Verifying build directory...")
build_check = run(ssh, "ls -la /var/www/aivants/dist/index.html 2>/dev/null")
if not build_check:
    print("WARNING: /var/www/aivants/dist/index.html NOT FOUND!")
    print("Listing /var/www/aivants contents:")
    print(run(ssh, "ls -R /var/www/aivants | head -n 50"))
else:
    print(f"Found index.html: {build_check}")

# 4. Fix Permissions
print("Applying permission fixes...")
run(ssh, "chown -R www-data:www-data /var/www/aivants")
run(ssh, "chmod -R 755 /var/www/aivants")

# 5. Reload Nginx
print("Testing Nginx configuration...")
test_out = run(ssh, "nginx -t 2>&1")
print(test_out)
if "test is successful" in test_out:
    print("Reloading Nginx...")
    run(ssh, "systemctl reload nginx")
    print("Reloaded!")
else:
    print("ABORTING: Nginx config test failed!")

# 6. PM2 Status
print("\nCurrent PM2 Status:")
print(run(ssh, "pm2 list --no-color"))

ssh.close()
print("\nAggressive fix completed.")
