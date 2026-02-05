/**
 * Componente raiz da aplicação FAURG - Sistema de Gestão de Trilhas de Aprendizagem
 *
 * ARQUITETURA:
 * - React Router para navegação SPA (Single Page Application)
 * - Context Providers para gerenciamento de estado global
 * - Estrutura modular com componentes separados por funcionalidade
 *
 * CONTEXTOS:
 * - TrailsProvider: Gerencia estado das trilhas (CRUD, cache local)
 * - ProgressProvider: Controla progresso do usuário (localStorage)
 *
 * ROTAS:
 * - "/" - Página de login (porta de entrada)
 * - "/admin" - Dashboard administrativo
 * - "/trails" - Catálogo público de trilhas
 * - "/trail/:id" - Visualizador de trilha individual
 * - "/create-trail" - Editor de nova trilha
 * - "/edit-trail/:id" - Editor de trilha existente
 * - "/users-settings" - Configurações e gerenciamento de usuários
 *
 * FUTURO (para integração com backend):
 * - Adicionar QueryProvider (React Query)
 * - Adicionar AuthProvider (JWT)
 * - Adicionar ErrorProvider (tratamento global de erros)
 */

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { TrailsProvider } from "./contexts/TrailsContext"; // Estado global das trilhas
import { ProgressProvider } from "./contexts/ProgressContext"; // Estado do progresso do usuário
import { ThemeProvider } from "./contexts/ThemeContext"; // Tema escuro/claro
import { AuthProvider } from "./contexts/AuthContext"; // Autenticação e usuário atual
import { QueryProvider } from "./providers/QueryProvider"; // React Query
import ProtectedRoute from "./components/ProtectedRoute";

// Páginas públicas / autenticação
import LoginFaurg from "./components/LoginFaurg";
import ForgotPassword from "./components/ForgotPassword";

// Páginas administrativas
import AdminDashboard from "./components/AdminDashboard";
import AdminCertificados from "./components/AdminCertificados";
import AdminReportsPage from "./components/AdminReportsPage";
import UsersAndSettings from "./components/UsersAndSettings";

// Páginas de trilhas
import TrailEditor from "./components/TrailEditor";
import TrailsCatalog from "./components/TrailsCatalog";
import TrailViewer from "./components/TrailViewer";
import CertificateGenerator from "./components/CertificateGenerator";

// Demais páginas
import Dashboard from "./components/Dashboard";
import AprendizHome from "./components/AprendizHome";
import MyLearning from "./components/MyLearning";
import PersonalPanel from "./components/PersonalPanel";
import PersonalPanelAprendiz from "./components/PersonalPanelAprendiz";
import Achievements from "./components/Achievements";
import IntegrationTest from "./pages/IntegrationTest";
import IntegrationExample from "./components/IntegrationExample";

function App() {
  return (
    // Hierarquia de Providers: QueryProvider > AuthProvider > TrailsProvider > ProgressProvider > ThemeProvider > Router
    // Ordem importante: QueryProvider deve estar no topo, depois Auth, depois dados
    <QueryProvider>
      <AuthProvider>
        <TrailsProvider>
          <ProgressProvider>
            <ThemeProvider>
              {/* BrowserRouter habilita navegação SPA com HTML5 History API */}
              <Router>
            <Routes>
              {/* Teste de integração */}
              <Route path="/test-backend" element={<IntegrationTest />} />
              <Route
                path="/integration-example"
                element={<IntegrationExample />}
              />
              <Route
                path="/admin/integration-example"
                element={<IntegrationExample />}
              />

              {/* Autenticação */}
              <Route path="/" element={<LoginFaurg />} />
              <Route path="/login" element={<LoginFaurg />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />

              {/* Páginas públicas */}
              <Route path="/trails" element={<TrailsCatalog />} />
              <Route path="/trail/:id" element={<TrailViewer />} />
              <Route
                path="/certificate/:trailId"
                element={<CertificateGenerator />}
              />
              <Route path="/certificados" element={<Achievements />} />

              {/* Dashboard geral (pública no momento) */}
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Rotas de aprendiz */}
              <Route
                path="/aprendiz"
                element={
                  <ProtectedRoute allowedRoles={["Aprendiz"]}>
                    <AprendizHome />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/painel-aprendiz"
                element={
                  <ProtectedRoute allowedRoles={["Aprendiz"]}>
                    <PersonalPanelAprendiz />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/meu-aprendizado"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "Aprendiz",
                      "Administrador",
                      "Mentor",
                      "Gestor",
                      "Autor de Conteúdo",
                    ]}
                  >
                    <MyLearning />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/painel"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "Aprendiz",
                      "Administrador",
                      "Mentor",
                      "Gestor",
                      "Autor de Conteúdo",
                    ]}
                  >
                    <PersonalPanel />
                  </ProtectedRoute>
                }
              />

              {/* Rotas administrativas */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "Administrador",
                      "Gestor",
                      "Autor de Conteúdo",
                    ]}
                  >
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/register"
                element={
                  <ProtectedRoute allowedRoles={["Administrador", "Gestor"]}>
                    <UsersAndSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/certificados"
                element={
                  <ProtectedRoute allowedRoles={["Administrador"]}>
                    <AdminCertificados />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute allowedRoles={["Administrador", "Gestor"]}>
                    <AdminReportsPage />
                  </ProtectedRoute>
                }
              />

              {/* Criação/Edição de trilhas */}
              <Route
                path="/create-trail"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "Autor de Conteúdo",
                      "Gestor",
                      "Administrador",
                    ]}
                  >
                    <TrailEditor />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/edit-trail/:id"
                element={
                  <ProtectedRoute
                    allowedRoles={[
                      "Autor de Conteúdo",
                      "Gestor",
                      "Administrador",
                    ]}
                  >
                    <TrailEditor />
                  </ProtectedRoute>
                }
              />
            </Routes>
          </Router>
              </ThemeProvider>
            </ProgressProvider>
          </TrailsProvider>
        </AuthProvider>
      </QueryProvider>
    );
  }

  export default App;
