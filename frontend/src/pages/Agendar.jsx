
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  LoaderCircle,
} from "lucide-react";
import "./Agendar.css";

// =========================================================
// CONFIGURAÇÃO DA API
// =========================================================

const API_URL = (
  import.meta.env.VITE_API_URL ||
  "https://agenda-life.onrender.com"
).replace(/\/+$/, "");

// =========================================================
// HORÁRIOS DE ATENDIMENTO
// =========================================================

const PERIODOS = [
  { nome: "Manhã", inicio: 8 * 60, fim: 12 * 60 },
  { nome: "Tarde", inicio: 14 * 60, fim: 18 * 60 },
];

// =========================================================
// FUNÇÕES AUXILIARES
// =========================================================

function minutosParaHora(minutos) {
  const horas = String(Math.floor(minutos / 60)).padStart(2, "0");
  const mins = String(minutos % 60).padStart(2, "0");

  return `${horas}:${mins}`;
}

function formatarData(data) {
  if (!data) return "";

  const [ano, mes, dia] = data.split("-");

  return `${dia}/${mes}/${ano}`;
}

function duracaoDoServico(servico) {
  const duracao = Number(servico?.duracao_minutos);

  return Number.isFinite(duracao) && duracao > 0
    ? duracao
    : 60;
}

function horarioEmMinutos(hora) {
  if (!hora) return null;

  const partes = String(hora).match(/^(\d{1,2}):(\d{2})/);

  if (!partes) return null;

  return Number(partes[1]) * 60 + Number(partes[2]);
}

function agendamentoAtivo(agendamento) {
  const status = String(agendamento.status || "")
    .trim()
    .toLowerCase();

  return ![
    "cancelado",
    "cancelada",
    "canceled",
    "cancelled",
  ].includes(status);
}

// =========================================================
// CÁLCULO DOS HORÁRIOS DISPONÍVEIS
// =========================================================

function gerarHorarios(servico, data, agendamentos) {
  if (!servico || !data) return [];

  const duracao = duracaoDoServico(servico);

  const ocupados = agendamentos
    .filter(
      (item) =>
        item.data === data &&
        agendamentoAtivo(item)
    )
    .map((item) => {
      const inicio = horarioEmMinutos(item.hora);

      if (inicio === null) return null;

      const duracaoExistente =
        Number(item.duracao_minutos) > 0
          ? Number(item.duracao_minutos)
          : Number(item.servico?.duracao_minutos) > 0
            ? Number(item.servico.duracao_minutos)
            : 60;

      return {
        inicio,
        fim: inicio + duracaoExistente,
      };
    })
    .filter(Boolean);

  const agora = new Date();

  const hoje = [
    agora.getFullYear(),
    String(agora.getMonth() + 1).padStart(2, "0"),
    String(agora.getDate()).padStart(2, "0"),
  ].join("-");

  const minutoAtual =
    agora.getHours() * 60 + agora.getMinutes();

  const horarios = [];

  for (const periodo of PERIODOS) {
    for (
      let inicio = periodo.inicio;
      inicio + duracao <= periodo.fim;
      inicio += 30
    ) {
      if (data === hoje && inicio <= minutoAtual) {
        continue;
      }

      const fim = inicio + duracao;

      const conflito = ocupados.some(
        (ocupado) =>
          inicio < ocupado.fim &&
          fim > ocupado.inicio
      );

      if (!conflito) {
        horarios.push({
          hora: minutosParaHora(inicio),
          periodo: periodo.nome,
        });
      }
    }
  }

  return horarios;
}

// =========================================================
// REQUISIÇÕES À API
// =========================================================

async function requisicao(caminho, opcoes = {}) {
  let resposta;

  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      headers: {
        ...(opcoes.body
          ? { "Content-Type": "application/json" }
          : {}),
        ...opcoes.headers,
      },
    });
  } catch {
    throw new Error(
      "Não foi possível conectar à API. Verifique a conexão e tente novamente."
    );
  }

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const detalhe = dados?.detail;

    const mensagem = Array.isArray(detalhe)
      ? detalhe.map((item) => item.msg).join(", ")
      : detalhe;

    throw new Error(
      mensagem ||
        `Erro HTTP ${resposta.status} ao acessar ${caminho}.`
    );
  }

  return dados;
}
