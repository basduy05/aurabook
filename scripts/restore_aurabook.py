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
        print(f"Lỗi thực thi lệnh: {cmd}\n{res.stderr.strip()}")
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
    print("   AURABOOK — KHÔI PHỤC DỮ LIỆU TỪ BẢN SAO LƯU")
    print("=" * 60)
    print(f"Nguồn sao lưu: {backup_path}\n")

    if not os.path.exists(sql_file) and not os.path.exists(dump_file):
        print(f"❌ Không tìm thấy file dữ liệu (aurabook_db.sql hoặc .dump) tại: {backup_path}")
        sys.exit(1)

    # 1. Kiểm tra container
    print("[1/4] Kiểm tra PostgreSQL container...")
    check = run_cmd("docker ps --filter \"name=aurabook-postgres\" --format \"{{.Names}}\"", check=False)
    if not check.stdout.strip():
        print("❌ Container aurabook-postgres không chạy. Hãy khởi động hệ thống trước!")
        sys.exit(1)
    print("  ✅ PostgreSQL container đang hoạt động.")

    # 2. Reset database & nạp dữ liệu
    print("\n[2/4] Khôi phục cơ sở dữ liệu PostgreSQL...")
    reset_sql = (
        "SELECT pg_terminate_backend(pid) FROM pg_stat_activity "
        "WHERE datname = 'aurabook_db' AND pid <> pg_backend_pid(); "
        "DROP DATABASE IF EXISTS aurabook_db; "
        "CREATE DATABASE aurabook_db OWNER aurabook_user;"
    )
    p = subprocess.Popen("docker exec -i aurabook-postgres psql -U aurabook_user -d postgres",
                         stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True, text=True)
    p.communicate(input=reset_sql)

    # Nạp dữ liệu
    if os.path.exists(sql_file):
        print("  -> Đang khôi phục từ aurabook_db.sql...")
        with open(sql_file, "r", encoding="utf-8", errors="replace") as f:
            p_sql = subprocess.Popen("docker exec -i aurabook-postgres psql -U aurabook_user -d aurabook_db",
                                     stdin=f, stdout=subprocess.PIPE, stderr=subprocess.PIPE, shell=True)
            p_sql.communicate()
    elif os.path.exists(dump_file):
        print("  -> Đang khôi phục từ aurabook_db.dump...")
        run_cmd(f'docker cp "{dump_file}" aurabook-postgres:/tmp/restore.dump')
        run_cmd('docker exec aurabook-postgres pg_restore -U aurabook_user -d aurabook_db /tmp/restore.dump', check=False)
        run_cmd('docker exec aurabook-postgres rm -f /tmp/restore.dump')

    print("  ✅ Cơ sở dữ liệu đã được nạp thành công.")

    # 3. Khôi phục Media
    print("\n[3/4] Khôi phục media files...")
    media_dir = os.path.join(backup_path, "media")
    if os.path.exists(media_dir) and os.listdir(media_dir):
        run_cmd(f'docker cp "{media_dir}/." aurabook-backend:/app/media/', check=False)
        print("  ✅ Đã đồng bộ media vào backend.")
    else:
        print("  ℹ️ Không có thư mục media cần phục hồi.")

    # 4. Khởi động lại backend & celery
    print("\n[4/4] Khởi động lại dịch vụ backend và celery...")
    run_cmd("docker restart aurabook-backend aurabook-celery", check=False)
    print("  ✅ Backend & Celery đã khởi động lại hoàn tất.")

    print("\n" + "=" * 60)
    print("   🎉 KHÔI PHỤC HOÀN TẤT!")
    print("=" * 60)
    print("Hệ thống đã trở lại trạng thái sao lưu nguyên bản.")
    print("Storefront: http://localhost:3000")
    print("Dashboard:  http://localhost:9000/dashboard/")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
