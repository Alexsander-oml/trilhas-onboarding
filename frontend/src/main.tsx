/**
 * Ponto de entrada principal da aplicação React
 * 
 * Este arquivo é responsável por:
 * - Renderizar a aplicação React no DOM
 * - Aplicar o StrictMode para detectar problemas de desenvolvimento
 * - Importar estilos globais (CSS Reset e estilos customizados)
 * - Configurar o root da aplicação usando o React 18+ createRoot API
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'           // Estilos globais da aplicação
import './styles/normalize.css' // CSS Reset para consistência cross-browser
import App from './App.tsx'

// Criar root da aplicação usando React 18+ concurrent features
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* StrictMode ajuda a detectar problemas como:
        - Componentes com side effects
        - APIs deprecated
        - Renderizações duplas para detectar bugs */}
    <App />
  </StrictMode>,
)
