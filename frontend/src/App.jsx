import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Agendar from "./pages/Agendar";
import Confirmacao from "./pages/Confirmacao";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/agendar" element={<Agendar />} />
        <Route path="/confirmacao" element={<Confirmacao />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
