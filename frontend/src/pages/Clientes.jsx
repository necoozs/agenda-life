
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiFetch } from "../services/api";
import "./Clientes.css";

function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [pesquisa, setPesquisa] = useState("");
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  async function carregarClientes() {
    try {
      setErro("");
      const dados = await apiFetch("/clientes");
      setClientes(Array.isArray(dados) ? dados : []);
    } catch (e) {
      setErro(e.message || "Não foi possível carregar os clientes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarClientes();
  }, []);

  const clientesFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase();

    if (!termo) return clientes;

    return clientes.filter((cliente) => {
      const nomeCliente = String(cliente.nome ?? "").toLowerCase();
      const telefoneCliente = String(cliente.telefone ?? "").toLowerCase();

      return (
        nomeCliente.includes(termo) ||
        telefoneCliente.includes(termo)
      );
    });
  }, [clientes, pesquisa]);

  async function cadastrarCliente(event) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (!nome.trim() || !telefone.trim()) {
      setErro("Preencha o nome e o telefone.");
      return;
    }

    try {
      setSalvando(true);

      await apiFetch("/clientes", {
        method: "POST",
        body: JSON.stringify({
          nome: nome.trim(),
          telefone: telefone.trim(),
        }),
      });

      setNome("");
      setTelefone("");
      setSucesso("Cliente cadastrado com sucesso!");

      await carregarClientes();
    } catch (e) {
      setErro(e.message || "Não foi possível cadastrar o cliente.");
    } finally {
      setSalvando(false);
    }
  }

  function obterIniciais(nomeCliente) {
    const partes = String(nomeCliente || "?").trim().split(/\s+/);

    return partes
      .slice(0, 2)
      .map((parte) => parte[0] || "")
      .join("")
      .toUpperCase();
  }

  return (
    <main className="pagina-clientes">
      <header className="clientes-header">
        <Link to="/admin/dashboard" className="clientes-logo">
          Agenda <span>Life</span>
        </Link>
      </header>

      <section className="clientes-conteudo">
        <div className="clientes-titulo">
          <div>
            <span className="clientes-etiqueta">
              GESTÃO DE CLIENTES
            </span>
            <h1>Seus clientes</h1>
            <p>
              Cadastre e organize os contatos dos clientes do seu espaço.
            </p>
          </div>

          <div className="clientes-total">
            <strong>{clientes.length}</strong>
            <span>cadastrados</span>
          </div>
        </div>

        <div className="clientes-layout">
          <section className="clientes-form-painel">
            <div className="clientes-secao-titulo">
              <span className="clientes-icone">＋</span>
              <div>
                <h2>Novo cliente</h2>
                <p>Preencha os dados abaixo.</p>
              </div>
            </div>

            <form onSubmit={cadastrarCliente}>
              <label htmlFor="cliente-nome">Nome completo</label>
              <input
                id="cliente-nome"
                type="text"
                placeholder="Ex.: Maria da Silva"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                maxLength={120}
                required
              />

              <label htmlFor="cliente-telefone">Telefone</label>
              <input
                id="cliente-telefone"
                type="tel"
                placeholder="Ex.: (88) 99999-9999"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                maxLength={30}
                required
              />

              {erro && (
                <div className="clientes-mensagem clientes-mensagem-erro">
                  {erro}
                </div>
              )}

              {sucesso && (
                <div className="clientes-mensagem clientes-mensagem-sucesso">
                  {sucesso}
                </div>
              )}

              <button
                className="clientes-salvar"
                type="submit"
                disabled={salvando}
              >
                {salvando ? "Salvando..." : "Cadastrar cliente"}
              </button>
            </form>
          </section>

          <section className="clientes-lista-painel">
            <div className="clientes-lista-topo">
              <div>
                <h2>Lista de clientes</h2>
                <p>Consulte os contatos cadastrados.</p>
              </div>

              <button
                className="clientes-atualizar"
                type="button"
                onClick={carregarClientes}
              >
                ↻ Atualizar
              </button>
            </div>

            <input
              className="clientes-pesquisa"
              type="search"
              placeholder="Pesquisar nome ou telefone..."
              aria-label="Pesquisar clientes"
              value={pesquisa}
              onChange={(e) => setPesquisa(e.target.value)}
            />

            {carregando ? (
              <div className="clientes-vazio">
                Carregando clientes...
              </div>
            ) : clientesFiltrados.length === 0 ? (
              <div className="clientes-vazio">
                <span className="clientes-vazio-icone">♙</span>
                <h3>
                  {pesquisa
                    ? "Nenhum cliente encontrado"
                    : "Sua lista está vazia"}
                </h3>
                <p>
                  {pesquisa
                    ? "Tente buscar por outro nome ou telefone."
                    : "Cadastre o primeiro cliente usando o formulário."}
                </p>
              </div>
            ) : (
              <div className="clientes-lista">
                {clientesFiltrados.map((cliente, indice) => (
                  <article
                    className="cliente-item"
                    key={cliente.id ?? cliente.cliente_id ?? indice}
                  >
                    <div className="cliente-avatar">
                      {obterIniciais(cliente.nome)}
                    </div>

                    <div className="cliente-dados">
                      <strong>{cliente.nome || "Nome não informado"}</strong>
                      <span>
                        {cliente.telefone || "Telefone não informado"}
                      </span>
                    </div>

                    <span className="cliente-status">Cadastrado</span>
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

export default Clientes;
