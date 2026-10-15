import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { salvarToken } from "../services/api";
import "./Login.css";

function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  const navegar = useNavigate();

  async function entrar(event) {
    event.preventDefault();
    setErro("");

    if (!email.trim() || !senha) {
      setErro("Preencha o e-mail e a senha.");
      return;
    }

    if (carregando) return;

    setCarregando(true);

    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 10000);

    try {
      const apiUrl = (
        import.meta.env.VITE_API_URL || "http://localhost:8000"
      ).replace(/\/+$/, "");

      const resposta = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
          senha,
        }),
        signal: controlador.signal,
      });

      const dados = await resposta.json().catch(() => null);

      if (!resposta.ok) {
        if (resposta.status === 401) {
          throw new Error("E-mail ou senha incorretos.");
        }

        throw new Error(
          dados?.detail || `Erro do servidor (${resposta.status}).`
        );
      }

      if (!dados?.access_token) {
        throw new Error("A API não retornou o token de acesso.");
      }

      salvarToken(dados.access_token);

      navegar("/admin/dashboard", { replace: true });
    } catch (erroApi) {
      if (erroApi.name === "AbortError") {
        setErro(
          "O servidor demorou para responder. Verifique se o backend está funcionando e tente novamente."
        );
      } else if (erroApi instanceof TypeError) {
        setErro(
          "Não foi possível conectar à API. Confira o endereço do servidor e se o backend está ligado."
        );
      } else {
        setErro(erroApi.message || "Não foi possível realizar o login.");
      }
    } finally {
      clearTimeout(temporizador);
      setCarregando(false);
    }
  }

  return (
    <main className="login-admin">
      <section className="login-apresentacao">
        <Link to="/" className="login-logo">
          Agenda Life
        </Link>

        <div className="login-mensagem">
          <h1>Seu espaço, sua gestão.</h1>
          <p>
            Gerencie seus agendamentos, clientes e serviços
            em um só lugar.
          </p>
        </div>

        <span className="login-rodape">
          Agenda Life · Beleza e bem-estar
        </span>
      </section>

      <section className="login-conteudo">
        <form className="login-formulario" onSubmit={entrar}>
          <span className="login-etiqueta">
            ÁREA ADMINISTRATIVA
          </span>

          <h2>Entrar</h2>

          <p className="login-descricao">
            Informe seus dados de acesso.
          </p>

          <label htmlFor="email">E-mail</label>
          <input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            disabled={carregando}
          />

          <label htmlFor="senha">Senha</label>

          <div className="login-campo-senha">
            <input
              id="senha"
              type={mostrarSenha ? "text" : "password"}
              placeholder="Sua senha"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
              disabled={carregando}
            />

            <button
              type="button"
              className="login-mostrar-senha"
              onClick={() => setMostrarSenha(!mostrarSenha)}
              disabled={carregando}
            >
              {mostrarSenha ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {erro && (
            <p className="login-erro" role="alert">
              {erro}
            </p>
          )}

          <button
            type="submit"
            className="login-botao"
            disabled={carregando}
          >
            {carregando ? "Verificando acesso..." : "Entrar"}
          </button>

          <p className="login-seguranca">
            Acesso exclusivo para administração.
          </p>
        </form>
      </section>
    </main>
  );
}

export default Login;