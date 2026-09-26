from app.models import Base

print("Discovered tables:")
for t in sorted(Base.metadata.tables.keys()):
    print("  -", t)
assert len(Base.metadata.tables) >= 11
print("ALL MODELS VERIFIED SUCCESSFULLY!")
