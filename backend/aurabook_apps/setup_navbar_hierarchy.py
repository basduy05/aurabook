import os, django
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

# Fast RSA key generation for debug mode
key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
pem = key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption(),
).decode()
os.environ["RSA_PRIVATE_KEY"] = pem
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")

django.setup()

from django.utils import timezone
from saleor.channel.models import Channel
from saleor.product.models import Product, Category, Collection, CollectionChannelListing
from saleor.menu.models import Menu, MenuItem

print("🚀 Bắt đầu cập nhật Collections và Cấu trúc Menu Navbar...")

# 1. Lấy channels
channels = list(Channel.objects.all())
vnd_channel = Channel.objects.filter(slug="channel-vnd").first()
print(f"Channels khả dụng: {[c.slug for c in channels]}")

all_books = list(Product.objects.all())
print(f"Tìm thấy {len(all_books)} sản phẩm sách thực tế.")

# 2. Tạo Collection "Sách bán chạy" & "Sách mới phát hành"
collections_data = [
    {
        "name": "Sách bán chạy",
        "slug": "sach-ban-chay",
        "seo_title": "Sách Bán Chạy Nhất AuraBook",
        "seo_description": "Những đầu sách bán chạy nhất và được độc giả yêu thích nhất tại AuraBook.",
    },
    {
        "name": "Sách mới phát hành",
        "slug": "sach-moi-phat-hanh",
        "seo_title": "Sách Mới Phát Hành AuraBook",
        "seo_description": "Những tựa sách mới nhất vừa được phát hành trên hệ thống AuraBook.",
    },
]

created_collections = {}
for c_data in collections_data:
    col, created = Collection.objects.update_or_create(
        slug=c_data["slug"],
        defaults={
            "name": c_data["name"],
            "seo_title": c_data["seo_title"][:70],
            "seo_description": c_data["seo_description"],
        }
    )
    # Channel listings
    for ch in channels:
        CollectionChannelListing.objects.update_or_create(
            collection=col,
            channel=ch,
            defaults={
                "is_published": True,
                "published_at": timezone.now(),
            }
        )
    # Gán tất cả sách vào cả 2 collection này
    col.products.set(all_books)
    created_collections[c_data["slug"]] = col
    print(f"✅ Đã thiết lập Collection: {col.name} ({col.slug}) với {col.products.count()} sản phẩm.")

# 3. Cập nhật Menu "navbar"
# Xóa menu items cũ của navbar
navbar_menu = Menu.objects.filter(slug="navbar").first()
if not navbar_menu:
    navbar_menu = Menu.objects.create(name="Navbar", slug="navbar")

navbar_menu.items.all().delete()

# Mục 1: Sách bán chạy
item_bestseller = MenuItem.objects.create(
    menu=navbar_menu,
    name="Sách bán chạy",
    collection=created_collections["sach-ban-chay"],
    sort_order=0,
)

# Mục 2: Sách mới phát hành
item_new = MenuItem.objects.create(
    menu=navbar_menu,
    name="Sách mới phát hành",
    collection=created_collections["sach-moi-phat-hanh"],
    sort_order=1,
)

# Mục 3: Thể loại (Tab cha chứa toàn bộ các thể loại sách)
item_genres = MenuItem.objects.create(
    menu=navbar_menu,
    name="Thể loại",
    url="/products",
    sort_order=2,
)

# Thêm 5 danh mục gốc làm con của "Thể loại"
root_categories = Category.objects.filter(level=0).order_by("tree_id", "lft")
for cat_idx, cat in enumerate(root_categories):
    cat_item = MenuItem.objects.create(
        menu=navbar_menu,
        name=cat.name,
        category=cat,
        parent=item_genres,
        sort_order=cat_idx,
    )
    # Thêm các danh mục con của từng nhánh
    for sub_idx, subcat in enumerate(cat.get_children()):
        MenuItem.objects.create(
            menu=navbar_menu,
            name=subcat.name,
            category=subcat,
            parent=cat_item,
            sort_order=sub_idx,
        )

print("✅ Đã hoàn tất tái cấu trúc Menu Navbar!")
print(f"Tổng số MenuItems trong navbar: {navbar_menu.items.count()}")
for it in navbar_menu.items.filter(parent=None).order_by("sort_order"):
    print(f"  📌 [Tab chính] {it.name} (sort: {it.sort_order})")
    for child in it.children.all().order_by("sort_order"):
        print(f"     └── 📁 {child.name}")
        for sub in child.children.all().order_by("sort_order"):
            print(f"         └── 📄 {sub.name}")
