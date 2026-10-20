import os
import sys
import json
from decimal import Decimal
from datetime import datetime, timezone

# 1. Fast Django setup
sys.path.insert(0, "/app")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")

# Pre-generate static RSA key to avoid 20s delay
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization

key = rsa.generate_private_key(public_exponent=65537, key_size=1024)
pem = key.private_bytes(
    encoding=serialization.Encoding.PEM,
    format=serialization.PrivateFormat.PKCS8,
    encryption_algorithm=serialization.NoEncryption()
).decode()
os.environ["RSA_PRIVATE_KEY"] = pem

import django
django.setup()

from django.utils.text import slugify
from saleor.product.models import (
    Product, ProductType, Category, ProductVariant,
    ProductChannelListing, ProductVariantChannelListing,
    ProductMedia, Collection, CollectionProduct
)
from saleor.channel.models import Channel
from saleor.warehouse.models import Warehouse, Stock
from saleor.menu.models import Menu, MenuItem

def build_editorjs_description(paragraphs):
    blocks = []
    for i, p in enumerate(paragraphs):
        blocks.append({
            "id": f"block_{i}",
            "type": "paragraph",
            "data": {"text": p}
        })
    return {
        "time": int(datetime.now().timestamp() * 1000),
        "blocks": blocks,
        "version": "2.30.7"
    }

