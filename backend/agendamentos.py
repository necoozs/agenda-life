
import csv
from datetime import datetime, date, time, timedelta
from decimal import Decimal
from pathlib import Path

from clientes import listar_clientes
from servicos import listar_servicos


ARQUIVO_AGENDAMENTOS = (
    Path(__file__).resolve().parent.parent
    / "database"
    / "csv"
    / "agendamentos.csv"
)

CAMPOS = [
    "id",
    "cliente_id",
    "servico_id",
    "data",
    "hora",
    "duracao_minutos",
    "preco",
    "status",
    "observacoes",
    "data_criacao",
]


def listar_agendamentos():
    if not ARQUIVO_AGENDAMENTOS.exists():
        return []

    with ARQUIVO_AGENDAMENTOS.open(
        "r",
        newline="",
        encoding="utf-8-sig",
    ) as arquivo:
        return list(csv.DictReader(arquivo))


def salvar_agendamentos(agendamentos):
    with ARQUIVO_AGENDAMENTOS.open(
        "w",
        newline="",
        encoding="utf-8",
    ) as arquivo:
        escritor = csv.DictWriter(
            arquivo,
            fieldnames=CAMPOS,
        )
        escritor.writeheader()
        escritor.writerows(agendamentos)


def validar_horario(
    data_agendamento,
    hora_agendamento,
    duracao_minutos,
    agendamentos,
    ignorar_id=None,
):
    inicio = datetime.combine(
        data_agendamento,
        hora_agendamento,
    )
    fim = inicio + timedelta(minutes=duracao_minutos)

    for existente in agendamentos:
        if existente["status"] == "cancelado":
            continue

        if (
            ignorar_id is not None
            and existente["id"] == str(ignorar_id)
        ):
            continue

        inicio_existente = datetime.combine(
            date.fromisoformat(existente["data"]),
            time.fromisoformat(existente["hora"]),
        )
        fim_existente = inicio_existente + timedelta(
            minutes=int(existente["duracao_minutos"])
        )

        if inicio < fim_existente and inicio_existente < fim:
            raise ValueError(
                "Este horário conflita com outro agendamento."
            )


def criar_agendamento(
    cliente_id: int,
    servico_id: int,
    data_agendamento: date,
    hora_agendamento: time,
    duracao_minutos: int | None = None,
    observacoes: str = "",
):
    clientes = listar_clientes()
    servicos = listar_servicos()

    cliente = next(
        (
            item for item in clientes
            if item["id"] == str(cliente_id)
        ),
        None,
    )

    if cliente is None:
        raise ValueError("Cliente não encontrado.")

    servico = next(
        (
            item for item in servicos
            if item["id"] == str(servico_id)
        ),
        None,
    )

    if servico is None:
        raise ValueError("Serviço não encontrado.")

    if servico["ativo"].strip().lower() != "true":
        raise ValueError("Este serviço está inativo.")

    duracao = (
        duracao_minutos
        if duracao_minutos is not None
        else int(servico["duracao_minutos"])
    )

    if duracao <= 0 or duracao > 1440:
        raise ValueError(
            "A duração deve estar entre 1 e 1440 minutos."
        )

    agendamentos = listar_agendamentos()

    validar_horario(
        data_agendamento,
        hora_agendamento,
        duracao,
        agendamentos,
    )

    novo_id = max(
        (int(item["id"]) for item in agendamentos),
        default=0,
    ) + 1

    novo_agendamento = {
        "id": str(novo_id),
        "cliente_id": str(cliente_id),
        "servico_id": str(servico_id),
        "data": data_agendamento.isoformat(),
        "hora": hora_agendamento.strftime("%H:%M"),
        "duracao_minutos": str(duracao),
        "preco": f"{Decimal(servico['preco']):.2f}",
        "status": "agendado",
        "observacoes": observacoes.strip(),
        "data_criacao": datetime.now().isoformat(
            timespec="seconds"
        ),
    }

    agendamentos.append(novo_agendamento)
    salvar_agendamentos(agendamentos)

    return novo_agendamento


def editar_agendamento(
    agendamento_id: int,
    cliente_id: int,
    servico_id: int,
    data_agendamento: date,
    hora_agendamento: time,
    duracao_minutos: int | None = None,
    observacoes: str = "",
):
    agendamentos = listar_agendamentos()

    agendamento = next(
        (
            item for item in agendamentos
            if item["id"] == str(agendamento_id)
        ),
        None,
    )

    if agendamento is None:
        raise ValueError("Agendamento não encontrado.")

    if agendamento["status"] == "cancelado":
        raise ValueError(
            "Não é possível editar um agendamento cancelado."
        )

    cliente = next(
        (
            item for item in listar_clientes()
            if item["id"] == str(cliente_id)
        ),
        None,
    )

    if cliente is None:
        raise ValueError("Cliente não encontrado.")

    servico = next(
        (
            item for item in listar_servicos()
            if item["id"] == str(servico_id)
        ),
        None,
    )

    if servico is None:
        raise ValueError("Serviço não encontrado.")

    if servico["ativo"].strip().lower() != "true":
        raise ValueError("Este serviço está inativo.")

    duracao = (
        duracao_minutos
        if duracao_minutos is not None
        else int(servico["duracao_minutos"])
    )

    if duracao <= 0 or duracao > 1440:
        raise ValueError(
            "A duração deve estar entre 1 e 1440 minutos."
        )

    validar_horario(
        data_agendamento,
        hora_agendamento,
        duracao,
        agendamentos,
        ignorar_id=agendamento_id,
    )

    agendamento["cliente_id"] = str(cliente_id)
    agendamento["servico_id"] = str(servico_id)
    agendamento["data"] = data_agendamento.isoformat()
    agendamento["hora"] = hora_agendamento.strftime("%H:%M")
    agendamento["duracao_minutos"] = str(duracao)
    agendamento["preco"] = f"{Decimal(servico['preco']):.2f}"
    agendamento["observacoes"] = observacoes.strip()

    salvar_agendamentos(agendamentos)

    return agendamento


def cancelar_agendamento(agendamento_id: int):
    agendamentos = listar_agendamentos()

    agendamento = next(
        (
            item for item in agendamentos
            if item["id"] == str(agendamento_id)
        ),
        None,
    )

    if agendamento is None:
        raise ValueError("Agendamento não encontrado.")

    if agendamento["status"] == "cancelado":
        raise ValueError("Este agendamento já está cancelado.")

    agendamento["status"] = "cancelado"

    salvar_agendamentos(agendamentos)

    return agendamento
