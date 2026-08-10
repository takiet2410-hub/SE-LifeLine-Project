import os
from fastapi import Request, HTTPException
from jose import jwt, JWTError
from dotenv import load_dotenv

load_dotenv()

SECRET_CURRENT = os.getenv("AI_SERVICE_TOKEN_SECRET_CURRENT")
SECRET_PREVIOUS = os.getenv("AI_SERVICE_TOKEN_SECRET_PREVIOUS")

def verify_token(req: Request):
    auth_header = req.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid Authorization header")

    token = auth_header.split(" ")[1]

    try:
        # Try current secret
        payload = jwt.decode(token, SECRET_CURRENT, algorithms=["HS256"])
        return payload
    except JWTError:
        # Fallback to previous secret
        if SECRET_PREVIOUS:
            try:
                payload = jwt.decode(token, SECRET_PREVIOUS, algorithms=["HS256"])
                return payload
            except JWTError:
                pass
        raise HTTPException(status_code=401, detail="Invalid token")
