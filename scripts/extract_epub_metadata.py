import os
import zipfile
import xml.etree.ElementTree as ET

BOOK_DIR = r"c:\Users\basduy05\Downloads\aurabook\trainingdata\book"
MEDIA_DIR = r"c:\Users\basduy05\Downloads\aurabook\backend\media\products"
os.makedirs(MEDIA_DIR, exist_ok=True)

epub_files = [f for f in os.listdir(BOOK_DIR) if f.endswith(".epub")]

for ef in epub_files:
    full_path = os.path.join(BOOK_DIR, ef)
    print("=" * 60)
    print("Analyzing EPUB:", ef)
    with zipfile.ZipFile(full_path, 'r') as zf:
        namelist = zf.namelist()
        # Find cover image
        image_files = [n for n in namelist if any(n.lower().endswith(ext) for ext in ['.jpg', '.jpeg', '.png', '.webp'])]
        cover_candidates = [n for n in image_files if 'cover' in n.lower()]
        
        print(f"Total files in zip: {len(namelist)}")
        print(f"Cover candidates: {cover_candidates}")
        if not cover_candidates and image_files:
            print(f"Other images (first 5): {image_files[:5]}")
            
        cover_path = cover_candidates[0] if cover_candidates else (image_files[0] if image_files else None)
        
        # Read OPF or metadata
        opf_files = [n for n in namelist if n.endswith('.opf')]
        if opf_files:
            opf_content = zf.read(opf_files[0]).decode('utf-8', errors='ignore')
            # Extract title and creator
            try:
                root = ET.fromstring(opf_content)
                metadata = root.find('{http://www.idpf.org/2007/opf}metadata')
                if metadata is not None:
                    titles = [el.text for el in metadata.findall('{http://purl.org/dc/elements/1.1/}title') if el.text]
                    creators = [el.text for el in metadata.findall('{http://purl.org/dc/elements/1.1/}creator') if el.text]
                    descriptions = [el.text for el in metadata.findall('{http://purl.org/dc/elements/1.1/}description') if el.text]
                    print(f"Title: {titles}")
                    print(f"Creator: {creators}")
                    print(f"Description len: {len(descriptions[0]) if descriptions else 0}")
            except Exception as e:
                print("OPF parse error:", e)
                
        # Extract cover
        if cover_path:
            ext = os.path.splitext(cover_path)[1]
            base_slug = ef.lower().split(" - ")[0].strip().replace(" ", "-")
            out_name = f"book-{base_slug}-cover{ext}"
            out_file = os.path.join(MEDIA_DIR, out_name)
            with open(out_file, 'wb') as out_f:
                out_f.write(zf.read(cover_path))
            print(f"Extracted cover to: {out_file} (size: {os.path.getsize(out_file)} bytes)")
