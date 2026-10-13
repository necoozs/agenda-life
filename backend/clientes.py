
import csv
from pathlib import Path
from datetime import datetime

# Localiza o CSV na pasta database/csv do projeto
ARQUIVO_CLIENTES = (
    Path(__file__).resolve().parent.parent
    / "database"
    / "csv"
    / "clientes.csv"
)


def listar_clientes():
    """Retorna todos os clientes cadastrados."""
    if not ARQUIVO_CLIENTES.exists():
        return []

    with ARQUIVO_CLIENTES.open(
        mode="r",
        newline="",
        encoding="utf-8-sig"
    ) as arquivo:
        leitor = csv.DictReader(arquivo)
        return list(leitor)


def cadastrar_cliente(nome: str, telefone: str):
    """Salva um cliente no arquivo CSV."""
    nome = nome.strip()
    telefone = telefone.strip()

    if not nome:
        raise ValueError("O nome é obrigatório.")

    if not telefone:
        raise ValueError("O telefone é obrigatório.")

    clientes = listar_clientes()

    # Evita cadastrar novamente o mesmo telefone
    if any(
        cliente["telefone"] == telefone
        for cliente in clientes
    ):
        raise ValueError("Já existe uma cliente com esse telefone.")

    novo_id = max(
        (int(cliente["id"]) for cliente in clientes),
        default=0
    ) + 1

    novo_cliente = {
        "id": str(novo_id),
        "nome": nome,
        "telefone": telefone,
        "data_cadastro": datetime.now().isoformat(
            timespec="seconds"
        )
    }

    with ARQUIVO_CLIENTES.open(
        mode="a",
        newline="",
        encoding="utf-8"
    ) as arquivo:
        escritor = csv.DictWriter(
            arquivo,
            fieldnames=[
                "id",
                "nome",
                "telefone",
                "data_cadastro"
            ]
        )
        escritor.writerow(novo_cliente)

    return novo_cliente
