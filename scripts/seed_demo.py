"""Seeds a few realistic sample invoices so the app has something to show
immediately, instead of a judge staring at an empty list. Safe to run
repeatedly — it always creates new invoices, never places any calls itself.

Usage:
    python scripts/seed_demo.py
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import storage
from models import Invoice

SAMPLES = [
    dict(
        freelancer_name="Priya Shah",
        client_name="Bram at Fenwick Studio",
        client_phone="+14155550123",
        invoice_number="INV-0042",
        amount="2,400",
        currency="USD",
        due_date="2026-08-20",
        region="US",
        locale="en-US",
    ),
    dict(
        freelancer_name="Priya Shah",
        client_name="Nadia at Hartline Consulting",
        client_phone="+14155550199",
        invoice_number="INV-0043",
        amount="875",
        currency="USD",
        due_date="2026-08-28",
        region="US",
        locale="en-US",
    ),
    dict(
        freelancer_name="Priya Shah",
        client_name="Tom at Oakridge Interiors",
        client_phone="+442071838750",
        invoice_number="INV-0044",
        amount="1,150",
        currency="GBP",
        due_date="2026-09-01",
        region="GB",
        locale="en-US",
    ),
]

def seed(verbose: bool = False) -> int:
    """Seeds the sample invoices and returns how many were created."""
    for sample in SAMPLES:
        inv = Invoice.new(**sample)
        storage.save_invoice(inv)
        if verbose:
            print(f"seeded {inv.client_name} — invoice #{inv.invoice_number}")
    return len(SAMPLES)


if __name__ == "__main__":
    count = seed(verbose=True)
    print(f"\nDone. {count} invoices seeded. Start the app and refresh to see them.")
