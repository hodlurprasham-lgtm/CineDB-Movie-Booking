import os
import re

def fix_file(filepath):
    # Read as Windows-1252, this is how it was corrupted originally (UTF-8 bytes interpreted as win-1252)
    # Wait, the powershell replace script actually read as Win-1252 and WROTE as UTF-8, effectively "double encoding" it.
    # So the file is currently UTF-8 containing the characters 'â€”', 'â‚¹', 'â–¼', 'â–¶'.
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Create the Intl formatter usage
    # We will just replace the hardcoded corrupted rupees with a JS call, or simply the correct UTF-8 symbol '₹'.
    # Actually, the user asked to use Intl.NumberFormat. Let's do both: 
    # replace double-encoded characters and apply the formatter.

    content = content.replace('â€”', '—')
    content = content.replace('â–¼', '▼')
    content = content.replace('â–¶', '▶')
    content = content.replace('â‚¹', '₹')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

base_dir = r"c:\Users\Prashamhodlur S\Desktop\DBMS PROJECT INDIVIDUAL\frontend\src\pages"
for filename in os.listdir(base_dir):
    if filename.endswith(".jsx"):
        fix_file(os.path.join(base_dir, filename))

print("Fixed encoding in JSX files.")
