import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Agendar from "./pages/Agendar";
import Confirmacao from "./pages/Confirmacao";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Agendamentos from "./pages/Agendamentos";
import Clientes from "./pages/Clientes";
import Servicos from "./pages/Servicos";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agendar" element={<Agendar />} />
        <Route path="/confirmacao" element={<Confirmacao />} />

        <Route path="/login" element={<Login />} />
        <Route
          path="/admin"
          element={<Navigate to="/admin/dashboard" replace />}
        />
        <Route path="/admin/dashboard" element={<Dashboard />} />
        <Route path="/admin/agendamentos" element={<Agendamentos />} />
        <Route path="/admin/clientes" element={<Clientes />} />
        <Route path="/admin/servicos" element={<Servicos />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;