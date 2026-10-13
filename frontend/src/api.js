
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/$/, "");

async function requisicao(caminho, opcoes = {}) {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    headers: {
      "Content-Type": "application/json",
      ...opcoes.headers,
    },
  });

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagem =
      dados?.detail || "Não foi possível concluir a solicitação.";

    throw new Error(
      typeof mensagem === "string"
        ? mensagem
        : JSON.stringify(mensagem)
    );
  }

  return dados;
}

export function listarServicos() {
  return requisicao("/servicos");
}

export function listarClientes() {
  return requisicao("/clientes");
}

export function criarCliente(cliente) {
  return requisicao("/clientes", {
    method: "POST",
    body: JSON.stringify(cliente),
  });
}

export function listarAgendamentos() {
  return requisicao("/agendamentos");
}

export function criarAgendamento(agendamento) {
  return requisicao("/agendamentos", {
    method: "POST",
    body: JSON.stringify(agendamento),
  });
}
