"""
AuraBook — Legacy Data Migration Script
========================================
Di chuyển data từ legacy SQLite (apps/api) → Saleor PostgreSQL

Sử dụng:
  python infra/scripts/migrate_legacy_to_saleor.py

Yêu cầu:
  - Saleor backend đang chạy: http://localhost:8000/graphql/
  - Admin token (lấy từ Saleor Dashboard)
  - ADMIN_TOKEN=<token> python migrate_legacy_to_saleor.py
"""

import os
import json
import sqlite3
import logging
import requests

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

SALEOR_API = os.environ.get("SALEOR_API_URL", "http://localhost:8000/graphql/")
ADMIN_TOKEN = os.environ.get("ADMIN_TOKEN", "")
SQLITE_PATH = os.environ.get("SQLITE_PATH", "legacy/api/aurabook.db")
CHANNEL_SLUG = "aurabook-vn"


def graphql(query: str, variables: dict = None) -> dict:
    resp = requests.post(
        SALEOR_API,
        json={"query": query, "variables": variables or {}},
        headers={"Authorization": f"Bearer {ADMIN_TOKEN}"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def migrate_books(conn: sqlite3.Connection) -> dict[int, str]:
    """Migrate books → Saleor Products. Returns mapping {legacy_id: saleor_product_id}"""
    logger.info("📚 Đang migrate sách...")
    books = conn.execute("SELECT * FROM books").fetchall()
    cols = [d[0] for d in conn.execute("SELECT * FROM books LIMIT 0").description]

    id_map = {}
    CREATE_PRODUCT = """
    mutation CreateProduct($input: ProductCreateInput!) {
        productCreate(input: $input) {
            product { id slug }
            errors { field message }
        }
    }
    """

    # Lấy product type ID (cần tạo "Book" type trước)
    PT_QUERY = """query { productTypes(first: 10) { edges { node { id name } } } }"""
    pt_data = graphql(PT_QUERY)
    book_type_id = None
    for edge in pt_data.get("data", {}).get("productTypes", {}).get("edges", []):
        if "book" in edge["node"]["name"].lower():
            book_type_id = edge["node"]["id"]
            break

    if not book_type_id:
        logger.error("❌ Không tìm thấy ProductType 'Book' trong Saleor. Tạo trước đã.")
        return {}

    for row in books:
        book = dict(zip(cols, row))
        try:
            result = graphql(CREATE_PRODUCT, {
                "input": {
                    "name": book.get("title", ""),
                    "slug": book.get("slug", ""),
                    "description": json.dumps({"blocks": [{"type": "paragraph", "data": {"text": book.get("description", "")}}]}),
                    "productType": book_type_id,
                    "category": None,
                }
            })
            errors = result.get("data", {}).get("productCreate", {}).get("errors", [])
            if errors:
                logger.warning("Lỗi tạo sách '%s': %s", book.get("title"), errors)
                continue
            saleor_id = result["data"]["productCreate"]["product"]["id"]
            id_map[book["id"]] = saleor_id
            logger.info("✅ Migrated: '%s' → %s", book.get("title"), saleor_id)
        except Exception as exc:
            logger.error("Lỗi sách '%s': %s", book.get("title"), exc)

    logger.info("📚 Migrated %d/%d sách", len(id_map), len(books))
    return id_map


def migrate_users(conn: sqlite3.Connection) -> dict[int, str]:
    """Migrate users → Saleor Customers."""
    logger.info("👥 Đang migrate users...")
    users = conn.execute("SELECT * FROM users").fetchall()
    cols = [d[0] for d in conn.execute("SELECT * FROM users LIMIT 0").description]

    id_map = {}
    CREATE_CUSTOMER = """
    mutation CreateCustomer($input: UserCreateInput!) {
        customerCreate(input: $input) {
            user { id email }
            errors { field message }
        }
    }
    """

    for row in users:
        user = dict(zip(cols, row))
        try:
            result = graphql(CREATE_CUSTOMER, {
                "input": {
                    "email": user.get("email", ""),
                    "firstName": user.get("full_name", "").split(" ")[0] if user.get("full_name") else "",
                    "lastName": " ".join(user.get("full_name", "").split(" ")[1:]) if user.get("full_name") else "",
                    "isActive": True,
                    "isStaff": bool(user.get("is_admin", False)),
                }
            })
            errors = result.get("data", {}).get("customerCreate", {}).get("errors", [])
            if errors:
                logger.warning("Lỗi tạo user '%s': %s", user.get("email"), errors)
                continue
            saleor_id = result["data"]["customerCreate"]["user"]["id"]
            id_map[user["id"]] = saleor_id
            logger.info("✅ Migrated: '%s' → %s", user.get("email"), saleor_id)
        except Exception as exc:
            logger.error("Lỗi user '%s': %s", user.get("email"), exc)

    logger.info("👥 Migrated %d/%d users", len(id_map), len(users))
    return id_map


def main():
    if not ADMIN_TOKEN:
        logger.error("❌ ADMIN_TOKEN chưa được set. Export ADMIN_TOKEN=<token> trước.")
        return

    if not os.path.exists(SQLITE_PATH):
        logger.error("❌ SQLite DB không tìm thấy: %s", SQLITE_PATH)
        return

    logger.info("🚀 Bắt đầu migration từ %s → %s", SQLITE_PATH, SALEOR_API)
    conn = sqlite3.connect(SQLITE_PATH)

    try:
        book_map = migrate_books(conn)
        user_map = migrate_users(conn)
        # Orders migration (TODO: Phase M5)
        logger.info("✅ Migration hoàn thành! Books: %d, Users: %d", len(book_map), len(user_map))
        logger.info("⚠️  Orders migration sẽ được thực hiện trong Phase M5 (cutover).")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
