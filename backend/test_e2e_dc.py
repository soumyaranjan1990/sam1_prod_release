import requests
import json
import uuid

BASE_URL = "http://localhost:8000/api/v1"

# We know from previous DB state:
# User 1 is CMD (Admin)
# User 2 is CO
# User 3 is EO
# User 4 is Employee
# User 5 is DA
# User 6 is CC

# Login helper
def login(username, password="password"):
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": username, "password": password})
    return res.json()['access_token']

tokens = {
    'CMD': login('cmd_user'),
    'CO': login('co_user'),
    'EO': login('eo_user'),
    'EMP': login('emp_user'),
    'DA': login('da_user'),
    'CC': login('cc_user')
}

def auth(role):
    return {"Authorization": f"Bearer {tokens[role]}"}

def upload_dummy_file(role, filename="dummy.txt"):
    files = {"file": (filename, b"dummy content", "text/plain")}
    res = requests.post(f"{BASE_URL}/complaints/upload", files=files, headers=auth(role))
    return res.json()['document_path']

def test_minor_workflow():
    print("--- Testing Minor Penalty Workflow ---")
    # 1. Register Complaint (Emp)
    emp_token = tokens['EMP']
    # Get emp user ID for registration
    user_info = requests.get(f"{BASE_URL}/auth/me", headers=auth('EMP')).json()
    emp_user_id = user_info.get('id', 1)

    res = requests.post(f"{BASE_URL}/complaints/", headers=auth('EMP'), json={
        "complaint_title": "Minor Test",
        "details": "testing minor",
        "incident_date": "2026-01-01",
        "employee_id": "emp_user",
        "employee_name": "Test Employee",
        "registered_by_id": emp_user_id
    })
    if res.status_code != 200 and res.status_code != 201:
        print("Error registering complaint:", res.text)
        return
    c_id = res.json()['id']
    print(f"Complaint {c_id} registered")
    
    import sqlite3
    conn = sqlite3.connect('dcmts_fastapi.db')
    case_id_row = conn.execute('SELECT id FROM "case" WHERE complaint_id = ?', (c_id,)).fetchone()
    case_id = case_id_row[0]
    
    eo_info = requests.get(f"{BASE_URL}/auth/me", headers=auth('EO')).json()
    eo_user_id = eo_info.get('id', 3)
    
    # 2. Assign to EO (CMD) -> creates Case
    res = requests.patch(f"{BASE_URL}/cases/{case_id}/assign", headers=auth('CMD'), json={
        "enquiry_officer_id": eo_user_id
    })
    print("Assigned to EO:", res.status_code)

    # 3. EO Enquiry Action
    dummy_report = upload_dummy_file('EO')
    res = requests.put(f"{BASE_URL}/cases/{case_id}/enquiry-action", headers=auth('EO'), json={
        "verdict": "PROVED",
        "gravity": "MINOR",
        "enquiry_report_path": dummy_report
    })
    print("EO Proved Allegation:", res.status_code, res.text if res.status_code != 200 else "")

    # 4. DA Issue Show Cause
    res = requests.put(f"{BASE_URL}/cases/{case_id}/da-action", headers=auth('DA'), json={
        "action_type": "ISSUE_SHOW_CAUSE",
        "comments": "Please serve this."
    })
    print("DA Action (Show Cause):", res.status_code)

    # 5. CO Serve Notice
    dummy_proof = upload_dummy_file('CO')
    res = requests.put(f"{BASE_URL}/cases/{case_id}/co-action", headers=auth('CO'), json={
        "action_type": "SERVE_SHOW_CAUSE",
        "proof_path": dummy_proof,
        "served_date": "2026-03-25"
    })
    print("CO Action (Serve Show Cause):", res.status_code)

    # 6. Employee Response
    dummy_exp = upload_dummy_file('EMP')
    res = requests.put(f"{BASE_URL}/cases/{case_id}/employee-response", headers=auth('EMP'), json={
        "action_type": "EXPLANATION",
        "document_path": dummy_exp
    })
    print("EMP Action (Submit Explanation):", res.status_code)

    # 7. DA Final Order
    res = requests.put(f"{BASE_URL}/cases/{case_id}/da-action", headers=auth('DA'), json={
        "action_type": "ISSUE_FINAL_ORDER",
        "comments": "Final minor penalty issued."
    })
    print("DA Action (Final Order):", res.status_code)

    # 8. CO Serve Final Order
    res = requests.put(f"{BASE_URL}/cases/{case_id}/co-action", headers=auth('CO'), json={
        "action_type": "SERVE_FINAL_ORDER",
        "proof_path": upload_dummy_file('CO'),
        "served_date": "2026-03-29"
    })
    print("CO Action (Serve Final Order):", res.status_code)

