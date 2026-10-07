import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'saleor.settings')
django.setup()

from saleor.attribute.models import Attribute, AttributePage, AttributeValue, AssignedPageAttributeValue
from saleor.page.models import PageType, Page
from saleor.channel.models import Channel

print("Seeding Storefront CMS Structures and Models...")

# 1. Attributes definition
ATTRIBUTES_CONFIG = [
    # Policies
    ("free-shipping-threshold", "Free shipping threshold", "numeric"),
    ("returns-window-days", "Returns window days", "numeric"),
    # Chrome
    ("announcement-id", "Announcement ID", "plain-text"),
    ("announcement-message", "Announcement message", "plain-text"),
    ("announcement-href", "Announcement href", "plain-text"),
    ("announcement-link-label", "Announcement link label", "plain-text"),
    ("announcement-dismissible", "Announcement dismissible", "boolean"),
    ("nav-all-products-label", "Nav all products label", "plain-text"),
    ("nav-view-all-label", "Nav view all label", "plain-text"),
    # Homepage
    ("hero-eyebrow", "Hero eyebrow", "plain-text"),
    ("hero-heading", "Hero heading", "plain-text"),
    ("hero-subheading", "Hero subheading", "plain-text"),
    ("hero-cta-label", "Hero CTA label", "plain-text"),
    ("hero-image", "Hero image", "file"),
    ("featured-heading", "Featured heading", "plain-text"),
    ("featured-limit", "Featured limit", "numeric"),
    ("categories-heading", "Categories heading", "plain-text"),
    ("categories-eyebrow", "Categories eyebrow", "plain-text"),
    ("brand-story-heading", "Brand story heading", "plain-text"),
    ("brand-story-paragraph-1", "Brand story paragraph 1", "plain-text"),
    ("brand-story-paragraph-2", "Brand story paragraph 2", "plain-text"),
    ("values-heading", "Values heading", "plain-text"),
    ("values-columns-desktop", "Values columns desktop", "plain-text"),
    ("values-column-1-title", "Values column 1 title", "plain-text"),
    ("values-column-1-text", "Values column 1 text", "plain-text"),
    ("values-column-2-title", "Values column 2 title", "plain-text"),
    ("values-column-2-text", "Values column 2 text", "plain-text"),
    ("values-column-3-title", "Values column 3 title", "plain-text"),
    ("values-column-3-text", "Values column 3 text", "plain-text"),
    ("editorial-heading", "Editorial heading", "plain-text"),
    ("editorial-paragraph-1", "Editorial paragraph 1", "plain-text"),
    ("editorial-image-position", "Editorial image position", "plain-text"),
    ("editorial-cta-label", "Editorial CTA label", "plain-text"),
    ("photo-credits", "Photo credits", "plain-text"),
]

created_attrs = {}
for slug, name, input_type in ATTRIBUTES_CONFIG:
    attr, created = Attribute.objects.get_or_create(
        slug=slug,
        defaults={
            'name': name,
            'type': 'page-type',
            'input_type': input_type,
            'visible_in_storefront': True,
        }
    )
    if not created and attr.type != 'page-type':
        attr.type = 'page-type'
        attr.save()
    created_attrs[slug] = attr
print(f"Created/verified {len(created_attrs)} attributes.")

# 2. PageTypes / Structures
PAGE_TYPES_CONFIG = [
    ("storefront-policies", "Storefront — Policies", [
        "free-shipping-threshold", "returns-window-days"
    ]),
    ("storefront-chrome", "Storefront — Chrome", [
        "announcement-id", "announcement-message", "announcement-href",
        "announcement-link-label", "announcement-dismissible",
        "nav-all-products-label", "nav-view-all-label"
    ]),
    ("storefront-homepage", "Storefront — Homepage", [
        "hero-eyebrow", "hero-heading", "hero-subheading", "hero-cta-label", "hero-image",
        "featured-heading", "featured-limit", "categories-heading", "categories-eyebrow",
        "brand-story-heading", "brand-story-paragraph-1", "brand-story-paragraph-2",
        "values-heading", "values-columns-desktop",
        "values-column-1-title", "values-column-1-text",
        "values-column-2-title", "values-column-2-text",
        "values-column-3-title", "values-column-3-text",
        "editorial-heading", "editorial-paragraph-1", "editorial-image-position",
        "editorial-cta-label", "photo-credits"
    ])
]

created_page_types = {}
for pt_slug, pt_name, attr_slugs in PAGE_TYPES_CONFIG:
    pt, created = PageType.objects.get_or_create(
        slug=pt_slug,
        defaults={'name': pt_name}
    )
    created_page_types[pt_slug] = pt
    # Assign attributes
    for idx, a_slug in enumerate(attr_slugs):
        if a_slug in created_attrs:
            AttributePage.objects.get_or_create(
                attribute=created_attrs[a_slug],
                page_type=pt,
                defaults={'sort_order': idx}
            )
print(f"Created/verified {len(created_page_types)} PageTypes with assigned attributes.")

