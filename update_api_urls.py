import os
import re

base_dir = r"c:\Users\Prashamhodlur S\Desktop\DBMS PROJECT INDIVIDUAL\frontend\src\pages"

for filename in os.listdir(base_dir):
    if not filename.endswith(".jsx"): continue
    filepath = os.path.join(base_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace 'http://localhost:5000/api...'
    content = re.sub(r"'http://localhost:5000/api([^']*)'", r"`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}\1`", content)
    # Replace "http://localhost:5000/api..."
    content = re.sub(r'"http://localhost:5000/api([^"]*)"', r"`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}\1`", content)
    # Replace `http://localhost:5000/api...`
    content = re.sub(r"`http://localhost:5000/api([^`]*)`", r"`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}\1`", content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

print("Updated API URLs to use environment variables.")