def test_major_workflow():
    print("\n--- Testing Major Penalty Workflow (Ex-Parte & CC) ---")
    # 1. Register Complaint (Emp)
    user_info = requests.get(f"{BASE_URL}/auth/me", headers=auth('EMP')).json()
    emp_user_id = user_info.get('id', 1)

    res = requests.post(f"{BASE_URL}/complaints/", headers=auth('EMP'), json={
        "complaint_title": "Major Test",
        "details": "testing major",
        "incident_date": "2026-01-01",
        "employee_id": "emp_user",
        "employee_name": "Test Employee",
        "registered_by_id": emp_user_id
    })
    if res.status_code != 200 and res.status_code != 201:
        print("Error registering complaint:", res.text)
        return
    c_id = res.json()['id']
    
    import sqlite3
    conn = sqlite3.connect('dcmts_fastapi.db')
    case_id_row = conn.execute('SELECT id FROM "case" WHERE complaint_id = ?', (c_id,)).fetchone()
    case_id = case_id_row[0]
    
    eo_info = requests.get(f"{BASE_URL}/auth/me", headers=auth('EO')).json()
    eo_user_id = eo_info.get('id', 3)

    # 2. Assign to EO (CMD)
    requests.patch(f"{BASE_URL}/cases/{case_id}/assign", headers=auth('CMD'), json={"enquiry_officer_id": eo_user_id})

    # 3. EO Enquiry Action
    res = requests.put(f"{BASE_URL}/cases/{case_id}/enquiry-action", headers=auth('EO'), json={
        "verdict": "PROVED",
        "gravity": "MAJOR",
        "enquiry_report_path": upload_dummy_file('EO')
    })
    print("EO Action (Major):", res.status_code, res.text if res.status_code != 200 else "")
    
    # 4. DA Issue Charge Memo
    res = requests.put(f"{BASE_URL}/cases/{case_id}/da-action", headers=auth('DA'), json={
        "action_type": "ISSUE_CHARGE_MEMO",
        "comments": "Please serve this memo."
    })
    print("DA Action (Charge Memo):", res.status_code, res.text)
    
    # Let's say CO serves it
    res = requests.put(f"{BASE_URL}/cases/{case_id}/co-action", headers=auth('CO'), json={
        "action_type": "SERVE_SHOW_CAUSE", 
        "proof_path": upload_dummy_file('CO'),
        "served_date": "2026-03-01"
    })
    print("CO Action (Serve Memo):", res.status_code)

    # DA proceeds Ex-Parte because of timeout
    res = requests.put(f"{BASE_URL}/cases/{case_id}/da-action", headers=auth('DA'), json={
        "action_type": "ISSUE_EX_PARTE",
        "comments": "Employee did not reply in 15 days."
    })
    print("DA Action (Proceed Ex-Parte):", res.status_code)

    # DA sends to CC
    res = requests.put(f"{BASE_URL}/cases/{case_id}/da-action", headers=auth('DA'), json={
        "action_type": "SEND_TO_CC",
        "comments": "Major penalty ex-parte, needs concurrence."
    })
    print("DA Action (Send to CC):", res.status_code)

    # CC Action
    res = requests.put(f"{BASE_URL}/cases/{case_id}/cc-action", headers=auth('CC'), json={
        "verdict": "CONCUR",
        "comments": "We agree."
    })
    print("CC Action (Concur):", res.status_code)

    # DA Final Order
    res = requests.put(f"{BASE_URL}/cases/{case_id}/da-action", headers=auth('DA'), json={
        "action_type": "ISSUE_FINAL_ORDER",
        "comments": "Final major penalty issued."
    })
    print("DA Action (Final Order):", res.status_code)

if __name__ == "__main__":
    test_minor_workflow()
    test_major_workflow()