# Helper to set attribute value on page
def set_page_attr(page, attr_slug, text=None, num=None, boolean=None):
    if attr_slug not in created_attrs:
        return
    attr = created_attrs[attr_slug]
    val_name = str(text if text is not None else (num if num is not None else boolean))
    val_slug = f"{page.slug}-{attr.slug}"[:50]
    
    val, _ = AttributeValue.objects.get_or_create(
        attribute=attr,
        slug=val_slug,
        defaults={
            'name': val_name,
            'plain_text': text,
            'numeric': num,
            'boolean': boolean
        }
    )
    if text is not None and val.plain_text != text:
        val.plain_text = text
        val.save()
    if num is not None and val.numeric != num:
        val.numeric = num
        val.save()
    if boolean is not None and val.boolean != boolean:
        val.boolean = boolean
        val.save()

    AssignedPageAttributeValue.objects.get_or_create(
        page=page,
        value=val
    )

# 3. Create Models (Pages)
# Storefront Policies (Global & channel-vnd)
for slug, title, freeship in [
    ("storefront-policy", "Storefront Policies (Global)", 75),
    ("storefront-policy-channel-vnd", "Storefront Policies (VND)", 500000),
]:
    p, _ = Page.objects.get_or_create(
        slug=slug,
        defaults={
            'title': title,
            'page_type': created_page_types["storefront-policies"],
            'is_published': True
        }
    )
    set_page_attr(p, "free-shipping-threshold", num=freeship)
    set_page_attr(p, "returns-window-days", num=30)
    print(f"Seeded Page: {p.title} (slug: {p.slug})")

# Storefront Chrome (Global & channel-vnd)
for slug, title, msg in [
    ("storefront-chrome", "Storefront Chrome (Global)", "Free shipping on orders over {freeShippingThreshold}"),
    ("storefront-chrome-channel-vnd", "Storefront Chrome (VND)", "Miễn phí vận chuyển cho đơn hàng từ {freeShippingThreshold} đ"),
]:
    p, _ = Page.objects.get_or_create(
        slug=slug,
        defaults={
            'title': title,
            'page_type': created_page_types["storefront-chrome"],
            'is_published': True
        }
    )
    set_page_attr(p, "announcement-message", text=msg)
    set_page_attr(p, "announcement-dismissible", boolean=True)
    set_page_attr(p, "nav-all-products-label", text="Tất cả sản phẩm")
    set_page_attr(p, "nav-view-all-label", text="Xem tất cả {label}")
    print(f"Seeded Page: {p.title} (slug: {p.slug})")

# Storefront Homepage (Global & channel-vnd)
for slug, title, heading, subheading, cta in [
    ("storefront-homepage", "Storefront Homepage (Global)", "Discover our collection", "Explore curated products with quality and style.", "Shop all"),
    ("storefront-homepage-channel-vnd", "Storefront Homepage (VND)", "Khám phá bộ sưu tập sách & phong cách", "Tuyển tập những cuốn sách và ấn phẩm chọn lọc với chất lượng hàng đầu.", "Mua sắm ngay"),
]:
    p, _ = Page.objects.get_or_create(
        slug=slug,
        defaults={
            'title': title,
            'page_type': created_page_types["storefront-homepage"],
            'is_published': True
        }
    )
    set_page_attr(p, "hero-heading", text=heading)
    set_page_attr(p, "hero-subheading", text=subheading)
    set_page_attr(p, "hero-cta-label", text=cta)
    set_page_attr(p, "featured-heading", text="Sản phẩm nổi bật" if "VND" in title else "Featured products")
    set_page_attr(p, "featured-limit", num=8)
    set_page_attr(p, "categories-heading", text="Danh mục nổi bật" if "VND" in title else "Shop by category")
    set_page_attr(p, "brand-story-heading", text="Về Aurabook" if "VND" in title else "About Aurabook")
    set_page_attr(p, "brand-story-paragraph-1", text="Aurabook mang đến cho bạn không gian tri thức và trải nghiệm mua sắm tiện lợi, nhanh chóng.")
    set_page_attr(p, "values-heading", text="Cam kết của chúng tôi" if "VND" in title else "Our Commitments")
    set_page_attr(p, "values-column-1-title", text="Giao hàng toàn quốc" if "VND" in title else "Fast Delivery")
    set_page_attr(p, "values-column-1-text", text="Giao hàng nhanh chóng và đóng gói cẩn thận tới tận tay bạn.")
    set_page_attr(p, "values-column-2-title", text="Đổi trả trong 30 ngày" if "VND" in title else "30-Day Returns")
    set_page_attr(p, "values-column-2-text", text="Chính sách đổi trả dễ dàng, bảo vệ tối đa quyền lợi khách hàng.")
    set_page_attr(p, "values-column-3-title", text="Hỗ trợ tận tâm 24/7" if "VND" in title else "24/7 Support")
    set_page_attr(p, "values-column-3-text", text="Đội ngũ chăm sóc khách hàng luôn sẵn sàng giải đáp mọi thắc mắc.")
    print(f"Seeded Page: {p.title} (slug: {p.slug})")

print("\nSUCCESS: All Storefront CMS Pages and Structures have been seeded into Saleor!")
