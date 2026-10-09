import copy
import logging
import os
import re
from typing import Any

from saleor.product.models import (
    Category,
    CategoryTranslation,
    Product,
    ProductTranslation,
)

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")

# Bộ ký tự dấu tiếng Việt để nhận diện tự động ngôn ngữ
VIETNAMESE_CHARS_REGEX = re.compile(
    r"[àáảãạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵđ]",
    re.IGNORECASE,
)


def is_vietnamese(text: str) -> bool:
    """Kiểm tra chuỗi có chứa ký tự tiếng Việt có dấu hay không."""
    if not text:
        return False
    return bool(VIETNAMESE_CHARS_REGEX.search(text))


def translate_text(text: str, source_lang: str, target_lang: str) -> str:
    """Dịch chuỗi văn bản với cơ chế Multi-Tier:
    - Tier 1: Gemini AI (nếu có GEMINI_API_KEY)
    - Tier 2: deep-translator MyMemory (miễn phí, không cần key)
    - Tier 3: Trả về chuỗi gốc nếu lỗi
    """
    if not text or not text.strip():
        return text

    # Chuẩn hóa mã ngôn ngữ
    lang_map_mymemory = {
        "en": "english",
        "vi": "vietnamese",
    }
    src_code = source_lang.lower()
    tgt_code = target_lang.lower()

    if src_code == tgt_code:
        return text

    # Tier 1: Gemini AI
    if GEMINI_API_KEY:
        try:
            from google import genai
            client = genai.Client(api_key=GEMINI_API_KEY)
            prompt = (
                f"You are a professional e-commerce book translator. "
                f"Translate the following text from {source_lang} to {target_lang}. "
                f"Preserve all HTML tags like <b>, <i>, <a> exactly. "
                f"Output only the translated text without commentary or quotation marks:\n\n{text}"
            )
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=prompt,
            )
            if response.text and response.text.strip():
                return response.text.strip()
        except Exception as exc:
            logger.warning("Gemini translation failed, falling back to deep-translator: %s", exc)

    # Tier 2: deep-translator (MyMemory)
    try:
        from deep_translator import MyMemoryTranslator
        src_name = lang_map_mymemory.get(src_code, src_code)
        tgt_name = lang_map_mymemory.get(tgt_code, tgt_code)
        translator = MyMemoryTranslator(source=src_name, target=tgt_name)
        result = translator.translate(text)
        if result and result.strip():
            return result.strip()
    except Exception as exc:
        logger.warning("deep-translator failed: %s", exc)

    return text


def translate_editorjs_description(desc: Any, source_lang: str, target_lang: str) -> Any:
    """Dịch trường description dạng EditorJS blocks JSON của Saleor mà không làm hỏng cấu trúc rich text.
    """
    if not desc:
        return desc

    if isinstance(desc, dict):
        new_desc = copy.deepcopy(desc)
        blocks = new_desc.get("blocks", [])
        for block in blocks:
            if isinstance(block, dict) and "data" in block and isinstance(block["data"], dict):
                text_val = block["data"].get("text")
                if text_val and isinstance(text_val, str):
                    block["data"]["text"] = translate_text(text_val, source_lang, target_lang)
        return new_desc
    if isinstance(desc, str):
        return translate_text(desc, source_lang, target_lang)

    return desc


def sync_product_translations(product: Product) -> list[ProductTranslation]:
    """Tự động dịch và đồng bộ bản dịch song ngữ (EN <-> VI) cho sản phẩm vào bảng ProductTranslation.
    """
    # Xác định ngôn ngữ nguồn của sản phẩm gốc
    source_is_vi = is_vietnamese(product.name)
    source_lang = "vi" if source_is_vi else "en"
    target_lang = "en" if source_is_vi else "vi"

    synced = []

    # 1. Tạo hoặc cập nhật bản dịch cho target_lang
    target_trans = product.translations.filter(language_code=target_lang).first()
    if not target_trans or not target_trans.name:
        translated_name = translate_text(product.name, source_lang, target_lang)
        translated_desc = translate_editorjs_description(product.description, source_lang, target_lang)
        translated_seo_title = translate_text(product.seo_title, source_lang, target_lang) if product.seo_title else None
        translated_seo_desc = translate_text(product.seo_description, source_lang, target_lang) if product.seo_description else None

        trans_obj, _ = ProductTranslation.objects.update_or_create(
            product=product,
            language_code=target_lang,
            defaults={
                "name": translated_name,
                "description": translated_desc,
                "seo_title": translated_seo_title,
                "seo_description": translated_seo_desc,
            },
        )
        logger.info(
            "Tự động tạo bản dịch [%s] cho sản phẩm %s: %s -> %s",
            target_lang.upper(),
            product.id,
            product.name,
            translated_name,
        )
        synced.append(trans_obj)

    # 2. Đảm bảo bản ghi translation cho chính ngôn ngữ nguồn cũng có mặt
    # (Để GraphQL Saleor query translation(languageCode: VI) trả về chuẩn mà không phải fallback)
    source_trans, _ = ProductTranslation.objects.get_or_create(
        product=product,
        language_code=source_lang,
        defaults={
            "name": product.name,
            "description": product.description,
            "seo_title": product.seo_title,
            "seo_description": product.seo_description,
        },
    )
    synced.append(source_trans)

    return synced


def sync_category_translations(category: Category) -> list[CategoryTranslation]:
    """Tự động dịch danh mục sang cả tiếng Anh và tiếng Việt.
    """
    source_is_vi = is_vietnamese(category.name)
    source_lang = "vi" if source_is_vi else "en"
    target_lang = "en" if source_is_vi else "vi"

    synced = []
    target_trans = category.translations.filter(language_code=target_lang).first()
    if not target_trans or not target_trans.name:
        translated_name = translate_text(category.name, source_lang, target_lang)
        trans_obj, _ = CategoryTranslation.objects.update_or_create(
            category=category,
            language_code=target_lang,
            defaults={
                "name": translated_name,
                "description": translate_editorjs_description(category.description, source_lang, target_lang),
                "seo_title": translate_text(category.seo_title, source_lang, target_lang) if category.seo_title else None,
                "seo_description": translate_text(category.seo_description, source_lang, target_lang) if category.seo_description else None,
            },
        )
        synced.append(trans_obj)

    source_trans, _ = CategoryTranslation.objects.get_or_create(
        category=category,
        language_code=source_lang,
        defaults={
            "name": category.name,
            "description": category.description,
            "seo_title": category.seo_title,
            "seo_description": category.seo_description,
        },
    )
    synced.append(source_trans)
    return synced
