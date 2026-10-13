import { Link, useLocation } from "react-router-dom";
import "./Confirmacao.css";

function Confirmacao() {
  const { state } = useLocation();

  const agendamento = state?.agendamento;

  if (!agendamento) {
    return (
      <main className="confirmacao-container">
        <section className="confirmacao-card">
          <h1>Nenhum agendamento encontrado</h1>
          <p>
            Para visualizar a confirmação, primeiro realize um
            agendamento.
          </p>
          <Link to="/agendar" className="confirmacao-botao">
            Fazer agendamento
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="confirmacao-container">
      <section className="confirmacao-card">
        <div className="confirmacao-icone">✓</div>

        <h1>Solicitação recebida!</h1>

        <p className="confirmacao-descricao">
          Confira os dados do seu atendimento abaixo.
        </p>

        <div className="confirmacao-dados">
          <div className="confirmacao-linha">
            <span>Cliente</span>
            <strong>{agendamento.cliente || "Não informado"}</strong>
          </div>

          <div className="confirmacao-linha">
            <span>Serviço</span>
            <strong>{agendamento.servico || "Não informado"}</strong>
          </div>

          <div className="confirmacao-linha">
            <span>Data</span>
            <strong>{agendamento.data || "Não informada"}</strong>
          </div>

          <div className="confirmacao-linha">
            <span>Horário</span>
            <strong>{agendamento.hora || "Não informado"}</strong>
          </div>

          <div className="confirmacao-linha">
            <span>Status</span>
            <strong>{agendamento.status || "Solicitado"}</strong>
          </div>
        </div>

        <p className="confirmacao-aviso">
          Guarde essas informações para consultar seu atendimento.
        </p>

        <Link to="/" className="confirmacao-botao">
          Voltar para o início
        </Link>
      </section>
    </main>
  );
}

export default Confirmacao;
