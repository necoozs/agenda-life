
from datetime import date, time
from decimal import Decimal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from clientes import cadastrar_cliente, listar_clientes
from servicos import cadastrar_servico, listar_servicos
from agendamentos import (
    criar_agendamento,
    listar_agendamentos,
    editar_agendamento,
    cancelar_agendamento,
)


app = FastAPI(
    title="Agenda Life API",
    description="API do sistema de gestão para estética",
    version="1.1.0",
)


# CONFIGURAÇÃO CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://192.168.1.25:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# MODELOS DE ENTRADA

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


# ROTAS GERAIS

@app.get("/")
def root():
    return {
        "message": "Agenda Life API funcionando",
        "salao": "Esteticista Kenia Rodrigues",
    }


@app.get("/health")
def health():
    return {"status": "ok"}


# ROTAS DE CLIENTES

@app.get("/clientes")
def obter_clientes():
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


# ROTAS DE SERVIÇOS

@app.get("/servicos")
def obter_servicos():
    return listar_servicos()


@app.post("/servicos", status_code=201)
def criar_servico(servico: ServicoEntrada):
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


# ROTAS DE AGENDAMENTOS

@app.get("/agendamentos")
def obter_agendamentos():
    return listar_agendamentos()


@app.post("/agendamentos", status_code=201)
def registrar_agendamento(
    agendamento: AgendamentoEntrada,
):
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


# CANCELAMENTO

@app.patch("/agendamentos/{agendamento_id}/cancelar")
def cancelar_agendamento_api(agendamento_id: int):
    try:
        return cancelar_agendamento(agendamento_id)
    except ValueError as erro:
        raise HTTPException(
            status_code=400,
            detail=str(erro),
        ) from erro
