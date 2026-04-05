import subprocess, sys

HOST = "194.164.150.247"
USER = "root"
PASS = "Mx8afe-LMHU1t4J"

def run(ssh, cmd):
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
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

# 1. Check path permissions
print("\nChecking path permissions...")
out, _ = run(ssh, "namei -om /var/www/aivants/dist/index.html")
print(out)

# 2. Check Nginx Error Logs (CRITICAL)
print("\nRecent Nginx Error Logs:")
out, _ = run(ssh, "tail -n 20 /var/log/nginx/error.log")
print(out)

# 3. Check Nginx User
print("\nNginx User:")
out, _ = run(ssh, "ps aux | grep nginx | grep -v grep")
print(out)

# 4. Check if index.html exists
print("\nChecking index.html:")
out, _ = run(ssh, "ls -la /var/www/aivants/dist/index.html")
print(out)

# 5. Check enabled sites listing
print("\nSites Enabled:")
out, _ = run(ssh, "ls -l /etc/nginx/sites-enabled/")
print(out)

ssh.close()
