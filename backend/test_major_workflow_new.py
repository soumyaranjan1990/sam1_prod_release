import requests
import json
import time

BASE_URL = "http://localhost:8000/api/v1"

def login(username, password="password123"):
    res = requests.post(f"{BASE_URL}/auth/login", data={"username": username, "password": password})
    return res.json()['access_token']

tokens = {
    'CMD': login('cmd_user'),
    'CO': login('cont_user'),
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

def test_major_workflow_full():
    print("\n--- Testing Full Major Penalty Workflow (New Implementation) ---")
    
    # 1. Register Complaint
    user_info = requests.get(f"{BASE_URL}/auth/me", headers=auth('EMP')).json()
    emp_user_id = user_info.get('id', 1)

    res = requests.post(f"{BASE_URL}/complaints/", headers=auth('EMP'), json={
        "complaint_title": "Major Penalty Test",
        "details": "testing full major workflow logic",
        "incident_date": "2026-04-13",
        "employee_id": "emp_user",
        "employee_name": "Test Employee",
        "registered_by_id": emp_user_id
    })
    if res.status_code != 200 and res.status_code != 201:
        print(f"Error registering complaint: {res.status_code} - {res.text}")
        return
    c_id = res.json()['id']
    print(f"Complaint {c_id} registered")
    
    # 2. Get Case ID from API
    cases = requests.get(f"{BASE_URL}/cases/", headers=auth('CMD')).json()
    case = next((c for c in cases if c['complaint_id'] == c_id), None)
    if not case:
        print(f"Error: Case for complaint {c_id} not found via API")
        return
    case_id = case['id']
    print(f"Case {case_id} found via API")
    
    # 2. Assign EO
    eo_info = requests.get(f"{BASE_URL}/auth/me", headers=auth('EO')).json()
    requests.patch(f"{BASE_URL}/cases/{case_id}/assign", headers=auth('CMD'), json={"enquiry_officer_id": eo_info['id']})
    print("Assigned to EO")

    # 3. EO Action (MAJOR)
    requests.put(f"{BASE_URL}/cases/{case_id}/enquiry-action", headers=auth('EO'), json={
        "verdict": "PROVED",
        "gravity": "MAJOR",
        "enquiry_report_path": upload_dummy_file('EO')
    })
    print("EO verdict Proved (MAJOR)")

    # 4. DA Issue Charge Memo
    requests.put(f"{BASE_URL}/cases/{case_id}/da-action", headers=auth('DA'), json={
        "action_type": "ISSUE_CHARGE_MEMO",
        "comments": "Issue charge memo for major penalty"
    })
    print("DA issued Charge Memo")

    # 5. CO Serve & Set Window
    res = requests.put(f"{BASE_URL}/cases/{case_id}/co-action", headers=auth('CO'), json={
        "action_type": "SERVE_SHOW_CAUSE",
        "served_date": "2026-04-13",
        "proof_path": upload_dummy_file('CO')
    })
    print("CO served memo, window started")
    
    # Check window_start_date
    case_data = requests.get(f"{BASE_URL}/cases/{case_id}", headers=auth('CO')).json()
    print(f"DEBUG case_data: {case_data}")
    print(f"Window start date: {case_data.get('window_start_date')}")
    assert case_data.get('window_start_date') is not None

    # 6. CO Submits Explanation to DA
    res = requests.put(f"{BASE_URL}/cases/{case_id}/co-action", headers=auth('CO'), json={
        "action_type": "SUBMIT_EXPLANATION",
        "explanation_path": upload_dummy_file('CO', "explanation.pdf"),
        "served_date": "2026-04-13"
    })
    print("CO submitted explanation to DA")
    
    case_data = requests.get(f"{BASE_URL}/cases/{case_id}", headers=auth('CO')).json()
    print(f"Status after CO submission: {case_data['status']}")
    assert case_data['status'] == 'UNDER_DA_REVIEW_MAJOR'
    assert case_data['window_start_date'] is None # Timer should stop

    # 7. DA Sends to CC
    res = requests.put(f"{BASE_URL}/cases/{case_id}/da-action", headers=auth('DA'), json={
        "action_type": "SEND_TO_CC",
        "comments": "Passing to CC for concurrence"
    })
    print("DA passed to CC")
    
    case_data = requests.get(f"{BASE_URL}/cases/{case_id}", headers=auth('DA')).json()
    print(f"Status after DA SEND_TO_CC: {case_data['status']}")
    assert case_data['status'] == 'UNDER_CC_REVIEW_MAJOR'

    # 8. CC Modifies & Refers to CMD
    res = requests.put(f"{BASE_URL}/cases/{case_id}/cc-action", headers=auth('CC'), json={
        "verdict": "MODIFY",
        "comments": "Penalty too harsh, reducing to something else",
        "modified_punishment": "Reduced Major Penalty"
    })
    print("CC modified and referred to CMD")
    
    case_data = requests.get(f"{BASE_URL}/cases/{case_id}", headers=auth('CC')).json()
    print(f"Status after CC MODIFY: {case_data['status']}")
    assert case_data['status'] == 'REFERRED_TO_CMD_BY_CC'
    assert case_data['cc_modified_details'] == "Reduced Major Penalty"

    # 9. CMD Issues Final Order
    res = requests.put(f"{BASE_URL}/cases/{case_id}/co-action", headers=auth('CMD'), json={
        "action_type": "SERVE_FINAL_ORDER",
        "served_date": "2026-04-13",
        "proof_path": "FINAL_DA_ORDER_CMD_APPROVED"
    })
    print("CMD issued final order")
    
    case_data = requests.get(f"{BASE_URL}/cases/{case_id}", headers=auth('CMD')).json()
    print(f"Status after CMD execution: {case_data['status']}")
    assert case_data['status'] == 'APPEAL_WINDOW_OPEN'

    print("\n--- Full Major Workflow Test PASSED ---")

if __name__ == "__main__":
    test_major_workflow_full()
