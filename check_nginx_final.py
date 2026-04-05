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

# 1. Full check of Nginx configs
print("\n--- ALL ENABLED CONFIGS ---")
out, _ = run(ssh, "grep -r 'server_name' /etc/nginx/sites-enabled/")
print(out)

# 2. Check for default_server
print("\n--- SEARCHING FOR default_server ---")
out, _ = run(ssh, "grep -r 'default_server' /etc/nginx/sites-enabled/")
print(out)

# 3. Read Aivants config
print("\n--- AIVANTS CONFIG CONTENT ---")
out, _ = run(ssh, "cat /etc/nginx/sites-available/aivants")
print(out)

# 4. Verify file type of index.html
print("\n--- FILE TYPE CHECK ---")
out, _ = run(ssh, "file /var/www/aivants/dist/index.html")
print(out)

# 5. Check Nginx Error Log again
print("\n--- LAST 5 ERRORS ---")
out, _ = run(ssh, "tail -n 5 /var/log/nginx/error.log")
print(out)

ssh.close()
