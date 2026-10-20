import os
import shutil

BOOK_DIR = r"c:\Users\basduy05\Downloads\aurabook\trainingdata\book"
READER_BOOKS = r"c:\Users\basduy05\Downloads\aurabook\ecommerce-ai-platform\drm-security\reader-portal\books"
BACKEND_EBOOKS = r"c:\Users\basduy05\Downloads\aurabook\backend\media\ebooks"
FRONTEND_BOOKS = r"c:\Users\basduy05\Downloads\aurabook\frontend\public\books"
FRONTEND_COVERS = r"c:\Users\basduy05\Downloads\aurabook\frontend\public\products"
MEDIA_PRODUCTS = r"c:\Users\basduy05\Downloads\aurabook\backend\media\products"

for d in [READER_BOOKS, BACKEND_EBOOKS, FRONTEND_BOOKS, FRONTEND_COVERS]:
    os.makedirs(d, exist_ok=True)

epub_files = [f for f in os.listdir(BOOK_DIR) if f.endswith(".epub")]

for ef in epub_files:
    src = os.path.join(BOOK_DIR, ef)
    # Normalized filename
    simple_name = ef.lower().split(" - ")[0].strip().replace(" ", "-") + ".epub"
    
    shutil.copy2(src, os.path.join(READER_BOOKS, simple_name))
    shutil.copy2(src, os.path.join(BACKEND_EBOOKS, simple_name))
    shutil.copy2(src, os.path.join(FRONTEND_BOOKS, simple_name))
    print(f"Copied {ef} -> {simple_name}")

# Copy covers to frontend
for f in os.listdir(MEDIA_PRODUCTS):
    if f.startswith("book-"):
        shutil.copy2(os.path.join(MEDIA_PRODUCTS, f), os.path.join(FRONTEND_COVERS, f))
        print(f"Copied cover {f} to frontend")

print("All real book files and covers placed successfully!")
