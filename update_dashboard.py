import os

filepath = r"c:\Users\Prashamhodlur S\Desktop\DBMS PROJECT INDIVIDUAL\frontend\src\pages\Dashboard.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add import
import_stmt = "import { formatCurrency } from '../utils/currency';\n"
if "import { formatCurrency }" not in content:
    content = content.replace("import LoadingSpinner", import_stmt + "import LoadingSpinner")

# Replace Total Revenue card
content = content.replace(
    'value={₹}', 
    'value={formatCurrency(stats?.total_revenue || 0, 0)}'
)

# Replace Recent Bookings table amount
content = content.replace(
    '<td className="py-3 font-medium">₹{booking.total_amount}</td>',
    '<td className="py-3 font-medium">{formatCurrency(booking.total_amount)}</td>'
)

# Add custom tooltip for the BarChart to format currency
chart_tooltip_old = "                <Tooltip \n                  contentStyle={{ backgroundColor: '#0d1117', borderColor: '#21262d', color: '#e2e8f0' }}\n                  itemStyle={{ color: '#e50914' }}\n                />"
chart_tooltip_new = "                <Tooltip \n                  contentStyle={{ backgroundColor: '#0d1117', borderColor: '#21262d', color: '#e2e8f0' }}\n                  itemStyle={{ color: '#e50914' }}\n                  formatter={(value) => [formatCurrency(value, 0), 'Revenue']}\n                />"
content = content.replace(chart_tooltip_old, chart_tooltip_new)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Dashboard.jsx updated.")
