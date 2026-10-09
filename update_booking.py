import os

filepath = r"c:\Users\Prashamhodlur S\Desktop\DBMS PROJECT INDIVIDUAL\frontend\src\pages\Booking.jsx"
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

import_stmt = "import { formatCurrency } from '../utils/currency';\n"
if "import { formatCurrency }" not in content:
    content = content.replace("import LoadingSpinner", import_stmt + "import LoadingSpinner")

# Replacements for ? or ₹ to formatCurrency calls
content = content.replace(
    '<div className="flex items-center gap-2 text-green-400 font-medium">?{show.ticket_price} per seat</div>',
    '<div className="flex items-center gap-2 text-green-400 font-medium">{formatCurrency(show.ticket_price)} per seat</div>'
)
content = content.replace(
    '<div className="flex items-center gap-2 text-green-400 font-medium">₹{show.ticket_price} per seat</div>',
    '<div className="flex items-center gap-2 text-green-400 font-medium">{formatCurrency(show.ticket_price)} per seat</div>'
)

content = content.replace(
    'Total: <span className="font-bold text-green-400">?{selectedSeats.length * selectedShow.ticket_price}</span>',
    'Total: <span className="font-bold text-green-400">{formatCurrency(selectedSeats.length * selectedShow.ticket_price)}</span>'
)
content = content.replace(
    'Total: <span className="font-bold text-green-400">₹{selectedSeats.length * selectedShow.ticket_price}</span>',
    'Total: <span className="font-bold text-green-400">{formatCurrency(selectedSeats.length * selectedShow.ticket_price)}</span>'
)

content = content.replace(
    "{loading ? 'Processing...' : 'Confirm & Pay ?' + (selectedSeats.length * selectedShow.ticket_price)}",
    "{loading ? 'Processing...' : 'Confirm & Pay ' + formatCurrency(selectedSeats.length * selectedShow.ticket_price)}"
)
content = content.replace(
    "{loading ? 'Processing...' : 'Confirm & Pay ₹' + (selectedSeats.length * selectedShow.ticket_price)}",
    "{loading ? 'Processing...' : 'Confirm & Pay ' + formatCurrency(selectedSeats.length * selectedShow.ticket_price)}"
)

content = content.replace(
    '<span className="text-green-400 font-medium">?{selectedSeats.length * selectedShow.ticket_price}</span>',
    '<span className="text-green-400 font-medium">{formatCurrency(selectedSeats.length * selectedShow.ticket_price)}</span>'
)
content = content.replace(
    '<span className="text-green-400 font-medium">₹{selectedSeats.length * selectedShow.ticket_price}</span>',
    '<span className="text-green-400 font-medium">{formatCurrency(selectedSeats.length * selectedShow.ticket_price)}</span>'
)

content = content.replace(
    '<td className="p-4 font-medium">?{h.total_amount}</td>',
    '<td className="p-4 font-medium">{formatCurrency(h.total_amount)}</td>'
)
content = content.replace(
    '<td className="p-4 font-medium">₹{h.total_amount}</td>',
    '<td className="p-4 font-medium">{formatCurrency(h.total_amount)}</td>'
)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("Booking.jsx updated.")
