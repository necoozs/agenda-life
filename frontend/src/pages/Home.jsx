import { Link } from "react-router-dom";
import "./Home.css";

function Home() {
  return (
    <div className="site">
      <header className="cabecalho">
        <div className="container cabecalho-conteudo">
          <h1>Agenda Life</h1>

          <nav>
            <a href="#inicio">Início</a>
            <a href="#sobre">Sobre</a>
            <a href="#contato">Contato</a>
            <Link to="/agendar" className="botao">
              Agendar horário
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section id="inicio" className="inicio">
          <div className="container">
            <p className="subtitulo">ESTÉTICA E CUIDADOS PESSOAIS</p>

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

        <section className="agendamento">
          <div className="container">
            <h2>Agende seu atendimento</h2>

            <p>
              Consulte os serviços disponíveis e escolha o melhor
              horário para você.
            </p>

            <Link to="/agendar" className="botao">
              Ver horários
            </Link>
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
