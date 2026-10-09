import os
import django

from saleor.page.models import Page, PageType
from saleor.attribute import AttributeType
from saleor.attribute.models import Attribute, AttributeValue, AssignedPageAttributeValue
from saleor.channel.models import Channel

def seed_models():
    print("Starting Storefront Models & Pages setup...")

    page_types_data = [
        {
            "name": "Storefront — Policies",
            "slug": "storefront-policies",
            "attributes": [
                {"name": "Free shipping threshold", "slug": "free-shipping-threshold", "input_type": "NUMERIC"},
                {"name": "Returns window days", "slug": "returns-window-days", "input_type": "NUMERIC"},
            ],
            "pages": [
                {
                    "title": "Chính sách Cửa hàng (Toàn cầu)",
                    "slug": "storefront-policy",
                    "attrs": {
                        "free-shipping-threshold": "75",
                        "returns-window-days": "30",
                    }
                },
                {
                    "title": "Chính sách Cửa hàng (Kênh VND)",
                    "slug": "storefront-policy-channel-vnd",
                    "attrs": {
                        "free-shipping-threshold": "500000",
                        "returns-window-days": "30",
                    }
                }
            ]
        },
        {
            "name": "Storefront — Chrome",
            "slug": "storefront-chrome",
            "attributes": [
                {"name": "Announcement ID", "slug": "announcement-id", "input_type": "PLAIN_TEXT"},
                {"name": "Announcement message", "slug": "announcement-message", "input_type": "PLAIN_TEXT"},
                {"name": "Announcement href", "slug": "announcement-href", "input_type": "PLAIN_TEXT"},
                {"name": "Announcement link label", "slug": "announcement-link-label", "input_type": "PLAIN_TEXT"},
                {"name": "Announcement dismissible", "slug": "announcement-dismissible", "input_type": "BOOLEAN"},
                {"name": "Nav all products label", "slug": "nav-all-products-label", "input_type": "PLAIN_TEXT"},
                {"name": "Nav view all label", "slug": "nav-view-all-label", "input_type": "PLAIN_TEXT"},
            ],
            "pages": [
                {
                    "title": "Giao diện Thanh thông báo & Menu (Toàn cầu)",
                    "slug": "storefront-chrome",
                    "attrs": {
                        "announcement-id": "ann-2026",
                        "announcement-message": "Chào mừng bạn đến với AuraBook — Nhà sách trực tuyến & Cộng đồng độc giả tinh hoa!",
                        "announcement-href": "/products",
                        "announcement-link-label": "Khám phá ngay",
                        "announcement-dismissible": "true",
                        "nav-all-products-label": "Tất cả sách",
                        "nav-view-all-label": "Xem toàn bộ",
                    }
                },
                {
                    "title": "Giao diện Thanh thông báo & Menu (Kênh VND)",
                    "slug": "storefront-chrome-channel-vnd",
                    "attrs": {
                        "announcement-id": "ann-vnd-2026",
                        "announcement-message": "Miễn phí vận chuyển toàn quốc cho đơn hàng từ 500.000₫ | Giao hàng nhanh 2-4 ngày",
                        "announcement-href": "/products",
                        "announcement-link-label": "Mua ngay",
                        "announcement-dismissible": "true",
                        "nav-all-products-label": "Kho Sách Chọn Lọc",
                        "nav-view-all-label": "Xem tất cả",
                    }
                }
            ]
        },
        {
            "name": "Storefront — Homepage",
            "slug": "storefront-homepage",
            "attributes": [
                {"name": "Hero eyebrow", "slug": "hero-eyebrow", "input_type": "PLAIN_TEXT"},
                {"name": "Hero heading", "slug": "hero-heading", "input_type": "PLAIN_TEXT"},
                {"name": "Hero subheading", "slug": "hero-subheading", "input_type": "PLAIN_TEXT"},
                {"name": "Hero CTA label", "slug": "hero-cta-label", "input_type": "PLAIN_TEXT"},
                {"name": "Featured heading", "slug": "featured-heading", "input_type": "PLAIN_TEXT"},
                {"name": "Featured limit", "slug": "featured-limit", "input_type": "NUMERIC"},
                {"name": "Categories heading", "slug": "categories-heading", "input_type": "PLAIN_TEXT"},
                {"name": "Categories eyebrow", "slug": "categories-eyebrow", "input_type": "PLAIN_TEXT"},
                {"name": "Brand story heading", "slug": "brand-story-heading", "input_type": "PLAIN_TEXT"},
                {"name": "Brand story paragraph 1", "slug": "brand-story-paragraph-1", "input_type": "PLAIN_TEXT"},
                {"name": "Brand story paragraph 2", "slug": "brand-story-paragraph-2", "input_type": "PLAIN_TEXT"},
                {"name": "Values heading", "slug": "values-heading", "input_type": "PLAIN_TEXT"},
                {"name": "Values column 1 title", "slug": "values-column-1-title", "input_type": "PLAIN_TEXT"},
                {"name": "Values column 1 text", "slug": "values-column-1-text", "input_type": "PLAIN_TEXT"},
                {"name": "Values column 2 title", "slug": "values-column-2-title", "input_type": "PLAIN_TEXT"},
                {"name": "Values column 2 text", "slug": "values-column-2-text", "input_type": "PLAIN_TEXT"},
                {"name": "Values column 3 title", "slug": "values-column-3-title", "input_type": "PLAIN_TEXT"},
                {"name": "Values column 3 text", "slug": "values-column-3-text", "input_type": "PLAIN_TEXT"},
                {"name": "Editorial heading", "slug": "editorial-heading", "input_type": "PLAIN_TEXT"},
                {"name": "Editorial paragraph 1", "slug": "editorial-paragraph-1", "input_type": "PLAIN_TEXT"},
                {"name": "Editorial CTA label", "slug": "editorial-cta-label", "input_type": "PLAIN_TEXT"},
            ],
            "pages": [
                {
                    "title": "Trang chủ AuraBook (Toàn cầu)",
                    "slug": "storefront-homepage",
                    "attrs": {
                        "hero-eyebrow": "Nhà sách AuraBook",
                        "hero-heading": "Nơi Tri Thức Gặp Gỡ Tâm Hồn",
                        "hero-subheading": "Khám phá bộ sưu tập sách chọn lọc, kết nối cùng cộng đồng độc giả đam mê đọc sách.",
                        "hero-cta-label": "Khám phá tủ sách",
                        "featured-heading": "Tác Phẩm Nổi Bật",
                        "featured-limit": "8",
                        "categories-heading": "Danh Mục Chủ Đề",
                        "categories-eyebrow": "Khám phá theo sở thích",
                        "brand-story-heading": "Hành Trình Của Chúng Tôi",
                        "brand-story-paragraph-1": "AuraBook được thành lập với sứ mệnh lan tỏa văn hóa đọc văn minh, mang lại những tác phẩm sâu sắc và truyền cảm hứng.",
                        "brand-story-paragraph-2": "Chúng tôi tin rằng mỗi cuốn sách là một người bạn đồng hành trung thành trên con đường hoàn thiện bản thân.",
                        "values-heading": "Giá Trị Cốt Lõi",
                        "values-column-1-title": "Sách Chính Hãng 100%",
                        "values-column-1-text": "Cam kết nguồn gốc xuất bản uy tín và bản quyền chuẩn mực.",
                        "values-column-2-title": "Cộng Đồng Độc Giả Văn Minh",
                        "values-column-2-text": "Không gian thảo luận, review sách chân thực và kết nối sâu sắc.",
                        "values-column-3-title": "Đóng Gói & Giao Nhanh",
                        "values-column-3-text": "Bảo quản sách cẩn thận, vận chuyển nhanh chóng tới tận tay độc giả.",
                        "editorial-heading": "Đọc Để Trưởng Thành",
                        "editorial-paragraph-1": "Một thói quen nhỏ mỗi ngày sẽ mở ra chân trời tư duy rộng lớn cho tương lai của bạn.",
                        "editorial-cta-label": "Bắt đầu ngay hôm nay",
                    }
                },
                {
                    "title": "Trang chủ AuraBook (Kênh VND)",
                    "slug": "storefront-homepage-channel-vnd",
                    "attrs": {
                        "hero-eyebrow": "Nhà sách AuraBook Việt Nam",
                        "hero-heading": "Khơi Nguồn Cảm Hứng — Đọc Để Khác Biệt",
                        "hero-subheading": "Tuyển chọn những tác phẩm văn học, kinh doanh, tâm lý và phát triển bản thân xuất sắc nhất.",
                        "hero-cta-label": "Mua sắm ngay",
                        "featured-heading": "Sách Bán Chạy Nhất",
                        "featured-limit": "8",
                        "categories-heading": "Chủ Đề Sách Yêu Thích",
                        "categories-eyebrow": "Đa dạng thể loại",
                        "brand-story-heading": "Về AuraBook",
                        "brand-story-paragraph-1": "AuraBook là không gian kết nối tri thức nơi người yêu sách tại Việt Nam tìm thấy những đầu sách chất lượng cao.",
                        "brand-story-paragraph-2": "Tất cả sách đều được tuyển chọn kỹ lưỡng, in ấn chất lượng và đồng bộ cùng không gian thảo luận trực tuyến.",
                        "values-heading": "Tại Sao Chọn AuraBook?",
                        "values-column-1-title": "Chất Lượng Vượt Trội",
                        "values-column-1-text": "100% sách mới, bản quyền đầy đủ từ các nhà xuất bản hàng đầu.",
                        "values-column-2-title": "Giao Hàng Miễn Phí",
                        "values-column-2-text": "Đơn hàng từ 500.000₫ được miễn phí giao hàng trên toàn quốc.",
                        "values-column-3-title": "Cộng Đồng Sôi Động",
                        "values-column-3-text": "Giao lưu, kết bạn và chia sẻ cảm nhận cùng hàng nghìn độc giả.",
                        "editorial-heading": "Mỗi Ngày Một Trang Sách",
                        "editorial-paragraph-1": "Dành 15 phút đọc sách mỗi ngày để bồi đắp tâm hồn và nâng tầm tri thức.",
                        "editorial-cta-label": "Tham gia cùng chúng tôi",
                    }
                }
            ]
        },
        {
            "name": "Storefront — Products",
            "slug": "storefront-products",
            "attributes": [
                {"name": "Listing title", "slug": "listing-title", "input_type": "PLAIN_TEXT"},
                {"name": "Listing description", "slug": "listing-description", "input_type": "PLAIN_TEXT"},
            ],
            "pages": [
                {
                    "title": "Trang Danh Sách Sản Phẩm (Toàn cầu)",
                    "slug": "storefront-products",
                    "attrs": {
                        "listing-title": "Bộ Sưu Tập Sách",
                        "listing-description": "Khám phá kho sách phong phú với đầy đủ các thể loại phục vụ mọi nhu cầu học tập và giải trí.",
                    }
                },
                {
                    "title": "Trang Danh Sách Sản Phẩm (Kênh VND)",
                    "slug": "storefront-products-channel-vnd",
                    "attrs": {
                        "listing-title": "Kho Sách Chọn Lọc AuraBook",
                        "listing-description": "Tìm kiếm cuốn sách tiếp theo cho bạn từ bộ sưu tập sách bán chạy và kinh điển.",
                    }
                }
            ]
        },
        {
            "name": "Storefront — Cart",
            "slug": "storefront-cart",
            "attributes": [
                {"name": "Empty title", "slug": "empty-title", "input_type": "PLAIN_TEXT"},
                {"name": "Empty body", "slug": "empty-body", "input_type": "PLAIN_TEXT"},
                {"name": "Empty CTA label", "slug": "empty-cta-label", "input_type": "PLAIN_TEXT"},
                {"name": "Trust free shipping prefix", "slug": "trust-free-shipping-prefix", "input_type": "PLAIN_TEXT"},
                {"name": "Trust returns label", "slug": "trust-returns-label", "input_type": "PLAIN_TEXT"},
                {"name": "Drawer title", "slug": "drawer-title", "input_type": "PLAIN_TEXT"},
                {"name": "Drawer add for free shipping", "slug": "drawer-add-for-free-shipping", "input_type": "PLAIN_TEXT"},
                {"name": "Drawer free shipping qualified", "slug": "drawer-free-shipping-qualified", "input_type": "PLAIN_TEXT"},
            ],
            "pages": [
                {
                    "title": "Trang Giỏ Hàng (Toàn cầu)",
                    "slug": "storefront-cart",
                    "attrs": {
                        "empty-title": "Giỏ hàng của bạn đang trống",
                        "empty-body": "Hãy lựa chọn những cuốn sách yêu thích để thêm vào giỏ hàng nhé.",
                        "empty-cta-label": "Khám phá sách",
                        "trust-free-shipping-prefix": "Miễn phí vận chuyển cho đơn hàng từ",
                        "trust-returns-label": "Đổi trả dễ dàng trong vòng 30 ngày",
                        "drawer-title": "Giỏ Hàng Của Bạn",
                        "drawer-add-for-free-shipping": "Mua thêm để được miễn phí vận chuyển",
                        "drawer-free-shipping-qualified": "Đơn hàng của bạn đã đủ điều kiện Miễn phí vận chuyển!",
                    }
                },
                {
                    "title": "Trang Giỏ Hàng (Kênh VND)",
                    "slug": "storefront-cart-channel-vnd",
                    "attrs": {
                        "empty-title": "Giỏ hàng hiện chưa có sách",
                        "empty-body": "Cùng khám phá hàng nghìn tựa sách hấp dẫn tại AuraBook ngay hôm nay.",
                        "empty-cta-label": "Dạo quanh nhà sách",
                        "trust-free-shipping-prefix": "Miễn phí giao hàng đơn từ",
                        "trust-returns-label": "Đổi trả thuận tiện 30 ngày",
                        "drawer-title": "Giỏ Hàng",
                        "drawer-add-for-free-shipping": "Thêm sách để nhận ưu đãi FreeShip",
                        "drawer-free-shipping-qualified": "Bạn đã được Miễn phí giao hàng!",
                    }
                }
            ]
        },
        {
            "name": "Storefront — Checkout",
            "slug": "storefront-checkout",
            "attributes": [
                {"name": "Empty cart title", "slug": "empty-cart-title", "input_type": "PLAIN_TEXT"},
                {"name": "Empty cart body", "slug": "empty-cart-body", "input_type": "PLAIN_TEXT"},
                {"name": "Empty cart start label", "slug": "empty-cart-start-label", "input_type": "PLAIN_TEXT"},
                {"name": "Empty cart go back label", "slug": "empty-cart-go-back-label", "input_type": "PLAIN_TEXT"},
                {"name": "Empty session title", "slug": "empty-session-title", "input_type": "PLAIN_TEXT"},
                {"name": "Empty session message", "slug": "empty-session-message", "input_type": "PLAIN_TEXT"},
                {"name": "Marketing opt in label", "slug": "marketing-opt-in-label", "input_type": "PLAIN_TEXT"},
                {"name": "Trust secure checkout", "slug": "trust-secure-checkout", "input_type": "PLAIN_TEXT"},
                {"name": "Trust stripe processor", "slug": "trust-stripe-processor", "input_type": "PLAIN_TEXT"},
            ],
            "pages": [
                {
                    "title": "Trang Thanh Toán (Toàn cầu)",
                    "slug": "storefront-checkout",
                    "attrs": {
                        "empty-cart-title": "Chưa có sản phẩm để thanh toán",
                        "empty-cart-body": "Vui lòng chọn mua sách trước khi tiến hành thanh toán.",
                        "empty-cart-start-label": "Tiếp tục mua hàng",
                        "empty-cart-go-back-label": "Quay lại trang chủ",
                        "empty-session-title": "Phiên thanh toán đã kết thúc",
                        "empty-session-message": "Vui lòng tải lại trang hoặc tạo đơn hàng mới.",
                        "marketing-opt-in-label": "Nhận thông báo ưu đãi và sự kiện sách mới qua email",
                        "trust-secure-checkout": "Thanh toán an toàn & bảo mật tuyệt đối",
                        "trust-stripe-processor": "Hỗ trợ nhiều phương thức thanh toán tiện lợi",
                    }
                },
                {
                    "title": "Trang Thanh Toán (Kênh VND)",
                    "slug": "storefront-checkout-channel-vnd",
                    "attrs": {
                        "empty-cart-title": "Giỏ hàng thanh toán trống",
                        "empty-cart-body": "Hãy chọn cho mình cuốn sách ưng ý trước khi thanh toán nhé.",
                        "empty-cart-start-label": "Mua sách ngay",
                        "empty-cart-go-back-label": "Về trang chủ",
                        "empty-session-title": "Phiên thanh toán hết hạn",
                        "empty-session-message": "Vui lòng tải lại giỏ hàng.",
                        "marketing-opt-in-label": "Đăng ký nhận mã giảm giá và tin tức sách hay",
                        "trust-secure-checkout": "Bảo mật thông tin đơn hàng 100%",
                        "trust-stripe-processor": "Cổng thanh toán tin cậy & an toàn",
                    }
                }
            ]
        }
    ]

    for pt_info in page_types_data:
        pt, pt_created = PageType.objects.get_or_create(slug=pt_info["slug"], defaults={"name": pt_info["name"]})
        if pt.name != pt_info["name"]:
            pt.name = pt_info["name"]
            pt.save()
        print(f"PageType: {pt.name} (slug: {pt.slug}) - created: {pt_created}")

        # Setup attributes
        for attr_info in pt_info["attributes"]:
            attr, a_created = Attribute.objects.get_or_create(
                slug=attr_info["slug"],
                defaults={
                    "name": attr_info["name"],
                    "type": AttributeType.PAGE_TYPE,
                    "input_type": attr_info["input_type"].lower().replace("_", "-")
                }
            )
            pt.page_attributes.add(attr)

        # Setup pages
        for page_info in pt_info["pages"]:
            page, p_created = Page.objects.get_or_create(
                slug=page_info["slug"],
                defaults={
                    "title": page_info["title"],
                    "page_type": pt,
                    "is_published": True
                }
            )
            page.title = page_info["title"]
            page.page_type = pt
            page.is_published = True
            page.save()
            print(f"  Page: {page.title} (slug: {page.slug}) - created: {p_created}")

            # Assign attribute values
            for attr_slug, val_str in page_info["attrs"].items():
                attr = Attribute.objects.filter(slug=attr_slug).first()
                if not attr:
                    continue
                val_slug = f"{page.slug}-{attr_slug}"[:50]
                val, _ = AttributeValue.objects.get_or_create(
                    attribute=attr,
                    slug=val_slug,
                    defaults={"name": val_str[:250], "value": val_str if attr.input_type == "NUMERIC" else ""}
                )
                if attr.input_type == "NUMERIC":
                    try:
                        val.value = val_str
                    except Exception:
                        pass
                val.name = val_str[:250]
                val.plain_text = val_str if attr.input_type == "PLAIN_TEXT" else None
                val.save()

                AssignedPageAttributeValue.objects.get_or_create(
                    page=page,
                    value=val
                )

    print("Storefront Models & Pages setup completed successfully!")

if __name__ == "__main__":
    seed_models()
