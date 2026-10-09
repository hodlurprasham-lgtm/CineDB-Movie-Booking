import os

# 1. Update App.jsx
app_path = r"c:\Users\Prashamhodlur S\Desktop\DBMS PROJECT INDIVIDUAL\frontend\src\App.jsx"
with open(app_path, 'r', encoding='utf-8') as f:
    app_content = f.read()

app_content = app_content.replace("import SchemaViz from './pages/SchemaViz';\n", "")
app_content = app_content.replace('            <Route path="/schema" element={<SchemaViz />} />\n', "")

with open(app_path, 'w', encoding='utf-8') as f:
    f.write(app_content)

# 2. Update Sidebar.jsx
sidebar_path = r"c:\Users\Prashamhodlur S\Desktop\DBMS PROJECT INDIVIDUAL\frontend\src\components\Sidebar.jsx"
with open(sidebar_path, 'r', encoding='utf-8') as f:
    sidebar_content = f.read()

sidebar_content = sidebar_content.replace("    { to: '/schema', icon: GitBranch, label: 'Schema' },\n", "")
sidebar_content = sidebar_content.replace(", GitBranch", "") # Remove import just to be clean

with open(sidebar_path, 'w', encoding='utf-8') as f:
    f.write(sidebar_content)

# 3. Delete SchemaViz.jsx
schema_viz_path = r"c:\Users\Prashamhodlur S\Desktop\DBMS PROJECT INDIVIDUAL\frontend\src\pages\SchemaViz.jsx"
if os.path.exists(schema_viz_path):
    os.remove(schema_viz_path)

print("Schema ER diagram feature removed.")
