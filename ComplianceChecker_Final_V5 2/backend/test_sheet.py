from google_sheet import write_history

print("Testing sheet write...")

success = write_history("test_local_insert.pdf", 77, 5)

print("Result:", success)