def main():
    print("=" * 70)
    print("📚 AURABOOK - BẮT ĐẦU CẬP NHẬT DANH MỤC VÀ SÁCH THẬT")
    print("=" * 70)

    # 1. Channels
    channel_vnd = Channel.objects.filter(slug="channel-vnd").first()
    channel_usd = Channel.objects.filter(slug="default-channel").first()
    if not channel_vnd:
        print("❌ Lỗi: Không tìm thấy channel-vnd")
        sys.exit(1)
    print(f"✅ Channels: {channel_vnd.name} (VND), {channel_usd.name if channel_usd else 'None'} (USD)")

    # 2. Warehouse
    warehouse = Warehouse.objects.filter(slug="kho-tong-aurabook-ha-noi").first()
    if not warehouse:
        warehouse = Warehouse.objects.first()
    print(f"✅ Kho hàng: {warehouse.name}")

    # 3. ProductType for Books
    book_pt, pt_created = ProductType.objects.get_or_create(
        slug="books",
        defaults={
            "name": "Sách Tuyển Chọn (Books)",
            "has_variants": True,
            "is_shipping_required": True,
            "weight": 0.5
        }
    )
    book_pt.name = "Sách Tuyển Chọn (Books)"
    book_pt.has_variants = True
    book_pt.is_shipping_required = True
    book_pt.save()
    print(f"✅ ProductType: {book_pt.name} (has_variants=True, is_shipping_required=True)")

    # 4. Clean up old dummy products (keep only if already one of our 4 books)
    our_slugs = [
        "dac-nhan-tam",
        "bon-thoa-uoc",
        "sapiens-luoc-su-loai-nguoi",
        "tri-tue-do-thai"
    ]
    old_products = Product.objects.exclude(slug__in=our_slugs)
    old_count = old_products.count()
    old_products.delete()
    print(f"🧹 Đã dọn dẹp {old_count} sản phẩm mẫu cũ (quần áo, nước ngọt, giày dép...)")

    # 5. Clean up old categories
    Category.objects.all().delete()
    print("🧹 Đã dọn dẹp các danh mục cũ.")

    # 6. Create Thoughtful Book Categories (Cấu trúc danh mục sách chuyên nghiệp)
    categories_def = [
        {
            "name": "Sách Kỹ Năng - Phát Triển Bản Thân",
            "slug": "sach-ky-nang-phat-trien-ban-than",
            "seo_title": "Sách Kỹ Năng & Phát Triển Bản Thân Tuyển Chọn | AuraBook",
            "desc": "Cẩm nang nâng cao năng lực giao tiếp, lãnh đạo, quản trị cảm xúc và hoàn thiện bản thân mỗi ngày.",
            "children": [
                {
                    "name": "Nghệ Thuật Giao Tiếp & Ứng Xử",
                    "slug": "nghe-thuat-giao-tiep-ung-xu",
                    "desc": "Nghệ thuật thấu hiểu tâm lý, thu phục lòng người và xây dựng mối quan hệ chân thành, bền vững."
                },
                {
                    "name": "Quản Trị Tâm Trí & Thói Quen",
                    "slug": "quan-tri-tam-tri-thoi-quen",
                    "desc": "Xây dựng kỷ luật tự giác, rèn luyện tư duy tích cực và giải phóng năng lực tiềm ẩn."
                }
            ]
        },
        {
            "name": "Tư Duy - Trí Tuệ & Triết Lý Sống",
            "slug": "tu-duy-tri-tue-triet-ly-song",
            "seo_title": "Tư Duy, Trí Tuệ & Triết Lý Sống Đỉnh Cao | AuraBook",
            "desc": "Những tác phẩm khai sáng tư duy, triết lý minh triết sống cổ xưa và phương pháp tư duy phi thường của các bậc danh nhân.",
            "children": [
                {
                    "name": "Minh Triết Sống & Khai Phóng",
                    "slug": "minh-triet-song-khai-phong",
                    "desc": "Nguyên tắc sống thông thái giúp giải phóng tâm trí, sống an nhiên và tự do tự tại."
                },
                {
                    "name": "Trí Tuệ Do Thái & Danh Nhân",
                    "slug": "tri-tue-do-thai-danh-nhan",
                    "desc": "Bí quyết phát triển trí tuệ, ghi nhớ thần tốc và nghệ thuật thành công của dân tộc Do Thái."
                }
            ]
        },
        {
            "name": "Lịch Sử - Khoa Học & Xã Hội",
            "slug": "lich-su-khoa-hoc-xa-hoi",
            "seo_title": "Lịch Sử, Khoa Học & Tri Thức Xã Hội | AuraBook",
            "desc": "Khám phá tiến trình vĩ đại của nền văn minh nhân loại, nguồn gốc giống loài và bức tranh tương lai.",
            "children": [
                {
                    "name": "Lược Sử Nhân Loại & Nền Văn Minh",
                    "slug": "luoc-su-nhan-loai-van-minh",
                    "desc": "Hành trình hàng vạn năm của loài người từ thuở hồng hoang tới kỷ nguyên hiện đại."
                },
                {
                    "name": "Khoa Học, Vũ Trụ & Tương Lai",
                    "slug": "khoa-hoc-vu-tru-tuong-lai",
                    "desc": "Bí ẩn thế giới tự nhiên, bước nhảy vọt công nghệ và dự báo tương lai loài người."
                }
            ]
        },
        {
            "name": "Kinh Doanh - Khởi Nghiệp & Đầu Tư",
            "slug": "kinh-doanh-khoi-nghiep-dau-tu",
            "seo_title": "Sách Kinh Doanh, Khởi Nghiệp & Tài Chính Thông Minh | AuraBook",
            "desc": "Kiến thức quản trị doanh nghiệp thực chiến, chiến lược đột phá và phương pháp đầu tư tài chính thông minh.",
            "children": [
                {
                    "name": "Quản Trị Doanh Nghiệp & Lãnh Đạo",
                    "slug": "quan-tri-doanh-nghiep-lanh-dao",
                    "desc": "Nghệ thuật xây dựng đội ngũ, vận hành tinh gọn và truyền cảm hứng."
                },
                {
                    "name": "Tài Chính Cá Nhân & Đầu Tư",
                    "slug": "tai-chinh-ca-nhan-dau-tu",
                    "desc": "Xây dựng tư duy thịnh vượng, tự do tài chính và đầu tư bền vững."
                }
            ]
        },
        {
            "name": "Văn Học & Tiểu Thuyết Tuyển Chọn",
            "slug": "van-hoc-tieu-thuyet-tuyen-chon",
            "seo_title": "Văn Học & Tiểu Thuyết Kinh Điển Nuôi Dưỡng Tâm Hồn | AuraBook",
            "desc": "Những tuyệt tác văn học kinh điển trong nước và thế giới lay động trái tim triệu độc giả.",
            "children": [
                {
                    "name": "Văn Học Kinh Điển Thế Giới",
                    "slug": "van-hoc-kinh-dien-the-gioi",
                    "desc": "Tác phẩm văn chương bất hủ vượt thời gian của các đại văn hào."
                },
                {
                    "name": "Truyện Ngắn & Tản Văn Cảm Xúc",
                    "slug": "truyen-ngan-tan-van-cam-xuc",
                    "desc": "Những trang viết sâu lắng, nhẹ nhàng về tình yêu, cuộc sống và con người."
                }
            ]
        }
    ]

    cat_map = {}
    for c_def in categories_def:
        parent_cat = Category.objects.create(
            name=c_def["name"],
            slug=c_def["slug"],
            seo_title=c_def.get("seo_title", c_def["name"])[:70],
            seo_description=c_def["desc"][:300],
            description_plaintext=c_def["desc"],
            description=build_editorjs_description([c_def["desc"]])
        )
        cat_map[c_def["slug"]] = parent_cat
        print(f"📁 Danh mục cha: {parent_cat.name} (slug={parent_cat.slug})")

        for sub_def in c_def.get("children", []):
            child_cat = Category.objects.create(
                name=sub_def["name"],
                slug=sub_def["slug"],
                parent=parent_cat,
                seo_title=f"{sub_def['name']} | AuraBook"[:70],
                seo_description=sub_def["desc"][:300],
                description_plaintext=sub_def["desc"],
                description=build_editorjs_description([sub_def["desc"]])
            )
            cat_map[sub_def["slug"]] = child_cat
            print(f"   └── 📂 Danh mục con: {child_cat.name} (slug={child_cat.slug})")

    # 7. Update Navbar Menu
    navbar_menu = Menu.objects.filter(slug="navbar").first()
    if navbar_menu:
        navbar_menu.items.all().delete()
        for idx, c_def in enumerate(categories_def):
            cat_obj = cat_map[c_def["slug"]]
            MenuItem.objects.create(
                name=cat_obj.name,
                menu=navbar_menu,
                category=cat_obj,
                sort_order=idx
            )
        print("✅ Đã cập nhật Navbar Menu với các danh mục sách mới!")

    # 8. Define the 4 Real Books with Ebook and Physical Book variants
    books_data = [
        {
            "name": "Đắc Nhân Tâm (How to Win Friends and Influence People)",
            "slug": "dac-nhan-tam",
            "author": "Dale Carnegie",
            "category_slug": "nghe-thuat-giao-tiep-ung-xu",
            "cover_image": "products/book-dac-nhan-tam-cover.jpg",
            "epub_filename": "dac-nhan-tam.epub",
            "paragraphs": [
                "Đắc Nhân Tâm (How to Win Friends and Influence People) của Dale Carnegie là cuốn sách nổi tiếng nhất, có tầm ảnh hưởng lớn nhất mọi thời đại về nghệ thuật đối nhân xử thế và giao tiếp.",
                "Tác phẩm đem lại những nguyên tắc vàng đã được thử thách qua thời gian, giúp bạn thấu hiểu tâm lý con người, xây dựng sự tin cậy, cảm hóa người khác bằng sự chân thành và giải quyết các mâu thuẫn một cách khéo léo.",
                "Dù trong công việc hay đời sống thường ngày, đây là cẩm nang gối đầu giường không thể thiếu cho bất kỳ ai muốn vươn tới thành công và hạnh phúc trọn vẹn."
            ],
            "ebook": {
                "sku": "EB-DAC-NHAN-TAM",
                "price_vnd": Decimal("59000"),
                "price_usd": Decimal("2.99"),
            },
            "physical": {
                "sku": "VT-DAC-NHAN-TAM",
                "name": "Bản Sách Giấy (Bìa Mềm Tuyển Chọn)",
                "weight": 0.45,
                "stock": 150,
                "price_vnd": Decimal("118000"),
                "price_usd": Decimal("5.99"),
            }
        },
        {
            "name": "Bốn Thỏa Ước (The Four Agreements)",
            "slug": "bon-thoa-uoc",
            "author": "Don Miguel Ruiz",
            "category_slug": "minh-triet-song-khai-phong",
            "cover_image": "products/book-bon-thoa-uoc-cover.jpg",
            "epub_filename": "bon-thoa-uoc.epub",
            "paragraphs": [
                "Bốn Thỏa Ước (The Four Agreements) của Don Miguel Ruiz tiết lộ những minh triết cổ xưa của người Toltec nhằm giúp chúng ta tự giải thoát khỏi những niềm tin giới hạn, nỗi sợ hãi và những đau khổ không đáng có.",
                "Bốn nguyên tắc thông thái bao gồm: 1. Không phạm tội với lời nói; 2. Không biến mọi chuyện thành vấn đề cá nhân; 3. Không giả định; 4. Luôn làm hết khả năng của mình.",
                "Một cuốn sách ngắn gọn nhưng có sức mạnh chuyển hóa nội tâm sâu sắc, đem lại sự thanh thản, tự do và niềm vui sống đích thực."
            ],
            "ebook": {
                "sku": "EB-BON-THOA-UOC",
                "price_vnd": Decimal("49000"),
                "price_usd": Decimal("2.49"),
            },
            "physical": {
                "sku": "VT-BON-THOA-UOC",
                "name": "Bản Sách Giấy (Bìa Mềm Tuyển Chọn)",
                "weight": 0.35,
                "stock": 120,
                "price_vnd": Decimal("98000"),
                "price_usd": Decimal("4.99"),
            }
        },
        {
            "name": "Sapiens: Lược Sử Loài Người (A Brief History of Humankind)",
            "slug": "sapiens-luoc-su-loai-nguoi",
            "author": "Yuval Noah Harari",
            "category_slug": "luoc-su-nhan-loai-van-minh",
            "cover_image": "products/book-sapiens-luoc-su-loai-nguoi-cover.jpeg",
            "epub_filename": "sapiens-luoc-su-loai-nguoi.epub",
            "paragraphs": [
                "Sapiens: Lược Sử Loài Người của giáo sư lịch sử Yuval Noah Harari là hiện tượng xuất bản toàn cầu, giải mã lịch sử vĩ đại của loài người từ thời kỳ đồ đá cho đến hiện đại.",
                "Cuốn sách phân tích sâu sắc ba cuộc cách mạng định hình vận mệnh: Cách mạng Nhận thức (khởi đầu lịch sử), Cách mạng Nông nghiệp (mở rộng xã hội) và Cách mạng Khoa học (kiến tạo sức mạnh chưa từng có).",
                "Một tác phẩm kinh điển mở rộng tầm nhìn, kích thích tư duy phản biện và giúp chúng ta hiểu rõ loài người là ai, từ đâu đến và đang đi về đâu."
            ],
            "ebook": {
                "sku": "EB-SAPIENS",
                "price_vnd": Decimal("89000"),
                "price_usd": Decimal("4.49"),
            },
            "physical": {
                "sku": "VT-SAPIENS",
                "name": "Bản Sách Giấy (Bìa Cứng Tuyển Chọn)",
                "weight": 0.75,
                "stock": 200,
                "price_vnd": Decimal("189000"),
                "price_usd": Decimal("9.49"),
            }
        },
        {
            "name": "Trí Tuệ Do Thái (Jerome Becomes a Genius)",
            "slug": "tri-tue-do-thai",
            "author": "Eran Katz",
            "category_slug": "tri-tue-do-thai-danh-nhan",
            "cover_image": "products/book-tri-tue-do-thai-cover.jpeg",
            "epub_filename": "tri-tue-do-thai.epub",
            "paragraphs": [
                "Trí Tuệ Do Thái của kỷ lục gia trí nhớ Eran Katz hé mở những bí quyết tư duy độc đáo, phương pháp ghi nhớ phi thường và tinh thần học hỏi trọn đời của dân tộc thông minh nhất thế giới.",
                "Thông qua hành trình biến chàng trai bình thường Jerome thành một thiên tài, cuốn sách cung cấp các nguyên tắc thực tế để tối ưu hóa não bộ, rèn luyện tư duy logic, sáng tạo và mở khóa tiềm năng vượt trội.",
                "Tác phẩm truyền cảm hứng mãnh liệt về ý chí vươn lên, lòng hiếu học và nghệ thuật làm chủ tri thức."
            ],
            "ebook": {
                "sku": "EB-TRI-TUE-DO-THAI",
                "price_vnd": Decimal("69000"),
                "price_usd": Decimal("3.49"),
            },
            "physical": {
                "sku": "VT-TRI-TUE-DO-THAI",
                "name": "Bản Sách Giấy (Bìa Mềm Tuyển Chọn)",
                "weight": 0.50,
                "stock": 140,
                "price_vnd": Decimal("135000"),
                "price_usd": Decimal("6.79"),
            }
        }
    ]

    featured_coll = Collection.objects.filter(slug="featured-products").first()
    if featured_coll:
        featured_coll.products.clear()

    now = datetime.now(timezone.utc)

    for b in books_data:
        cat = cat_map.get(b["category_slug"])
        desc_json = build_editorjs_description(b["paragraphs"])
        desc_plain = " ".join(b["paragraphs"])

        seo_t = f"{b['name']} | AuraBook"[:70]
        seo_d = b["paragraphs"][0][:300]

        prod, created = Product.objects.get_or_create(
            slug=b["slug"],
            defaults={
                "name": b["name"],
                "product_type": book_pt,
                "category": cat,
                "description": desc_json,
                "description_plaintext": desc_plain,
                "seo_title": seo_t,
                "seo_description": seo_d,
                "metadata": {
                    "author": b["author"],
                    "book_format": "Both Ebook and Physical Available",
                    "epub_file": f"ebooks/{b['epub_filename']}"
                }
            }
        )
        prod.name = b["name"]
        prod.product_type = book_pt
        prod.category = cat
        prod.description = desc_json
        prod.description_plaintext = desc_plain
        prod.seo_title = seo_t
        prod.seo_description = seo_d
        prod.metadata = {
            "author": b["author"],
            "book_format": "Both Ebook and Physical Available",
            "epub_file": f"ebooks/{b['epub_filename']}"
        }
        prod.save()
        print(f"\n📖 Sách: {prod.name}")

        # Channel listings for product
        for ch, curr in [(channel_vnd, "VND"), (channel_usd, "USD")]:
            if not ch:
                continue
            pcl, _ = ProductChannelListing.objects.get_or_create(
                product=prod,
                channel=ch,
                defaults={
                    "is_published": True,
                    "published_at": now,
                    "visible_in_listings": True,
                    "available_for_purchase_at": now,
                    "currency": curr,
                    "discounted_price_amount": b["physical"]["price_vnd"] if curr == "VND" else b["physical"]["price_usd"]
                }
            )
            pcl.is_published = True
            pcl.visible_in_listings = True
            pcl.available_for_purchase_at = now
            pcl.currency = curr
            pcl.discounted_price_amount = b["physical"]["price_vnd"] if curr == "VND" else b["physical"]["price_usd"]
            pcl.save()

        # Cover Media
        ProductMedia.objects.filter(product=prod).delete()
        ProductMedia.objects.create(
            product=prod,
            image=b["cover_image"],
            alt=f"Bìa sách {b['name']}",
            type="IMAGE",
            sort_order=0
        )
        print(f"   🖼️  Ảnh bìa: {b['cover_image']}")

        # Clear existing variants to avoid stale state
        ProductVariant.objects.filter(product=prod).delete()

        # Variant 1: BẢN EBOOK (Sách Điện Tử)
        eb_meta = {
            "format": "ebook",
            "format_display": "Bản Ebook (Sách Điện Tử)",
            "epub_path": f"/books/{b['epub_filename']}",
            "is_digital": True,
            "instant_delivery": True,
            "drm_protected": True
        }
        eb_var = ProductVariant.objects.create(
            product=prod,
            name="Bản Ebook (Sách Điện Tử)",
            sku=b["ebook"]["sku"],
            weight=0.0,
            track_inventory=False,
            metadata=eb_meta,
            sort_order=0
        )
        # Ebook prices
        for ch, curr, pr in [
            (channel_vnd, "VND", b["ebook"]["price_vnd"]),
            (channel_usd, "USD", b["ebook"]["price_usd"])
        ]:
            if not ch:
                continue
            ProductVariantChannelListing.objects.update_or_create(
                variant=eb_var,
                channel=ch,
                defaults={
                    "currency": curr,
                    "price_amount": pr,
                    "cost_price_amount": pr * Decimal("0.3")
                }
            )
        print(f"   📱 Phân loại 1: {eb_var.name} | SKU: {eb_var.sku} | Giá: {b['ebook']['price_vnd']:,}₫ / ${b['ebook']['price_usd']}")

        # Variant 2: BẢN VẬT LÝ (Sách Giấy In)
        vt_meta = {
            "format": "physical",
            "format_display": b["physical"]["name"],
            "is_digital": False,
            "shipping_required": True,
            "cover_type": "Paperback"
        }
        vt_var = ProductVariant.objects.create(
            product=prod,
            name=b["physical"]["name"],
            sku=b["physical"]["sku"],
            weight=b["physical"]["weight"],
            track_inventory=True,
            metadata=vt_meta,
            sort_order=1
        )
        # Physical book prices
        for ch, curr, pr in [
            (channel_vnd, "VND", b["physical"]["price_vnd"]),
            (channel_usd, "USD", b["physical"]["price_usd"])
        ]:
            if not ch:
                continue
            ProductVariantChannelListing.objects.update_or_create(
                variant=vt_var,
                channel=ch,
                defaults={
                    "currency": curr,
                    "price_amount": pr,
                    "cost_price_amount": pr * Decimal("0.6")
                }
            )
        # Physical book stock
        if warehouse:
            Stock.objects.create(
                warehouse=warehouse,
                product_variant=vt_var,
                quantity=b["physical"]["stock"],
                quantity_allocated=0
            )
        print(f"   📦 Phân loại 2: {vt_var.name} | SKU: {vt_var.sku} | Tồn kho: {b['physical']['stock']} | Giá: {b['physical']['price_vnd']:,}₫ / ${b['physical']['price_usd']}")

        # Set default variant
        prod.default_variant = vt_var
        prod.save()

        # Add to collection
        if featured_coll:
            CollectionProduct.objects.create(
                collection=featured_coll,
                product=prod,
                sort_order=len(featured_coll.products.all())
            )

    print("\n" + "=" * 70)
    print("🎉 HOÀN TẤT THIẾT LẬP DANH MỤC & SẢN PHẨM SÁCH THẬT CHO AURABOOK!")
    print(f"• Tổng số sách thật: {len(books_data)} cuốn sách")
    print(f"• Mỗi cuốn sách đều có đầy đủ 2 phân loại: Bản Ebook và Bản Sách Giấy vật lý")
    print(f"• Cây danh mục 5 nhánh chuẩn nhà sách chính quy đã được tạo thành công")
    print("=" * 70)

if __name__ == "__main__":
    main()
if __name__ == "__main__":
    main()
