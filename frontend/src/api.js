
import { apiFetch } from "./services/api";

// SERVIÇOS
export function listarServicos() {
  return apiFetch("/servicos");
}

export function criarServico(servico) {
  return apiFetch("/servicos", {
    method: "POST",
    body: JSON.stringify(servico),
  });
}

export function editarServico(id, servico) {
  return apiFetch(`/servicos/${id}`, {
    method: "PUT",
    body: JSON.stringify(servico),
  });
}

export function removerServico(id) {
  return apiFetch(`/servicos/${id}`, {
    method: "DELETE",
  });
}

// CLIENTES
export function listarClientes() {
  return apiFetch("/clientes");
}

export function criarCliente(cliente) {
  return apiFetch("/clientes", {
    method: "POST",
    body: JSON.stringify(cliente),
  });
}

// AGENDAMENTOS
export function listarAgendamentos() {
  return apiFetch("/agendamentos");
}

export function criarAgendamento(agendamento) {
  return apiFetch("/agendamentos", {
    method: "POST",
    body: JSON.stringify(agendamento),
  });
}

export function editarAgendamento(id, agendamento) {
  return apiFetch(`/agendamentos/${id}`, {
    method: "PUT",
    body: JSON.stringify(agendamento),
  });
}

export function cancelarAgendamento(id) {
  return apiFetch(`/agendamentos/${id}/cancelar`, {
    method: "PATCH",
  });
}
