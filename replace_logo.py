import base64, re

with open("/tmp/aurabook-logo.png", "rb") as f:
    new_b64 = base64.b64encode(f.read()).decode()

new_data_url = "data:image/png;base64," + new_b64

with open("/app/dashboard/index-aurabook-v3.js", "rb") as f:
    content = f.read().decode("utf-8", errors="replace")

pattern = r'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAKAAAACg[A-Za-z0-9+/=]*'
matches = re.findall(pattern, content)

print("Found", len(matches), "old logo occurrences")

if matches:
    old_logo = matches[0]
    count = content.count(old_logo)
    new_content = content.replace(old_logo, new_data_url)
    print("Replacing", count, "occurrences")
    with open("/app/dashboard/index-aurabook-v3.js", "w", encoding="utf-8") as f:
        f.write(new_content)
    print("Done! Bundle updated.")
else:
    all_imgs = re.findall(r'data:image/png;base64,[A-Za-z0-9+/=]{100,}', content)
    print("Found", len(all_imgs), "total base64 images in bundle")
    for i, img in enumerate(all_imgs):
        print("  Image", i, ":", img[22:90], "len=", len(img))
