import os
import sys

sys.path.insert(0, "/app")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "saleor.settings")
# Provide a dummy static RSA key so jwt_manager doesn't take 20s to generate one!
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

from saleor.product.models import Category
print("Current categories count:", Category.objects.count())
