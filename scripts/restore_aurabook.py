import os
import sys
import subprocess
import shutil

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    sys.stderr.reconfigure(encoding='utf-8', errors='replace')

def run_cmd(cmd, check=True):
    res = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if check and res.returncode != 0:
        print(f"Loi thuc thi lenh: {cmd}\n{res.stderr.strip()}")
        sys.exit(1)
    return res

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    backups_dir = os.path.join(root_dir, "backups")
    latest_dir = os.path.join(backups_dir, "latest")

    backup_path = sys.argv[1] if len(sys.argv) > 1 else latest_dir
    if not os.path.isabs(backup_path):
        backup_path = os.path.join(root_dir, backup_path)

    sql_file = os.path.join(backup_path, "aurabook_db.sql")
    dump_file = os.path.join(backup_path, "aurabook_db.dump")

    print("=" * 60)
    print("   AURABOOK - KHOI PHUC DU LIEU TU BAN SAO LUU")
    print("=" * 60)
    print(f"Nguon sao luu: {backup_path}\n")

    if not os.path.exists(sql_file) and not os.path.exists(dump_file):
        print(f"[!] Khong tim thay file du lieu (aurabook_db.sql hoac .dump) tai: {backup_path}")
        sys.exit(1)

    # 1. Kiem tra container
    print("[1/5] Kiem tra PostgreSQL container...")
    check = run_cmd("docker ps --filter \"name=aurabook-postgres\" --format \"{{.Names}}\"", check=False)
    if not check.stdout.strip():
        print("[!] Container aurabook-postgres khong chay. Hay khoi dong he thong truoc!")
        sys.exit(1)
    print("  [OK] PostgreSQL container dang hoat dong.")

    # 2. Reset database & nap du lieu
    print("\n[2/5] Khoi phuc co so du lieu PostgreSQL...")
    reset_sql = (
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
        "WHERE datname = 'aurabook_db' AND pid <> pg_backend_pid(); "
        "DROP DATABASE IF EXISTS aurabook_db; "
        "CREATE DATABASE aurabook_db OWNER aurabook_user;"
    )
    p = subprocess.Popen("docker exec -i aurabook-postgres psql -U aurabook_user -d postgres",
                         stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, text=True)
    p.communicate(input=reset_sql)

    # Nap du lieu
    if os.path.exists(sql_file):
        print("  -> Dang khoi phuc tu aurabook_db.sql...")
        with open(sql_file, "r", encoding="utf-8", errors="replace") as f:
            p_sql = subprocess.Popen("docker exec -i aurabook-postgres psql -U aurabook_user -d aurabook_db",
                                     stdin=f, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
            p_sql.communicate()
    elif os.path.exists(dump_file):
        print("  -> Dang khoi phuc tu aurabook_db.dump...")
        run_cmd(f'docker cp "{dump_file}" aurabook-postgres:/tmp/restore.dump')
        run_cmd('docker exec aurabook-postgres pg_restore -U aurabook_user -d aurabook_db /tmp/restore.dump', check=False)
        run_cmd('docker exec aurabook-postgres rm -f /tmp/restore.dump')

    print("  [OK] Co so du lieu da duoc nap thanh cong.")

    # 3. Khoi phuc Media
    print("\n[3/5] Khoi phuc media files...")
    media_dir = os.path.join(backup_path, "media")
    if os.path.exists(media_dir) and os.listdir(media_dir):
        run_cmd(f'docker cp "{media_dir}/." aurabook-backend:/app/media/', check=False)
        print("  [OK] Da dong bo media vao backend.")
    else:
        print("  [OK] Khong co thu muc media can phuc hoi.")

    # 4. Khoi phuc Mailpit emails database
    print("\n[4/5] Khoi phuc Mailpit emails database...")
    mailpit_file = os.path.join(backup_path, "mailpit.db")
    if os.path.exists(mailpit_file):
        try:
            run_cmd(f'docker cp "{mailpit_file}" aurabook-mailpit:/data/mailpit.db', check=False)
            run_cmd('docker restart aurabook-mailpit', check=False)
            print("  [OK] Da khoi phuc Mailpit database.")
        except Exception as e:
            print(f"  [!] Bo qua khoi phuc Mailpit: {e}")
    else:
        print("  [OK] Khong co file mailpit.db can phuc hoi.")

    # 5. Khoi dong lai backend & celery
    print("\n[5/5] Khoi dong lai dich vu backend va celery...")
    run_cmd("docker restart aurabook-backend aurabook-celery", check=False)
    print("  [OK] Backend va Celery da khoi dong lai hoan tat.")

    print("\n" + "=" * 60)
    print("   KHOI PHUC HOAN TAT!")
    print("=" * 60)
    print("He thong da tro lai trang thai sao luu nguyen ban.")
    print("Storefront: http://localhost:3000")
    print("Dashboard:  http://localhost:9000/dashboard/")
    print("Mailpit:    http://localhost:8025")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
