import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.tsx'
import './index.css'

/**
 * Ponto de entrada principal da aplicação (Entry Point).
 * * Inicializa a árvore de componentes do React, anexa a interface ao elemento DOM 
 * raiz (`#root`) e injeta os provedores de contexto globais necessários:
 * * - `StrictMode`: Ativa verificações adicionais de ciclo de vida e detecta práticas obsoletas no ambiente de desenvolvimento.
 * - `BrowserRouter`: Habilita o sistema de roteamento (React Router) para controle de navegação no lado do cliente (SPA).
 * - `Toaster`: Registra o contêiner global responsável por exibir notificações não intrusivas (toast) em toda a aplicação.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-right" />
    </BrowserRouter>
  </StrictMode>,
)
