
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  listarServicos,
  criarServico,
  editarServico,
  removerServico,
} from "../api";
import "./Servicos.css";

function Servicos() {
  const [servicos, setServicos] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [duracao, setDuracao] = useState("60");
  const [editandoId, setEditandoId] = useState(null);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarServicos() {
    try {
      setErro("");
      const dados = await listarServicos();
      setServicos(Array.isArray(dados) ? dados : []);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar os serviços.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarServicos();
  }, []);

  const servicosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return servicos;

    return servicos.filter((servico) =>
      `${servico.nome ?? ""} ${servico.descricao ?? ""}`
        .toLowerCase()
        .includes(termo)
    );
  }, [servicos, pesquisa]);

  function limparFormulario() {
    setNome("");
    setDescricao("");
    setPreco("");
    setDuracao("60");
    setEditandoId(null);
  }

  function iniciarEdicao(servico) {
    setEditandoId(servico.id);
    setNome(servico.nome || "");
    setDescricao(servico.descricao || "");
    setPreco(String(servico.preco ?? "").replace(".", ","));
    setDuracao(String(servico.duracao_minutos || 60));
    setErro("");
    setSucesso("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function salvarServico(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    const precoNumerico = Number(preco.replace(",", "."));
    const duracaoNumerica = Number(duracao);

    if (!nome.trim()) {
      setErro("Informe o nome do serviço.");
      return;
    }

    if (
      preco.trim() === "" ||
      !Number.isFinite(precoNumerico) ||
      precoNumerico < 0
    ) {
      setErro("Informe um preço válido, igual ou maior que zero.");
      return;
    }

    if (
      !Number.isInteger(duracaoNumerica) ||
      duracaoNumerica < 1 ||
      duracaoNumerica > 1440
    ) {
      setErro("A duração deve ser de 1 a 1440 minutos.");
      return;
    }

    try {
      setSalvando(true);

      const dados = {
        nome: nome.trim(),
        descricao: descricao.trim(),
        preco: precoNumerico,
        duracao_minutos: duracaoNumerica,
      };

      if (editandoId !== null) {
        await editarServico(editandoId, dados);
        setSucesso("Serviço atualizado com sucesso!");
      } else {
        await criarServico(dados);
        setSucesso("Serviço cadastrado com sucesso!");
      }

      limparFormulario();
      await carregarServicos();
    } catch (e) {
      setErro(e.message || "Não foi possível salvar o serviço.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluirServico(servico) {
    const confirmado = window.confirm(
      `Deseja realmente desativar o serviço "${servico.nome}"? Ele deixará de aparecer entre os serviços disponíveis.`
    );

    if (!confirmado) return;

    setErro("");
    setSucesso("");

    try {
      await removerServico(servico.id);

      if (editandoId === servico.id) {
        limparFormulario();
      }

      setSucesso(`Serviço "${servico.nome}" desativado com sucesso.`);
      await carregarServicos();
    } catch (e) {
      setErro(e.message || "Não foi possível remover o serviço.");
    }
  }

  function formatarPreco(valor) {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) return "Preço não informado";

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarDuracao(valor) {
    const minutos = Number(valor);

    if (!Number.isFinite(minutos) || minutos <= 0) {
      return "Duração não informada";
    }

    const horas = Math.floor(minutos / 60);
    const resto = minutos % 60;

    if (horas && resto) return `${horas}h ${resto}min`;
    if (horas) return `${horas}h`;
    return `${resto} min`;
  }

  return (
    <main className="pagina-servicos">
      <header className="servicos-header">
        <Link to="/admin/dashboard" className="servicos-logo">
          Agenda <span>Life</span>
        </Link>
      </header>

      <section className="servicos-conteudo">
        <div className="servicos-titulo">
          <div>
            <span className="servicos-etiqueta">GESTÃO DO ESPAÇO</span>
            <h1>Serviços</h1>
            <p>Organize os procedimentos, preços e duração dos atendimentos.</p>
          </div>

          <div className="servicos-total">
            <strong>{servicos.length}</strong>
            <span>cadastrados</span>
          </div>
        </div>

        <div className="servicos-layout">
          <section className="servicos-form-painel">
            <div className="servicos-secao-titulo">
              <span className="servicos-icone">
                {editandoId !== null ? "✎" : "＋"}
              </span>
              <div>
                <h2>
                  {editandoId !== null ? "Editar serviço" : "Novo serviço"}
                </h2>
                <p>
                  {editandoId !== null
                    ? "Altere os dados do procedimento."
                    : "Cadastre um procedimento."}
                </p>
              </div>
            </div>

            <form onSubmit={salvarServico}>
              <label htmlFor="servico-nome">Nome do serviço</label>
              <input
                id="servico-nome"
                type="text"
                placeholder="Ex.: Limpeza de pele"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={100}
                required
              />

              <label htmlFor="servico-descricao">Descrição</label>
              <textarea
                id="servico-descricao"
                placeholder="Descreva o procedimento (opcional)"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={3}
                maxLength={500}
              />

              <label htmlFor="servico-preco">Preço (R$)</label>
              <input
                id="servico-preco"
                type="text"
                inputMode="decimal"
                placeholder="Ex.: 80,00"
                value={preco}
                onChange={(e) => setPreco(e.target.value)}
                required
              />

              <label htmlFor="servico-duracao">Duração</label>
              <select
                id="servico-duracao"
                value={duracao}
                onChange={(e) => setDuracao(e.target.value)}
                required
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1 hora e 30 minutos</option>
                <option value="120">2 horas</option>
                <option value="180">3 horas</option>
                <option value="240">4 horas</option>
              </select>

              {erro && (
                <div className="servicos-mensagem servicos-erro">
                  {erro}
                </div>
              )}

              {sucesso && (
                <div className="servicos-mensagem servicos-sucesso">
                  {sucesso}
                </div>
              )}

              <button
                className="servicos-salvar"
                type="submit"
                disabled={salvando}
              >
                {salvando
                  ? "Salvando..."
                  : editandoId !== null
                    ? "Salvar alterações"
                    : "Cadastrar serviço"}
              </button>

              {editandoId !== null && (
                <button
                  className="servicos-cancelar-edicao"
                  type="button"
                  onClick={limparFormulario}
                  disabled={salvando}
                >
                  Cancelar edição
                </button>
              )}
            </form>
          </section>

          <section className="servicos-lista-painel">
            <div className="servicos-lista-topo">
              <div>
                <h2>Procedimentos cadastrados</h2>
                <p>Consulte e gerencie os serviços disponíveis.</p>
              </div>

              <button
                className="servicos-atualizar"
                type="button"
                onClick={carregarServicos}
              >
                ↻ Atualizar
              </button>
            </div>

            <input
              className="servicos-pesquisa"
              type="search"
              placeholder="Pesquisar serviço..."
              aria-label="Pesquisar serviços"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />

            {carregando ? (
              <div className="servicos-vazio">Carregando serviços...</div>
            ) : servicosFiltrados.length === 0 ? (
              <div className="servicos-vazio">
                <span className="servicos-vazio-icone">✧</span>
                <h3>
                  {pesquisa
                    ? "Nenhum serviço encontrado"
                    : "Nenhum serviço cadastrado"}
                </h3>
                <p>
                  {pesquisa
                    ? "Tente pesquisar por outro termo."
                    : "Cadastre o primeiro procedimento pelo formulário."}
                </p>
              </div>
            ) : (
              <div className="servicos-lista">
                {servicosFiltrados.map((servico, indice) => (
                  <article
                    className="servico-card"
                    key={servico.id ?? servico.servico_id ?? indice}
                  >
                    <div className="servico-card-icone">✧</div>

                    <div className="servico-card-conteudo">
                      <h3>{servico.nome || "Serviço sem nome"}</h3>
                      <p className="servico-descricao">
                        {servico.descricao || "Sem descrição cadastrada."}
                      </p>

                      <div className="servico-card-detalhes">
                        <strong>{formatarPreco(servico.preco)}</strong>
                        <span>
                          ◷ {formatarDuracao(servico.duracao_minutos)}
                        </span>
                      </div>

                      <div className="servico-acoes">
                        <button
                          type="button"
                          className="servico-editar"
                          onClick={() => iniciarEdicao(servico)}
                        >
                          Editar
                        </button>

                        <button
                          type="button"
                          className="servico-remover"
                          onClick={() => excluirServico(servico)}
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}

export default Servicos;
