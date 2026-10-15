
const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:8000"
).replace(/\/+$/, "");

// Recupera o token do administrador
export function obterToken() {
  return sessionStorage.getItem("agenda_token");
}

// Salva o token após o login
export function salvarToken(token) {
  sessionStorage.setItem("agenda_token", token);
}

// Remove o token ao sair ou quando a sessão expirar
export function limparSessao() {
  sessionStorage.removeItem("agenda_token");
}

// Função central para fazer requisições à API
export async function apiFetch(caminho, opcoes = {}) {
  const token = obterToken();
  const headers = new Headers(opcoes.headers || {});

  if (opcoes.body && !(opcoes.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let resposta;

  try {
    resposta = await fetch(`${API_URL}${caminho}`, {
      ...opcoes,
      headers,
    });
  } catch {
    throw new Error(
      "Não foi possível conectar ao servidor. Verifique sua conexão."
    );
  }

  if (resposta.status === 401) {
    limparSessao();

    if (window.location.pathname.startsWith("/admin")) {
      window.location.replace("/login");
    }

    throw new Error("Sua sessão expirou. Faça login novamente.");
  }

  const texto = await resposta.text();
  let dados = null;

  if (texto) {
    try {
      dados = JSON.parse(texto);
    } catch {
      dados = texto;
    }
  }

  if (!resposta.ok) {
    const mensagem =
      typeof dados === "object" && dados !== null
        ? dados.detail || dados.message
        : null;

    throw new Error(
      mensagem || `Erro na API: ${resposta.status}`
    );
  }

  return dados;
}
