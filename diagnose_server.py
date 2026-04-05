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

results["sites_enabled"] = run("ls -la /etc/nginx/sites-enabled/")[0]
results["aivants_config"] = run("cat /etc/nginx/sites-available/aivants")[0]
results["error_log"] = run("tail -n 20 /var/log/nginx/error.log")[0]
results["dist_check"] = run("ls -la /var/www/aivants/dist/")[0]
results["root_check"] = run("ls -la /var/www/aivants/")[0]
results["school_mgmt_check"] = run("ls -la /etc/nginx/sites-available/school-mgmt.conf")[0]

with open("diag_output.txt", "w") as f:
    for key, value in results.items():
        f.write(f"=== {key} ===\n{value}\n\n")

ssh.close()
