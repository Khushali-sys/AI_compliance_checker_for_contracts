from dotenv import load_dotenv
load_dotenv(dotenv_path="/Users/likithr/Downloads/ComplianceChecker_Final_V5/backend/.env")





import gspread
from google.oauth2.service_account import Credentials
import os
from datetime import datetime
import traceback

def read_missing_clauses_from_sheet():
    return []

def write_missing_clause_to_sheet(clause, description):
    pass


SCOPES = ["https://www.googleapis.com/auth/spreadsheets"]
SERVICE_FILE = "/Users/likithr/Downloads/ComplianceChecker_Final_V5 2/backend/compliance-sheet-sa-3ba36d21bcc4.json"

SHEET_ID = os.getenv("GOOGLE_SHEETS_ID")



def get_sheet():
    creds = Credentials.from_service_account_file(SERVICE_FILE, scopes=SCOPES)
    client = gspread.authorize(creds)
    return client.open_by_key(SHEET_ID)

def write_history(filename, risk_score, missing_count):
    import traceback
    try:
        print(">>> DEBUG: SERVICE_FILE =", SERVICE_FILE)
        print(">>> DEBUG: SHEET_ID =", SHEET_ID)

        sheet = get_sheet()
        ws = sheet.sheet1  # first tab

        print(">>> DEBUG: Connected to sheet successfully. Writing row...")

        ws.append_row([filename, risk_score, missing_count, datetime.now().isoformat()])

        print(">>> DEBUG: Row written successfully.")
        return True

    except Exception as e:
        print("\n❌ FULL TRACEBACK:")
        traceback.print_exc()
        print("❌ ERROR MESSAGE:", e)
        return False

def write_email_log(to_email, subject, body):
    try:
        sheet = get_sheet()
        try:
            ws = sheet.worksheet("email_alerts")
        except:
            # sheet doesn't exist
            ws = sheet.add_worksheet("email_alerts", rows=1000, cols=4)
            ws.append_row(["to_email", "subject", "body", "timestamp"])

        ws.append_row([
            to_email,
            subject,
            body,
            datetime.now().isoformat()
        ])
        return True
    except Exception as e:
        print("EMAIL LOG ERROR:", e)
        return False


def read_missing_clauses():
    try:
        sheet = get_sheet()
        try:
            ws = sheet.worksheet("missing_clauses")
        except:
            return []
        
        rows = ws.get_all_records()
        return rows
    except Exception as e:
        print("SHEET READ ERROR:", e)
        return []
# backend/google_sheet.py
# (keep your existing imports and functions above)

# backend/google_sheet.py
# (keep your existing imports and functions above)

def read_history_rows():
    """
    Read the sheet (first tab) and return a normalized list of history records:
    [{ filename, risk_score, missing_count, timestamp }, ...]
    """
    try:
        sheet = get_sheet()
        ws = sheet.sheet1
        rows = ws.get_all_records()  # returns list of dicts using header row keys

        normalized = []
        for r in rows:
            normalized.append({
                "filename": r.get("filename") or r.get("file") or r.get("Filename") or "",
                "risk_score": int(r.get("risk_score") or r.get("risk") or 0),
                "missing_count": int(r.get("missing_count") or r.get("missing") or 0),
                "timestamp": r.get("timestamp") or r.get("time") or None
            })
        return normalized
    except Exception as e:
        print("SHEET READ ERROR:", e)
        return []
