
import csv
from pathlib import Path
from decimal import Decimal, InvalidOperation

ARQUIVO_SERVICOS = (
    Path(__file__).resolve().parent.parent
    / "database"
    / "csv"
    / "servicos.csv"
)

CAMPOS = [
    "id",
    "nome",
    "descricao",
    "preco",
    "duracao_minutos",
    "ativo",
]


def _ler_todos_servicos():
    if not ARQUIVO_SERVICOS.exists():
        return []

    with ARQUIVO_SERVICOS.open(
        "r",
        newline="",
        encoding="utf-8-sig",
    ) as arquivo:
        return [
            {
                **servico,
                "ativo": servico.get("ativo", "true") or "true",
            }
            for servico in csv.DictReader(arquivo)
        ]


def listar_servicos():
    return [
        servico
        for servico in _ler_todos_servicos()
        if servico["ativo"].strip().lower() == "true"
    ]


def cadastrar_servico(
    nome: str,
    descricao: str,
    preco: Decimal,
    duracao_minutos: int,
):
    nome = nome.strip()
    descricao = descricao.strip()

    if not nome:
        raise ValueError("O nome do serviço é obrigatório.")

    try:
        preco = Decimal(str(preco))
    except (InvalidOperation, ValueError):
        raise ValueError("O preço informado é inválido.")

    if not preco.is_finite() or preco < 0:
        raise ValueError("O preço não pode ser negativo.")

    if duracao_minutos <= 0:
        raise ValueError("A duração deve ser maior que zero.")

    servicos = _ler_todos_servicos()

    if any(
        servico["nome"].casefold() == nome.casefold()
        and servico["ativo"].strip().lower() == "true"
        for servico in servicos
    ):
        raise ValueError("Já existe um serviço ativo com esse nome.")

    novo_id = max(
        (int(servico["id"]) for servico in servicos),
        default=0,
    ) + 1

    novo_servico = {
        "id": str(novo_id),
        "nome": nome,
        "descricao": descricao,
        "preco": f"{preco:.2f}",
        "duracao_minutos": str(duracao_minutos),
        "ativo": "true",
    }

    ARQUIVO_SERVICOS.parent.mkdir(parents=True, exist_ok=True)

    arquivo_existe = ARQUIVO_SERVICOS.exists()
    precisa_cabecalho = (
        not arquivo_existe or ARQUIVO_SERVICOS.stat().st_size == 0
    )

    with ARQUIVO_SERVICOS.open(
        "a",
        newline="",
        encoding="utf-8",
    ) as arquivo:
        escritor = csv.DictWriter(
            arquivo,
            fieldnames=CAMPOS,
        )

        if precisa_cabecalho:
            escritor.writeheader()

        escritor.writerow(novo_servico)

    return novo_servico


def desativar_servico(servico_id: int):
    servicos = _ler_todos_servicos()

    servico_encontrado = next(
        (
            servico
            for servico in servicos
            if int(servico["id"]) == servico_id
        ),
        None,
    )

    if servico_encontrado is None:
        raise ValueError("Serviço não encontrado.")

    if servico_encontrado["ativo"].strip().lower() != "true":
        raise ValueError("Este serviço já está desativado.")

    servico_encontrado["ativo"] = "false"

    arquivo_temporario = ARQUIVO_SERVICOS.with_suffix(".tmp")

    with arquivo_temporario.open(
        "w",
        newline="",
        encoding="utf-8",
    ) as arquivo:
        escritor = csv.DictWriter(
            arquivo,
            fieldnames=CAMPOS,
        )
        escritor.writeheader()
        escritor.writerows(servicos)

    arquivo_temporario.replace(ARQUIVO_SERVICOS)

    return {
        "mensagem": "Serviço desativado com sucesso.",
        "id": servico_id,
    }


def editar_servico(
    servico_id: int,
    nome: str,
    descricao: str,
    preco: Decimal,
    duracao_minutos: int,
):
    nome = nome.strip()
    descricao = descricao.strip()

    if not nome:
        raise ValueError("O nome do serviço é obrigatório.")

    try:
        preco = Decimal(str(preco))
    except (InvalidOperation, ValueError):
        raise ValueError("O preço informado é inválido.")

    if not preco.is_finite() or preco < 0:
        raise ValueError("O preço não pode ser negativo.")

    if duracao_minutos <= 0 or duracao_minutos > 1440:
        raise ValueError("A duração deve ser de 1 a 1440 minutos.")

    servicos = _ler_todos_servicos()

    servico_encontrado = next(
        (s for s in servicos if int(s["id"]) == servico_id),
        None,
    )

    if servico_encontrado is None:
        raise ValueError("Serviço não encontrado.")

    if servico_encontrado["ativo"].strip().lower() != "true":
        raise ValueError("Não é possível editar um serviço desativado.")

    if any(
        s["nome"].casefold() == nome.casefold()
        and int(s["id"]) != servico_id
        and s["ativo"].strip().lower() == "true"
        for s in servicos
    ):
        raise ValueError("Já existe outro serviço ativo com esse nome.")

    servico_encontrado.update({
        "nome": nome,
        "descricao": descricao,
        "preco": f"{preco:.2f}",
        "duracao_minutos": str(duracao_minutos),
    })

    arquivo_temporario = ARQUIVO_SERVICOS.with_suffix(".tmp")

    with arquivo_temporario.open(
        "w",
        newline="",
        encoding="utf-8",
    ) as arquivo:
        escritor = csv.DictWriter(arquivo, fieldnames=CAMPOS)
        escritor.writeheader()
        escritor.writerows(servicos)

    arquivo_temporario.replace(ARQUIVO_SERVICOS)

    return servico_encontrado
