
from datetime import date, time
from decimal import Decimal

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from auth import autenticar_admin, exigir_admin
from clientes import cadastrar_cliente, listar_clientes
from servicos import (
    cadastrar_servico,
    listar_servicos,
    desativar_servico,
    editar_servico,
)
from agendamentos import (
    listar_agendamentos,
    criar_agendamento,
    editar_agendamento,
    cancelar_agendamento,
)


# =========================================================
# APLICACAO PRINCIPAL
# =========================================================

app = FastAPI(
    title="Agenda Life API",
    description="API do sistema de gestão para estética",
    version="1.2.0",
)


# =========================================================
# CONFIGURACAO CORS
# =========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.1.25:5173",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# MODELOS DE ENTRADA
# =========================================================

class LoginEntrada(BaseModel):
    email: str
    senha: str


class ClienteEntrada(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    telefone: str = Field(min_length=8, max_length=20)


class ServicoEntrada(BaseModel):
    nome: str = Field(min_length=1, max_length=100)
    descricao: str = Field(default="", max_length=500)
    preco: Decimal = Field(
        ge=0,
        max_digits=10,
        decimal_places=2,
    )
    duracao_minutos: int = Field(gt=0, le=1440)


class AgendamentoEntrada(BaseModel):
    cliente_id: int = Field(gt=0)
    servico_id: int = Field(gt=0)
    data: date
    hora: time
    duracao_minutos: int | None = Field(
        default=None,
        gt=0,
        le=1440,
    )
    observacoes: str = Field(default="", max_length=500)


# =========================================================
# ROTAS GERAIS
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Agenda Life API funcionando",
        "salao": "Esteticista Kenia Rodrigues",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


# =========================================================
# AUTENTICACAO ADMINISTRATIVA
# =========================================================

@app.post("/auth/login")
def login_admin(dados: LoginEntrada):
    try:
        token = autenticar_admin(dados.email, dados.senha)
    except RuntimeError as erro:
        raise HTTPException(
            status_code=500,
            detail=str(erro),
        ) from erro

    if not token:
        raise HTTPException(
            status_code=401,
            detail="E-mail ou senha incorretos.",
        )

    return {
        "access_token": token,
        "token_type": "bearer",
    }


# =========================================================
# ROTAS DE CLIENTES
# =========================================================

@app.get("/clientes")
def obter_clientes(admin: str = Depends(exigir_admin)):
    return listar_clientes()


@app.post("/clientes", status_code=201)
def criar_cliente(cliente: ClienteEntrada):
    try:
        return cadastrar_cliente(
            nome=cliente.nome,
            telefone=cliente.telefone,
        )
    except ValueError as erro:
        raise HTTPException(
            status_code=400,
            detail=str(erro),
        ) from erro


# =========================================================
# ROTAS DE SERVICOS
# =========================================================

@app.get("/servicos")
def obter_servicos():
    return listar_servicos()


@app.post("/servicos", status_code=201)
def criar_servico(
    servico: ServicoEntrada,
    admin: str = Depends(exigir_admin),
):
    try:
        return cadastrar_servico(
            nome=servico.nome,
            descricao=servico.descricao,
            preco=Decimal(str(servico.preco)),
            duracao_minutos=servico.duracao_minutos,
        )
    except ValueError as erro:
        raise HTTPException(
            status_code=400,
            detail=str(erro),
        ) from erro


@app.delete("/servicos/{servico_id}")
def remover_servico_api(
    servico_id: int,
    admin: str = Depends(exigir_admin),
):
    try:
        return desativar_servico(servico_id)
    except ValueError as erro:
        raise HTTPException(
            status_code=400,
            detail=str(erro),
        ) from erro


@app.put("/servicos/{servico_id}")
def atualizar_servico(
    servico_id: int,
    servico: ServicoEntrada,
    admin: str = Depends(exigir_admin),
):
    try:
        return editar_servico(
            servico_id=servico_id,
            nome=servico.nome,
            descricao=servico.descricao,
            preco=Decimal(str(servico.preco)),
            duracao_minutos=servico.duracao_minutos,
        )
    except ValueError as erro:
        raise HTTPException(
            status_code=400,
            detail=str(erro),
        ) from erro


# =========================================================
# ROTAS DE AGENDAMENTOS
# =========================================================

@app.get("/agendamentos")
def obter_agendamentos(admin: str = Depends(exigir_admin)):
    return listar_agendamentos()


@app.post("/agendamentos", status_code=201)
def registrar_agendamento(agendamento: AgendamentoEntrada):
    try:
        return criar_agendamento(
            cliente_id=agendamento.cliente_id,
            servico_id=agendamento.servico_id,
            data_agendamento=agendamento.data,
            hora_agendamento=agendamento.hora,
            duracao_minutos=agendamento.duracao_minutos,
            observacoes=agendamento.observacoes,
        )
    except ValueError as erro:
        raise HTTPException(
            status_code=400,
            detail=str(erro),
        ) from erro


@app.put("/agendamentos/{agendamento_id}")
def atualizar_agendamento(
    agendamento_id: int,
    agendamento: AgendamentoEntrada,
    admin: str = Depends(exigir_admin),
):
    try:
        return editar_agendamento(
            agendamento_id=agendamento_id,
            cliente_id=agendamento.cliente_id,
            servico_id=agendamento.servico_id,
            data_agendamento=agendamento.data,
            hora_agendamento=agendamento.hora,
            duracao_minutos=agendamento.duracao_minutos,
            observacoes=agendamento.observacoes,
        )
    except ValueError as erro:
        raise HTTPException(
            status_code=400,
            detail=str(erro),
        ) from erro


@app.patch("/agendamentos/{agendamento_id}/cancelar")
def cancelar_agendamento_api(
    agendamento_id: int,
    admin: str = Depends(exigir_admin),
):
    try:
        return cancelar_agendamento(agendamento_id)
    except ValueError as erro:
        raise HTTPException(
            status_code=400,
            detail=str(erro),
        ) from erro
