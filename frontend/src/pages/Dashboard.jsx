
import { Link } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  return (
    <main className="dashboard">
      <header className="dashboard-header">
        <Link to="/" className="dashboard-logo">
          Agenda Life
        </Link>
      </header>

      <section className="dashboard-conteudo">
        <h1>Painel administrativo</h1>
        <p>Bem-vinda! Gerencie seu espaço por aqui.</p>

        <div className="dashboard-cards">
          <Link to="/admin/agendamentos" className="dashboard-card">
            <h2>Agendamentos</h2>
            <p>Consulte e organize os horários.</p>
          </Link>

          <Link to="/admin/clientes" className="dashboard-card">
            <h2>Clientes</h2>
            <p>Consulte os clientes cadastrados.</p>
          </Link>

          <Link to="/admin/servicos" className="dashboard-card">
            <h2>Serviços</h2>
            <p>Consulte os serviços oferecidos.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;
