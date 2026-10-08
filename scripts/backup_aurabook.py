import os
import sys
import subprocess
import datetime
import shutil
import json

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
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    current_backup_dir = os.path.join(backups_dir, f"backup_{timestamp}")
    latest_dir = os.path.join(backups_dir, "latest")

    os.makedirs(current_backup_dir, exist_ok=True)
    os.makedirs(latest_dir, exist_ok=True)

    print("=" * 60)
    print("   AURABOOK — SAO LƯU TRẠNG THÁI CONTAINER & DỮ LIỆU")
    print("=" * 60)
    print(f"Thời gian: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Thư mục lưu: {current_backup_dir}\n")

    # 1. Kiểm tra container
    print("[1/4] Kiểm tra PostgreSQL container...")
    check = run_cmd("docker ps --filter \"name=aurabook-postgres\" --format \"{{.Names}}\"", check=False)
    if not check.stdout.strip():
        print("❌ Container aurabook-postgres không chạy. Hãy khởi động hệ thống trước!")
        sys.exit(1)
    print("  ✅ PostgreSQL container đang hoạt động.")

    # 2. Dump Database
    print("\n[2/4] Xuất dữ liệu Database (aurabook_db)...")
    sql_file = os.path.join(current_backup_dir, "aurabook_db.sql")
    dump_file = os.path.join(current_backup_dir, "aurabook_db.dump")

    # Plain SQL
    cmd_sql = f'docker exec aurabook-postgres pg_dump -U aurabook_user -d aurabook_db --format=plain --no-owner --no-acl > "{sql_file}"'
    subprocess.run(cmd_sql, shell=True, check=True)

    # Custom Dump
    run_cmd('docker exec aurabook-postgres pg_dump -U aurabook_user -d aurabook_db --format=custom -f /tmp/aurabook_db.dump')
    run_cmd(f'docker cp aurabook-postgres:/tmp/aurabook_db.dump "{dump_file}"')
    run_cmd('docker exec aurabook-postgres rm -f /tmp/aurabook_db.dump')

    size_mb = os.path.getsize(sql_file) / (1024 * 1024)
    print(f"  ✅ Đã xuất Database ({size_mb:.2f} MB).")

    # 3. Media files
    print("\n[3/4] Sao lưu thư mục media...")
    media_dir = os.path.join(current_backup_dir, "media")
    os.makedirs(media_dir, exist_ok=True)
    try:
        run_cmd(f'docker cp aurabook-backend:/app/media/. "{media_dir}"', check=False)
        print("  ✅ Đã sao lưu media.")
    except Exception as e:
        print(f"  ⚠️ Lưu media bỏ qua: {e}")

    # 4. Metadata
    print("\n[4/4] Lưu thông tin metadata...")
    prod_res = run_cmd('docker exec aurabook-postgres psql -U aurabook_user -d aurabook_db -t -A -c "SELECT count(*) FROM product_product;"', check=False)
    user_res = run_cmd('docker exec aurabook-postgres psql -U aurabook_user -d aurabook_db -t -A -c "SELECT count(*) FROM account_user;"', check=False)

    metadata = {
        "timestamp": timestamp,
        "date": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "database": "aurabook_db",
        "product_count": prod_res.stdout.strip(),
        "user_count": user_res.stdout.strip()
    }
    with open(os.path.join(current_backup_dir, "metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    # Copy to latest
    for item in os.listdir(current_backup_dir):
        s = os.path.join(current_backup_dir, item)
        d = os.path.join(latest_dir, item)
        if os.path.isdir(s):
            if os.path.exists(d):
                shutil.rmtree(d)
            shutil.copytree(s, d)
        else:
            shutil.copy2(s, d)

    print("\n" + "=" * 60)
    print("   🎉 SAO LƯU THÀNH CÔNG!")
    print("=" * 60)
    print(f"Số sản phẩm: {metadata['product_count']}")
    print(f"Số người dùng: {metadata['user_count']}")
    print(f"Thư mục lưu trữ: {current_backup_dir}")
    print(f"Bản sao lưu mới nhất (latest): {latest_dir}")
    print("\nĐể khôi phục trạng thái này bất kỳ lúc nào, chạy:")
    print("  python scripts/restore_aurabook.py")
    print("  hoặc nhấp đúp vào restore_data.bat")
    print("=" * 60 + "\n")

if __name__ == "__main__":
    main()
