
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/api";
import "./Agendamentos.css";

function Agendamentos() {
  const [agendamentos, setAgendamentos] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [filtro, setFiltro] = useState("ativos");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [cancelandoId, setCancelandoId] = useState(null);

  async function carregarAgendamentos() {
    try {
      setErro("");
      const dados = await apiFetch("/agendamentos");
      setAgendamentos(Array.isArray(dados) ? dados : []);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar os agendamentos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarAgendamentos();
  }, []);

  function statusDo(item) {
    return String(item.status || "agendado").toLowerCase();
  }

  const ativos = agendamentos.filter(
    (item) => !["cancelado", "cancelada"].includes(statusDo(item))
  );

  const cancelados = agendamentos.filter(
    (item) => ["cancelado", "cancelada"].includes(statusDo(item))
  );

  const listaFiltrada = useMemo(() => {
    const base =
      filtro === "cancelados"
        ? cancelados
        : filtro === "todos"
          ? agendamentos
          : ativos;

    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return base;

    return base.filter((item) =>
      JSON.stringify(item).toLowerCase().includes(termo)
    );
  }, [agendamentos, pesquisa, filtro]);

  async function cancelar(id) {
    const confirmado = window.confirm(
      "Deseja cancelar este agendamento? Ele será retirado da lista de ativos."
    );

    if (!confirmado) return;

    try {
      setCancelandoId(id);
      setErro("");

      await apiFetch(`/agendamentos/${id}/cancelar`, {
        method: "PATCH",
      });

      await carregarAgendamentos();
    } catch (e) {
      setErro(e.message || "Não foi possível cancelar o agendamento.");
    } finally {
      setCancelandoId(null);
    }
  }

  function valor(item, campos, padrao = "Não informado") {
    for (const campo of campos) {
      if (item[campo] !== undefined && item[campo] !== null) {
        return item[campo];
      }
    }

    return padrao;
  }

  function formatarData(data) {
    if (!data) return "Não informada";

    const texto = String(data).slice(0, 10);
    const partes = texto.split("-");

    return partes.length === 3
      ? `${partes[2]}/${partes[1]}/${partes[0]}`
      : texto;
  }

  return (
    <main className="pagina-agendamentos">
      <header className="agendamentos-header">
        <Link to="/admin/dashboard" className="agendamentos-logo">
          Agenda <span>Life</span>
        </Link>
      </header>

      <section className="agendamentos-conteudo">
        <div className="agendamentos-titulo">
          <div>
            <span className="agendamentos-etiqueta">GESTÃO DA AGENDA</span>
            <h1>Agendamentos</h1>
            <p>Acompanhe os horários e organize os atendimentos.</p>
          </div>

          <div className="agendamentos-total">
            <strong>{ativos.length}</strong>
            <span>ativos</span>
          </div>
        </div>

        <div className="agendamentos-resumo">
          <article className="resumo-card">
            <span className="resumo-icone">◷</span>
            <div>
              <span>Agendamentos ativos</span>
              <strong>{ativos.length}</strong>
            </div>
          </article>

          <article className="resumo-card">
            <span className="resumo-icone resumo-icone-cancelado">×</span>
            <div>
              <span>Cancelados</span>
              <strong>{cancelados.length}</strong>
            </div>
          </article>

          <article className="resumo-card">
            <span className="resumo-icone resumo-icone-total">▤</span>
            <div>
              <span>Total registrado</span>
              <strong>{agendamentos.length}</strong>
            </div>
          </article>
        </div>

        <section className="agendamentos-painel">
          <div className="agendamentos-ferramentas">
            <div>
              <h2>Lista de atendimentos</h2>
              <p>Pesquise e consulte os registros da agenda.</p>
            </div>

            <button
              className="agendamentos-atualizar"
              onClick={carregarAgendamentos}
              type="button"
            >
              ↻ Atualizar
            </button>
          </div>

          <div className="agendamentos-filtros">
            <input
              type="search"
              aria-label="Pesquisar agendamento"
              placeholder="Buscar por cliente, serviço, data..."
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />

            <select
              aria-label="Filtrar agendamentos"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            >
              <option value="ativos">Agendamentos ativos</option>
              <option value="cancelados">Cancelados</option>
              <option value="todos">Todos os registros</option>
            </select>
          </div>

          {erro && (
            <div className="agendamentos-alerta">
              <strong>Não foi possível concluir a operação.</strong>
              <p>{erro}</p>
            </div>
          )}

          {carregando ? (
            <div className="agendamentos-vazio">
              Carregando agendamentos...
            </div>
          ) : listaFiltrada.length === 0 ? (
            <div className="agendamentos-vazio">
              <span className="vazio-icone">▤</span>
              <h3>Nenhum agendamento encontrado</h3>
              <p>
                {pesquisa
                  ? "Tente pesquisar usando outros termos."
                  : "Não há registros nesta categoria."}
              </p>
            </div>
          ) : (
            <div className="agendamentos-lista">
              {listaFiltrada.map((item, indice) => {
                const id = item.id ?? item.agendamento_id;
                const status = statusDo(item);
                const estaCancelado = [
                  "cancelado",
                  "cancelada",
                ].includes(status);

                return (
                  <article
                    className="agendamento-card"
                    key={id ?? indice}
                  >
                    <div className="agendamento-card-topo">
                      <span className="agendamento-numero">
                        AGENDAMENTO #{id ?? indice + 1}
                      </span>

                      <span
                        className={`agendamento-status ${
                          estaCancelado ? "status-cancelado" : "status-ativo"
                        }`}
                      >
                        <span className="status-ponto" />
                        {estaCancelado ? "Cancelado" : status}
                      </span>
                    </div>

                    <h3>
                      {valor(
                        item,
                        ["cliente_nome", "nome_cliente", "cliente"],
                        "Cliente"
                      )}
                    </h3>

                    <p className="agendamento-servico">
                      {valor(
                        item,
                        ["servico_nome", "nome_servico", "servico"],
                        "Serviço não informado"
                      )}
                    </p>

                    <div className="agendamento-detalhes">
                      <div>
                        <span>DATA</span>
                        <strong>
                          {formatarData(
                            valor(item, ["data", "data_agendamento"], "")
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>HORÁRIO</span>
                        <strong>
                          {String(
                            valor(item, ["hora", "hora_agendamento"], "—")
                          ).slice(0, 5)}
                        </strong>
                      </div>
                    </div>

                    {item.observacoes && (
                      <p className="agendamento-observacoes">
                        {item.observacoes}
                      </p>
                    )}

                    {!estaCancelado && id != null && (
                      <button
                        className="agendamento-cancelar"
                        type="button"
                        disabled={cancelandoId === id}
                        onClick={() => cancelar(id)}
                      >
                        {cancelandoId === id
                          ? "Cancelando..."
                          : "Cancelar agendamento"}
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}

export default Agendamentos;
