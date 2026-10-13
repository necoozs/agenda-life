
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


def listar_servicos():
    if not ARQUIVO_SERVICOS.exists():
        return []

    with ARQUIVO_SERVICOS.open(
        "r",
        newline="",
        encoding="utf-8-sig",
    ) as arquivo:
        return list(csv.DictReader(arquivo))


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

    servicos = listar_servicos()

    if any(
        servico["nome"].casefold() == nome.casefold()
        for servico in servicos
    ):
        raise ValueError("Já existe um serviço com esse nome.")

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

    with ARQUIVO_SERVICOS.open(
        "a",
        newline="",
        encoding="utf-8",
    ) as arquivo:
        escritor = csv.DictWriter(
            arquivo,
            fieldnames=CAMPOS,
        )
        escritor.writerow(novo_servico)

    return novo_servico
