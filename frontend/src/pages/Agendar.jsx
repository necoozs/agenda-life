
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Clock3, LoaderCircle } from "lucide-react";
import "./Agendar.css";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://192.168.1.25:8000"
).replace(/\/+$/, "");

const PERIODOS = [
  { nome: "Manhã", inicio: 8 * 60, fim: 12 * 60 },
  { nome: "Tarde", inicio: 14 * 60, fim: 18 * 60 },
];

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
  return Number.isFinite(duracao) && duracao > 0 ? duracao : 60;
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

function gerarHorarios(servico, data, agendamentos) {
  if (!servico || !data) return [];

  const duracao = duracaoDoServico(servico);

  const ocupados = agendamentos
    .filter(
      (item) => item.data === data && agendamentoAtivo(item)
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

  const minutoAtual = agora.getHours() * 60 + agora.getMinutes();
  const horarios = [];

  for (const periodo of PERIODOS) {
    for (
      let inicio = periodo.inicio;
      inicio + duracao <= periodo.fim;
      inicio += 30
    ) {
      if (data === hoje && inicio <= minutoAtual) continue;

      const fim = inicio + duracao;
      const conflito = ocupados.some(
        (ocupado) => inicio < ocupado.fim && fim > ocupado.inicio
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

async function requisicao(caminho, opcoes = {}) {
  let resposta;

  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      headers: {
        ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
        ...opcoes.headers,
      },
    });
  } catch {
    throw new Error(
      `Não foi possível conectar à API (${API_URL}). ` +
      "Confira se o backend está ligado, se o IP está correto " +
      "e se a porta 8000 está liberada na rede."
    );
  }

  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const detalhe = dados?.detail;
    const mensagem = Array.isArray(detalhe)
      ? detalhe.map((item) => item.msg).join(", ")
      : detalhe;

    throw new Error(
      mensagem || `Erro HTTP ${resposta.status} ao acessar ${caminho}.`
    );
  }

  return dados;
}

export default function Agendar() {
  const navigate = useNavigate();

  const [servicos, setServicos] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [carregandoAgenda, setCarregandoAgenda] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [horarioSelecionado, setHorarioSelecionado] = useState("");

  const [formulario, setFormulario] = useState({
    nome: "",
    telefone: "",
    servico_id: "",
    data: "",
    observacoes: "",
  });

  useEffect(() => {
    let cancelado = false;

    async function carregarServicos() {
      try {
        setErro("");

        const dados = await requisicao("/servicos");

        if (!Array.isArray(dados)) {
          throw new Error("A API retornou uma lista de serviços inválida.");
        }

        const ativos = dados.filter((servico) => {
          if (servico.ativo === undefined || servico.ativo === null) {
            return true;
          }

          return ["true", "1", "sim"].includes(
            String(servico.ativo).trim().toLowerCase()
          );
        });

        if (!cancelado) setServicos(ativos);
      } catch (error) {
        if (!cancelado) setErro(error.message);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    }

    carregarServicos();

    return () => {
      cancelado = true;
    };
  }, []);

  useEffect(() => {
    if (!formulario.data || !formulario.servico_id) {
      setAgendamentos([]);
      setHorarioSelecionado("");
      return;
    }

    let cancelado = false;

    async function carregarAgenda() {
      setCarregandoAgenda(true);
      setErro("");
      setHorarioSelecionado("");

      try {
        const dados = await requisicao("/agendamentos");

        if (!Array.isArray(dados)) {
          throw new Error("A API retornou uma agenda inválida.");
        }

        if (!cancelado) setAgendamentos(dados);
      } catch (error) {
        if (!cancelado) {
          setAgendamentos([]);
          setErro(`Não foi possível consultar a agenda: ${error.message}`);
        }
      } finally {
        if (!cancelado) setCarregandoAgenda(false);
      }
    }

    carregarAgenda();

    return () => {
      cancelado = true;
    };
  }, [formulario.data, formulario.servico_id]);

  const servicoSelecionado = servicos.find(
    (servico) => String(servico.id) === String(formulario.servico_id)
  );

  const horarios = useMemo(
    () => gerarHorarios(servicoSelecionado, formulario.data, agendamentos),
    [servicoSelecionado, formulario.data, agendamentos]
  );

  function atualizarCampo(evento) {
    const { name, value } = evento.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setErro("");

    if (name === "data" || name === "servico_id") {
      setHorarioSelecionado("");
    }
  }

  async function enviarAgendamento(evento) {
    evento.preventDefault();
    setErro("");

    if (!servicoSelecionado) {
      setErro("Selecione um serviço.");
      return;
    }

    if (!formulario.data) {
      setErro("Selecione a data do atendimento.");
      return;
    }

    if (!horarioSelecionado) {
      setErro("Escolha um horário disponível.");
      return;
    }

    setEnviando(true);

    try {
      const telefone = formulario.telefone.trim();
      const nome = formulario.nome.trim();

      const clientes = await requisicao("/clientes");

      if (!Array.isArray(clientes)) {
        throw new Error("A API retornou uma lista de clientes inválida.");
      }

      let cliente = clientes.find(
        (item) => String(item.telefone || "").trim() === telefone
      );

      if (!cliente) {
        cliente = await requisicao("/clientes", {
          method: "POST",
          body: JSON.stringify({ nome, telefone }),
        });
      }

      if (!cliente?.id) {
        throw new Error("Não foi possível identificar o cliente cadastrado.");
      }

      const criado = await requisicao("/agendamentos", {
        method: "POST",
        body: JSON.stringify({
          cliente_id: Number(cliente.id),
          servico_id: Number(formulario.servico_id),
          data: formulario.data,
          hora: horarioSelecionado,
          observacoes: formulario.observacoes.trim(),
        }),
      });

      if (!criado || typeof criado !== "object") {
        throw new Error(
          "A API não confirmou o agendamento. Verifique a agenda antes de tentar novamente."
        );
      }

      navigate("/confirmacao", {
        state: {
          agendamento: {
            ...criado,
            cliente: nome,
            servico: servicoSelecionado.nome,
            data: criado.data || formulario.data,
            hora: criado.hora || horarioSelecionado,
            status: criado.status || "Solicitado",
          },
        },
      });
    } catch (error) {
      setErro(error.message);
    } finally {
      setEnviando(false);
    }
  }

  const hoje = new Date();
  const dataMinima = [
    hoje.getFullYear(),
    String(hoje.getMonth() + 1).padStart(2, "0"),
    String(hoje.getDate()).padStart(2, "0"),
  ].join("-");

  return (
    <main className="agendar-pagina">
      <div className="agendar-container">
        <header className="agendar-titulo">
          <p>AGENDA LIFE</p>
          <h1>Agende seu horário</h1>
          <span>
            Escolha o procedimento, o dia e o horário que preferir.
          </span>
        </header>

        {erro && (
          <div className="agendar-erro" role="alert">
            {erro}
          </div>
        )}

        <form onSubmit={enviarAgendamento}>
          <section className="agendar-secao">
            <h2>1. Qual serviço você deseja?</h2>

            {carregando ? (
              <p>Carregando serviços...</p>
            ) : servicos.length === 0 ? (
              <p>Nenhum serviço disponível no momento.</p>
            ) : (
              <div className="agendar-servicos">
                {servicos.map((servico) => (
                  <label
                    key={servico.id}
                    className={`agendar-servico ${
                      String(formulario.servico_id) === String(servico.id)
                        ? "selecionado"
                        : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="servico_id"
                      value={servico.id}
                      checked={
                        String(formulario.servico_id) === String(servico.id)
                      }
                      onChange={atualizarCampo}
                      required
                    />

                    <span className="agendar-servico-texto">
                      <strong>{servico.nome}</strong>
                      <small>{duracaoDoServico(servico)} minutos</small>
                    </span>

                    <strong>
                      {Number(servico.preco).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </strong>
                  </label>
                ))}
              </div>
            )}
          </section>

          <section className="agendar-secao">
            <h2>2. Escolha o dia</h2>

            <label className="agendar-label" htmlFor="data">
              <CalendarDays size={18} />
              Data do atendimento
            </label>

            <input
              className="agendar-input"
              id="data"
              type="date"
              name="data"
              min={dataMinima}
              value={formulario.data}
              onChange={atualizarCampo}
              required
            />
          </section>

          <section className="agendar-secao">
            <h2>3. Escolha um horário</h2>

            {!formulario.servico_id || !formulario.data ? (
              <p className="agendar-ajuda">
                Primeiro selecione o serviço e o dia.
              </p>
            ) : carregandoAgenda ? (
              <p className="agendar-ajuda">
                <LoaderCircle className="agendar-girando" size={18} />
                Consultando horários...
              </p>
            ) : (
              <>
                <p className="agendar-ajuda">
                  {formatarData(formulario.data)} ·{" "}
                  {duracaoDoServico(servicoSelecionado)} minutos por atendimento
                </p>

                {horarios.length === 0 ? (
                  <p className="agendar-sem-horario">
                    Não há horários disponíveis para esse dia. Escolha outra data.
                  </p>
                ) : (
                  PERIODOS.map((periodo) => {
                    const lista = horarios.filter(
                      (item) => item.periodo === periodo.nome
                    );

                    if (lista.length === 0) return null;

                    return (
                      <div className="agendar-periodo" key={periodo.nome}>
                        <div className="agendar-periodo-titulo">
                          <strong>{periodo.nome}</strong>
                          <span>
                            {minutosParaHora(periodo.inicio)} às{" "}
                            {minutosParaHora(periodo.fim)}
                          </span>
                        </div>

                        <div className="agendar-horarios">
                          {lista.map((item) => (
                            <button
                              type="button"
                              key={item.hora}
                              className={`agendar-horario ${
                                horarioSelecionado === item.hora
                                  ? "selecionado"
                                  : ""
                              }`}
                              onClick={() => setHorarioSelecionado(item.hora)}
                              aria-pressed={horarioSelecionado === item.hora}
                            >
                              {item.hora}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </>
            )}
          </section>

          <section className="agendar-secao">
            <h2>4. Seus dados</h2>

            <label className="agendar-label" htmlFor="nome">
              Nome completo
            </label>
            <input
              className="agendar-input"
              id="nome"
              name="nome"
              value={formulario.nome}
              onChange={atualizarCampo}
              placeholder="Digite seu nome"
              maxLength={100}
              autoComplete="name"
              required
            />

            <label className="agendar-label" htmlFor="telefone">
              Telefone / WhatsApp
            </label>
            <input
              className="agendar-input"
              id="telefone"
              name="telefone"
              type="tel"
              value={formulario.telefone}
              onChange={atualizarCampo}
              placeholder="(00) 00000-0000"
              minLength={8}
              maxLength={20}
              autoComplete="tel"
              required
            />

            <label className="agendar-label" htmlFor="observacoes">
              Observações (opcional)
            </label>
            <textarea
              className="agendar-input"
              id="observacoes"
              name="observacoes"
              value={formulario.observacoes}
              onChange={atualizarCampo}
              placeholder="Alguma informação para a profissional?"
              rows={3}
              maxLength={500}
            />
          </section>

          {servicoSelecionado && horarioSelecionado && (
            <div className="agendar-resumo">
              <Clock3 size={19} />
              <span>
                {servicoSelecionado.nome} — {formatarData(formulario.data)} às{" "}
                {horarioSelecionado}
              </span>
            </div>
          )}

          <button
            className="agendar-confirmar"
            type="submit"
            disabled={
              carregando ||
              carregandoAgenda ||
              enviando ||
              !horarioSelecionado ||
              servicos.length === 0
            }
          >
            {enviando ? "Registrando agendamento..." : "Confirmar agendamento"}
          </button>

          <p className="agendar-nota">
            Os horários são calculados conforme a duração do serviço e os
            atendimentos registrados na agenda.
          </p>
        </form>
      </div>
    </main>
  );
}
