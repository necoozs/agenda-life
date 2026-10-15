import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="site">
      <header className="cabecalho">
        <div className="container cabecalho-conteudo">

          <div className="cabecalho-direita">
            <Link to="/" className="marca">
              <span className="marca-icone" aria-hidden="true">
                ✿
              </span>

              <span className="marca-texto">
                <span className="marca-nome">Agenda Life</span>
                <span className="marca-descricao">
                  ESTÉTICA &amp; BEM-ESTAR
                </span>
              </span>
            </Link>

            <Link
              to="/login"
              className="botao-administrativo"
              aria-label="Acessar área administrativa"
            >
              <svg
                className="icone-administrativo"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M12 3.5 19 6v5.2c0 4.5-2.9 7.6-7 9.3-4.1-1.7-7-4.8-7-9.3V6l7-2.5Z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.5 12 11 13.5l3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>

              <span>Área administrativa</span>
              <span className="seta-administrativa" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </header>


      <main>
        <section id="inicio" className="inicio">
          <div className="container">
            <p className="subtitulo">
              ESTÉTICA E CUIDADOS PESSOAIS
            </p>

            <h2>Cuide de você.</h2>

            <p className="descricao">
              Agende seu horário de forma simples e escolha o serviço
              ideal para você.
            </p>

            <Link to="/agendar" className="botao">
              Fazer agendamento
            </Link>
          </div>
        </section>

        <section id="sobre" className="sobre">
          <div className="container">
            <h2>Bem-vinda à Agenda Life</h2>

            <p>
              Um espaço dedicado ao cuidado, ao bem-estar e à beleza,
              com atendimento organizado e agendamento facilitado.
            </p>
          </div>
        </section>
      </main>

      <footer id="contato">
        <div className="container">
          <p>Agenda Life — Estética e cuidados pessoais</p>
          <p>Entre em contato para mais informações.</p>
        </div>
      </footer>
    </div>
  );
}

export default Home;
