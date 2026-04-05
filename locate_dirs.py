import paramiko

HOST = "194.164.150.247"
USER = "root"
PASS = "Mx8afe-LMHU1t4J"

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect(HOST, username=USER, password=PASS, timeout=15)

def run(cmd):
    stdin, stdout, stderr = ssh.exec_command(cmd, timeout=30)
    return stdout.read().decode().strip(), stderr.read().decode().strip()

results = {}
results["ls_var_www"] = run("ls -laR /var/www")[0]
results["ls_root"] = run("ls -la /root")[0]
results["aivants_dir"] = run("find /root -maxdepth 2 -name aivants")[0]
results["package_jsons"] = run("find / -name package.json -maxdepth 4 2>/dev/null")[0]

with open("server_dirs.txt", "w") as f:
    for key, value in results.items():
        f.write(f"=== {key} ===\n{value}\n\n")

ssh.close()
