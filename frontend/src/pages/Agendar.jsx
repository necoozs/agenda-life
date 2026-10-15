import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  LoaderCircle,
  CheckCircle2,
} from "lucide-react";
import { apiFetch } from "../services/api";
import "./Agendar.css";

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

function agendamentoAtivo(item) {
  const status = String(item.status || "").trim().toLowerCase();
  return !["cancelado", "cancelada", "canceled", "cancelled"].includes(status);
}

function gerarHorarios(servico, data, agendamentos) {
  if (!servico || !data) return [];

  const duracao = duracaoDoServico(servico);

  const ocupados = agendamentos
    .filter((item) => {
      const dataExistente = String(item.data || "").slice(0, 10);
      return dataExistente === data && agendamentoAtivo(item);
    })
    .map((item) => {
      const inicio = horarioEmMinutos(item.hora);
      if (inicio === null) return null;

      const duracaoExistente =
        Number(item.duracao_minutos) > 0
          ? Number(item.duracao_minutos)
          : Number(item.servico?.duracao_minutos) > 0
            ? Number(item.servico.duracao_minutos)
            : 60;

      return { inicio, fim: inicio + duracaoExistente };
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

function normalizarTelefone(telefone) {
  return String(telefone || "").replace(/\D/g, "");
}

function formatarPreco(preco) {
  const valor = Number(preco);
  if (!Number.isFinite(valor)) return "Consulte o valor";

  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function Agendar() {
  const [servicos, setServicos] = useState([]);
  const [agendamentos, setAgendamentos] = useState([]);
  const [clientes, setClientes] = useState([]);

  const [servicoId, setServicoId] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [carregando, setCarregando] = useState(true);
  const [carregandoHorarios, setCarregandoHorarios] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState(false);

  const servicoSelecionado = servicos.find(
    (item) => String(item.id) === String(servicoId)
  );

  const dataMinima = [
    new Date().getFullYear(),
    String(new Date().getMonth() + 1).padStart(2, "0"),
    String(new Date().getDate()).padStart(2, "0"),
  ].join("-");

  useEffect(() => {
    let ativo = true;

    async function carregarDados() {
      setCarregando(true);
      setErro("");

      try {
        const [listaServicos, listaClientes] = await Promise.all([
          apiFetch("/servicos"),
          apiFetch("/clientes"),
        ]);

        if (!ativo) return;

        setServicos(Array.isArray(listaServicos) ? listaServicos : []);
        setClientes(Array.isArray(listaClientes) ? listaClientes : []);
      } catch (e) {
        if (ativo) {
          setErro(
            e.message ||
              "Não foi possível carregar os dados. Tente novamente."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    carregarDados();

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    async function carregarAgenda() {
      if (!data || !servicoSelecionado) {
        setAgendamentos([]);
        setHora("");
        return;
      }

      setCarregandoHorarios(true);
      setHora("");
      setErro("");

      try {
        const lista = await apiFetch("/agendamentos");

        if (ativo) {
          setAgendamentos(Array.isArray(lista) ? lista : []);
        }
      } catch (e) {
        if (ativo) {
          setAgendamentos([]);
          setErro(
            e.message ||
              "Não foi possível consultar os horários. Tente novamente."
          );
        }
      } finally {
        if (ativo) setCarregandoHorarios(false);
      }
    }

    carregarAgenda();

    return () => {
      ativo = false;
    };
  }, [data, servicoId]);

  const horariosDisponiveis = useMemo(
    () => gerarHorarios(servicoSelecionado, data, agendamentos),
    [servicoSelecionado, data, agendamentos]
  );

  const horariosManha = horariosDisponiveis.filter(
    (item) => item.periodo === "Manhã"
  );

  const horariosTarde = horariosDisponiveis.filter(
    (item) => item.periodo === "Tarde"
  );

  async function obterOuCadastrarCliente() {
    const telefoneNormalizado = normalizarTelefone(telefone);

    const clienteExistente = clientes.find(
      (cliente) =>
        normalizarTelefone(cliente.telefone) === telefoneNormalizado
    );

    if (clienteExistente) {
      return clienteExistente;
    }

    return apiFetch("/clientes", {
      method: "POST",
      body: JSON.stringify({
        nome: nome.trim(),
        telefone: telefone.trim(),
      }),
    });
  }

  async function enviarAgendamento(event) {
    event.preventDefault();
    setErro("");
    setSucesso(false);

    if (!servicoSelecionado) {
      setErro("Selecione um serviço.");
      return;
    }

    if (!data || !hora) {
      setErro("Selecione uma data e um horário disponível.");
      return;
    }

    if (!nome.trim() || !telefone.trim()) {
      setErro("Informe seu nome e telefone.");
      return;
    }

    if (normalizarTelefone(telefone).length < 10) {
      setErro("Informe um telefone válido com DDD.");
      return;
    }

    try {
      setSalvando(true);

      // Atualiza a agenda antes de enviar, para reduzir o risco
      // de oferecer um horário que acabou de ser ocupado.
      const agendaAtualizada = await apiFetch("/agendamentos");
      const listaAtualizada = Array.isArray(agendaAtualizada)
        ? agendaAtualizada
        : [];

      const horariosAtualizados = gerarHorarios(
        servicoSelecionado,
        data,
        listaAtualizada
      );

      if (!horariosAtualizados.some((item) => item.hora === hora)) {
        setAgendamentos(listaAtualizada);
        setHora("");
        throw new Error(
          "Esse horário não está mais disponível. Escolha outro, por favor."
        );
      }

      let cliente;

      try {
        cliente = await obterOuCadastrarCliente();
      } catch (e) {
        throw new Error(
          e.message || "Não foi possível cadastrar ou localizar seu cliente."
        );
      }

      const clienteId = cliente?.id ?? cliente?.cliente_id;

      if (!clienteId) {
        throw new Error(
          "A API não retornou o identificador do cliente. Verifique o cadastro de clientes."
        );
      }

      await apiFetch("/agendamentos", {
        method: "POST",
        body: JSON.stringify({
          cliente_id: Number(clienteId),
          servico_id: Number(servicoId),
          data,
          hora,
          observacoes: observacoes.trim(),
        }),
      });

      setSucesso(true);
      setHora("");
      setObservacoes("");

      const agendaDepois = await apiFetch("/agendamentos").catch(() => null);

      if (Array.isArray(agendaDepois)) {
        setAgendamentos(agendaDepois);
      }
    } catch (e) {
      setErro(
        e.message ||
          "Não foi possível concluir o agendamento. Tente novamente."
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <main className="agendar-carregando">
        <LoaderCircle size={30} className="agendar-girando" />
        <p>Carregando serviços...</p>
      </main>
    );
  }

  return (
    <main className="pagina-agendar">
      <header className="agendar-header">
        <Link to="/" className="agendar-logo">
          Agenda <span>Life</span>
        </Link>
        <span className="agendar-header-texto">Agendamento online</span>
      </header>

      <section className="agendar-conteudo">
        <div className="agendar-introducao">
          <span className="agendar-etiqueta">SEU MOMENTO DE CUIDADO</span>
          <h1>Agende seu atendimento</h1>
          <p>
            Escolha o serviço, selecione uma data e encontre um horário
            disponível.
          </p>
        </div>

        {erro && (
          <div className="agendar-alerta agendar-alerta-erro" role="alert">
            {erro}
          </div>
        )}

        {sucesso && (
          <div
            className="agendar-alerta agendar-alerta-sucesso"
            role="status"
          >
            <CheckCircle2 size={21} />
            <div>
              <strong>Solicitação registrada!</strong>
              <p>
                Seu agendamento foi salvo. Entre em contato com o espaço se
                precisar confirmar algum detalhe.
              </p>
            </div>
          </div>
        )}

        {servicos.length === 0 ? (
          <section className="agendar-painel">
            <h2>Nenhum serviço disponível</h2>
            <p>
              No momento não há serviços ativos para agendamento. Tente
              novamente mais tarde.
            </p>
          </section>
        ) : (
          <form className="agendar-formulario" onSubmit={enviarAgendamento}>
            <section className="agendar-painel">
              <div className="agendar-passo">
                <span>1</span>
                <div>
                  <h2>Escolha o serviço</h2>
                  <p>Selecione o atendimento que deseja realizar.</p>
                </div>
              </div>

              <div className="agendar-servicos">
                {servicos.map((servico) => (
                  <label
                    className={`agendar-servico-card ${
                      String(servicoId) === String(servico.id)
                        ? "selecionado"
                        : ""
                    }`}
                    key={servico.id}
                  >
                    <input
                      type="radio"
                      name="servico"
                      value={servico.id}
                      checked={String(servicoId) === String(servico.id)}
                      onChange={(e) => {
                        setServicoId(e.target.value);
                        setHora("");
                        setSucesso(false);
                      }}
                      required
                    />

                    <span className="agendar-servico-dados">
                      <strong>{servico.nome}</strong>
                      {servico.descricao && <small>{servico.descricao}</small>}
                      <span>
                        {duracaoDoServico(servico)} minutos
                      </span>
                    </span>

                    <strong className="agendar-servico-preco">
                      {formatarPreco(servico.preco)}
                    </strong>
                  </label>
                ))}
              </div>
            </section>

            <section className="agendar-painel">
              <div className="agendar-passo">
                <span>2</span>
                <div>
                  <h2>Escolha a data e o horário</h2>
                  <p>
                    Atendimento de segunda a domingo conforme a disponibilidade
                    cadastrada.
                  </p>
                </div>
              </div>

              <label className="agendar-label" htmlFor="agendar-data">
                <CalendarDays size={18} />
                Data do atendimento
              </label>

              <input
                id="agendar-data"
                className="agendar-input-data"
                type="date"
                min={dataMinima}
                value={data}
                onChange={(e) => {
                  setData(e.target.value);
                  setHora("");
                  setSucesso(false);
                }}
                required
              />

              {!servicoSelecionado || !data ? (
                <p className="agendar-ajuda">
                  Primeiro selecione um serviço e uma data.
                </p>
              ) : carregandoHorarios ? (
                <p className="agendar-ajuda">
                  <LoaderCircle size={17} className="agendar-girando" />
                  Consultando horários disponíveis...
                </p>
              ) : (
                <div className="agendar-horarios">
                  <div className="agendar-periodo">
                    <h3>
                      <Clock3 size={18} /> Manhã
                    </h3>
                    <div className="agendar-horarios-grade">
                      {horariosManha.map((item) => (
                        <button
                          type="button"
                          key={item.hora}
                          className={`agendar-horario ${
                            hora === item.hora ? "selecionado" : ""
                          }`}
                          onClick={() => {
                            setHora(item.hora);
                            setSucesso(false);
                          }}
                        >
                          {item.hora}
                        </button>
                      ))}
                      {horariosManha.length === 0 && (
                        <p className="agendar-sem-horario">
                          Nenhum horário disponível pela manhã.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="agendar-periodo">
                    <h3>
                      <Clock3 size={18} /> Tarde
                    </h3>
                    <div className="agendar-horarios-grade">
                      {horariosTarde.map((item) => (
                        <button
                          type="button"
                          key={item.hora}
                          className={`agendar-horario ${
                            hora === item.hora ? "selecionado" : ""
                          }`}
                          onClick={() => {
                            setHora(item.hora);
                            setSucesso(false);
                          }}
                        >
                          {item.hora}
                        </button>
                      ))}
                      {horariosTarde.length === 0 && (
                        <p className="agendar-sem-horario">
                          Nenhum horário disponível à tarde.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {hora && (
                <p className="agendar-horario-escolhido">
                  Horário selecionado: <strong>{hora}</strong> em{" "}
                  <strong>{formatarData(data)}</strong>
                </p>
              )}
            </section>

            <section className="agendar-painel">
              <div className="agendar-passo">
                <span>3</span>
                <div>
                  <h2>Seus dados</h2>
                  <p>Informe seus dados para registrar o atendimento.</p>
                </div>
              </div>

              <label className="agendar-label" htmlFor="agendar-nome">
                Nome completo
              </label>
              <input
                id="agendar-nome"
                className="agendar-input"
                type="text"
                autoComplete="name"
                maxLength={120}
                placeholder="Digite seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />

              <label className="agendar-label" htmlFor="agendar-telefone">
                Telefone com DDD
              </label>
              <input
                id="agendar-telefone"
                className="agendar-input"
                type="tel"
                autoComplete="tel"
                maxLength={30}
                placeholder="(88) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                required
              />

              <label className="agendar-label" htmlFor="agendar-observacoes">
                Observações (opcional)
              </label>
              <textarea
                id="agendar-observacoes"
                className="agendar-input agendar-textarea"
                rows={3}
                maxLength={500}
                placeholder="Alguma informação que devemos saber?"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
              />
            </section>

            <section className="agendar-resumo">
              <h2>Resumo do atendimento</h2>

              <div>
                <span>Serviço</span>
                <strong>{servicoSelecionado?.nome || "Não selecionado"}</strong>
              </div>

              <div>
                <span>Duração</span>
                <strong>
                  {servicoSelecionado
                    ? `${duracaoDoServico(servicoSelecionado)} minutos`
                    : "—"}
                </strong>
              </div>

              <div>
                <span>Data</span>
                <strong>{data ? formatarData(data) : "Não selecionada"}</strong>
              </div>

              <div>
                <span>Horário</span>
                <strong>{hora || "Não selecionado"}</strong>
              </div>

              <div className="agendar-resumo-total">
                <span>Valor</span>
                <strong>
                  {servicoSelecionado
                    ? formatarPreco(servicoSelecionado.preco)
                    : "—"}
                </strong>
              </div>

              <button
                className="agendar-botao-confirmar"
                type="submit"
                disabled={salvando || carregandoHorarios || !hora}
              >
                {salvando ? (
                  <>
                    <LoaderCircle size={19} className="agendar-girando" />
                    Registrando agendamento...
                  </>
                ) : (
                  "Solicitar agendamento"
                )}
              </button>

              <p className="agendar-privacidade">
                Seus dados serão utilizados para organizar seu atendimento.
              </p>
            </section>
          </form>
        )}
      </section>

      <footer className="agendar-footer">
        Agenda Life · Esteticista Kenia Rodrigues
      </footer>
    </main>
  );
}

export default Agendar;
