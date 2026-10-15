
import os
from datetime import datetime, timedelta, timezone

import jwt
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pwdlib import PasswordHash

load_dotenv()

JWT_SECRET = os.getenv("JWT_SECRET", "")
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "").strip().lower()
ADMIN_PASSWORD_HASH = os.getenv("ADMIN_PASSWORD_HASH", "")
JWT_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))

password_hash = PasswordHash.recommended()
bearer = HTTPBearer(auto_error=False)


def autenticar_admin(email: str, senha: str):
    if not JWT_SECRET or len(JWT_SECRET) < 40:
        raise RuntimeError("JWT_SECRET não configurado corretamente.")

    if not ADMIN_EMAIL or not ADMIN_PASSWORD_HASH:
        raise RuntimeError("Configure o administrador no .env.")

    if email.strip().lower() != ADMIN_EMAIL:
        return None

    if not password_hash.verify(senha, ADMIN_PASSWORD_HASH):
        return None

    agora = datetime.now(timezone.utc)

    return jwt.encode(
        {
            "sub": ADMIN_EMAIL,
            "iat": agora,
            "exp": agora + timedelta(minutes=JWT_EXPIRE_MINUTES),
        },
        JWT_SECRET,
        algorithm="HS256",
    )


def exigir_admin(
    credenciais: HTTPAuthorizationCredentials | None = Depends(bearer),
):
    if credenciais is None:
        raise HTTPException(
            status_code=401,
            detail="Faça login para acessar esta área.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        dados = jwt.decode(
            credenciais.credentials,
            JWT_SECRET,
            algorithms=["HS256"],
        )

        if dados.get("sub") != ADMIN_EMAIL:
            raise HTTPException(status_code=401, detail="Token inválido.")

        return dados["sub"]

    except jwt.PyJWTError:
        raise HTTPException(
            status_code=401,
            detail="Sessão inválida ou expirada.",
            headers={"WWW-Authenticate": "Bearer"},
        )
