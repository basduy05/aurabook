from django.apps import AppConfig


class CatalogAutomationConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "aurabook_apps.catalog_automation"
    verbose_name = "Catalog Automation & Localization"

    def ready(self):
        # Register signals for automatic product translation and multi-channel currency sync
        try:
            import aurabook_apps.catalog_automation.signals  # noqa
        except Exception as exc:
            import logging
            logging.getLogger(__name__).warning("Lỗi khởi tạo catalog automation signals: %s", exc)
