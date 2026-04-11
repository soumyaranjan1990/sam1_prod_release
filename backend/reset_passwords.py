import sqlite3
from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash("password")
conn = sqlite3.connect('dcmts_fastapi.db')
cur = conn.cursor()
cur.execute("UPDATE user SET hashed_password = ? WHERE username IN ('cmd_user', 'co_user', 'eo_user', 'emp_user', 'da_user', 'cc_user')", (hashed,))
conn.commit()
print("Passwords updated.")
