import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTrails } from "../contexts/TrailsContext";
import { useTheme } from "../contexts/ThemeContext";
import { apiUtils } from "../services/api";
import AdminTabs from "./AdminTabs";

type UserRole =
  | "Aprendiz"
  | "Mentor"
  | "Gestor"
  | "Autor de conteúdo"
  | "Administrador";
type UserStatus = "Ativo" | "Inativo" | "Suspenso" | "Pendente";

interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  department: string;
  position: string;
  lastLogin: string;
  enrolledTrails: number[];
  completedTrails: number[];
  avatar: string;
  createdAt: string;
  permissions: string[];
  exceptions: string[];
}

interface AuditLog {
  id: number;
  action: string;
  user: string;
  target: string;
  timestamp: string;
  ip: string;
  details?: string;
}

interface AssignmentRule {
  id: number;
  name: string;
  criteria: {
    department?: string;
    position?: string;
    role?: UserRole;
  };
  trailIds: number[];
  active: boolean;
}

const UsersAndSettings: React.FC = () => {
  const navigate = useNavigate();
  const { trails } = useTrails();
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<
    | "users"
    | "permissions"
    | "bulk"
    | "assignments"
    | "exceptions"
    | "audit"
  >("users");

  // Estado para usuários (carregado do backend)
  const [users, setUsers] = useState<User[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"Todos" | UserRole>("Todos");
  const [statusFilter, setStatusFilter] = useState<"Todos" | UserStatus>(
    "Todos",
  );
  // campos para adicionar usuário via modal
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<UserRole>("Aprendiz");
  const [newDepartment, setNewDepartment] = useState("");
  const [newPosition, setNewPosition] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // UI state for modals, selection and utilities
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  // header visual only (no extra mobile menu)

  const [assignmentRules, setAssignmentRules] = useState<AssignmentRule[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const [settings, setSettings] = useState<any>({
    general: {
      siteName: "Plataforma",
      maxUsers: 1000,
      maintenance: false,
      registrationEnabled: true,
      autoAssignment: true,
    },
    security: {
      passwordMinLength: 8,
      sessionTimeout: 60,
      loginAttempts: 5,
      auditRetention: 365,
      twoFactorAuth: false,
    },
  });

  const handleSettingChange = (path: string, value: any) => {
    setSettings((prev: any) => {
      const next = { ...prev };
      const parts = path.split(".");
      let cur: any = next;
      for (let i = 0; i < parts.length - 1; i++) {
        const p = parts[i];
        cur[p] = { ...(cur[p] || {}) };
        cur = cur[p];
      }
      cur[parts[parts.length - 1]] = value;
      return next;
    });
  };

  const handleUserStatusChange = async (userId: number, status: UserStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status } : u)),
    );
    try {
      await apiUtils.patch(`/users/${userId}/`, { status });
    } catch (err) {
      console.error("Erro ao atualizar status", err);
    }
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    alert("Upload em massa não implementado nesta versão de preview.");
  };

  const handleAddUser = async () => {
    try {
      // Extrair first_name e last_name do nome completo
      const parts = newName.trim().split(/\s+/).filter(Boolean);
      const first_name = parts.length ? parts[0] : "";
      const last_name = parts.length > 1 ? parts.slice(1).join(" ") : "";

      // Gerar username a partir do email
      let username = "";
      if (newEmail && newEmail.includes("@")) {
        username = newEmail.split("@")[0];
      } else {
        username = (
          first_name + (last_name ? "_" + last_name.split(/\s+/).join("_") : "")
        ).toLowerCase();
      }
      username = username.replace(/[^a-z0-9_.-]/gi, "");
      if (!username) username = `user${Date.now()}`;

      const payload = {
        username,
        first_name,
        last_name,
        email: newEmail,
        password: newPassword,
        perfil_nome: newRole,
        cargo: newPosition || "",
        unidade: newDepartment || "",
      };
      await apiUtils.post("/users/admin/register/", payload);
      setShowAddModal(false);
      setNewName("");
      setNewEmail("");
      setNewRole("Aprendiz");
      setNewDepartment("");
      setNewPosition("");
      setNewPassword("");
      await loadUsers();
    } catch (err) {
      console.error("Erro ao adicionar usuário", err);
      alert(
        "Falha ao adicionar usuário. Verifique os dados e tente novamente.",
      );
    }
  };

  const loadUsers = async () => {
    try {
      setIsLoadingUsers(true);
      type BackendUser = {
        id: number;
        username?: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        role?: string;
        perfil?: {
          id_perfil: number;
          nome: string;
          descricao?: string;
        };
      };
      const data = await apiUtils.get<BackendUser[]>("/users/admin/users/");
      console.log("Usuários carregados do backend:", data);

      if (!Array.isArray(data)) {
        console.error("Resposta inesperada do backend - não é um array:", data);
        setUsers([]);
        return;
      }

      // mapear campos do backend para o shape usado aqui
      const mapped: User[] = data.map((u) => ({
        id: u.id,
        name:
          (
            (u.first_name || "") + (u.last_name ? " " + u.last_name : "")
          ).trim() ||
          u.username ||
          u.email ||
          "N/A",
        email: u.email || "",
        role: ((u.perfil?.nome || u.role) as UserRole) || "Aprendiz",
        status: "Ativo",
        department: "",
        position: "",
        lastLogin: "",
        enrolledTrails: [],
        completedTrails: [],
        avatar: "👤",
        createdAt: "",
        permissions: [],
        exceptions: [],
      }));
      setUsers(mapped);
    } catch (err) {
      console.error("Erro ao carregar usuários do backend", err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // computed filtered users based on search, role and status
  const filteredUsers = users.filter((u) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    const matchesRole = roleFilter === "Todos" || u.role === roleFilter;
    const matchesStatus = statusFilter === "Todos" || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // handleAssignTrails removed (was unused) - assignment UI updates users directly via modal workflow when implemented

  const handleDeleteUser = async (userId: number) => {
    const ok = window.confirm(
      "Tem certeza que deseja excluir este usuário? Esta ação é irreversível.",
    );
    if (!ok) return;
    try {
      await apiUtils.delete(`/users/${userId}/`);
      await loadUsers();
    } catch (err) {
      console.error("Erro ao excluir usuário", err);
      alert("Falha ao excluir usuário. Verifique permissões.");
    }
  };

  const handleEditUser = async (user: User) => {
    // Simple quick-edit flow: prompt for role and optional password (keeps other fields intact)
    const newRole = window.prompt(
      "Novo papel (Aprendiz, Mentor, Gestor, Autor, Administrador):",
      user.role,
    );
    if (newRole === null) return; // cancelado
    const newPassword = window.prompt(
      "Nova senha (deixe em branco para manter a atual):",
      "",
    );

    const payload: Record<string, unknown> = {};
    if (newRole && newRole !== user.role)
      payload.role =
        (newRole as string) === "Autor" ||
        (newRole as string) === "Autor de Conteúdo"
          ? "Autor de conteúdo"
          : newRole;
    if (newPassword) payload.password = newPassword;

    if (Object.keys(payload).length === 0) return; // nada a alterar

    try {
      await apiUtils.patch(`/users/${user.id}/`, payload);
      await loadUsers();
    } catch (err) {
      console.error("Erro ao editar usuário", err);
      alert("Falha ao atualizar usuário. Verifique permissões e dados.");
    }
  };

  // handleAddException removed (was unused) - placeholder kept for future exception handling

  const renderUsersTab = () => (
    <div className="space-y-6">
      {/* Cabeçalho com ações */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h3
            className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
          >
            Gestão de Usuários
          </h3>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Gerencie usuários, perfis e permissões
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            aria-label="Adicionar usuário"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm text-white shadow-sm transition hover:bg-blue-700"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M12 5v14M5 12h14" />
            </svg>
            <span>Adicionar Usuário</span>
          </button>

          <button
            onClick={() => setShowBulkModal(true)}
            aria-label="Matrícula em massa"
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm transition ${isDark ? "border-gray-600 bg-gray-800 text-gray-200 hover:bg-gray-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span>Matrícula em Massa</span>
          </button>
        </div>
      </div>

      {/* Filtros: grid responsivo, campos compactos e busca com destaque sutil */}
      <div
        className={`mb-6 grid grid-cols-1 items-end gap-3 rounded-lg p-3 sm:grid-cols-4 ${isDark ? "bg-gray-800" : "bg-gray-50"}`}
      >
        <div>
          <label className="sr-only">Papel</label>
          <select
            className={`w-full rounded-md border px-2 py-1 text-sm ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(
                e.target.value === "Todos"
                  ? "Todos"
                  : (e.target.value as UserRole),
              )
            }
          >
            <option value="Todos">Todos os Papéis</option>
            <option value="Aprendiz">Aprendiz</option>
            <option value="Mentor">Mentor</option>
            <option value="Gestor">Gestor</option>
            <option value="Autor de conteúdo">Autor de Conteúdo</option>
            <option value="Administrador">Administrador</option>
          </select>
        </div>

        <div>
          <label className="sr-only">Status</label>
          <select
            className={`w-full rounded-md border px-2 py-1 text-sm ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value === "Todos"
                  ? "Todos"
                  : (e.target.value as UserStatus),
              )
            }
          >
            <option value="Todos">Todos os Status</option>
            <option value="Ativo">Ativo</option>
            <option value="Inativo">Inativo</option>
            <option value="Suspenso">Suspenso</option>
            <option value="Pendente">Pendente</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="sr-only">Buscar</label>
          <input
            type="text"
            placeholder="Buscar por nome ou email..."
            className={`w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:ring-1 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100 focus:ring-blue-500" : "border-blue-200 bg-white text-gray-900 focus:ring-blue-200"}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de usuários - visual atualizado */}
      <div className="overflow-x-auto">
        <table
          className={`w-full border-collapse rounded-lg text-sm shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <thead>
            <tr className={isDark ? "bg-gray-700" : "bg-gray-50"}>
              <th
                className={`border-r px-4 py-3 text-left last:border-r-0 ${isDark ? "border-gray-600" : "border-gray-100"}`}
              >
                <input type="checkbox" className="rounded" />
              </th>
              <th
                className={`border-r px-4 py-3 text-left last:border-r-0 ${isDark ? "border-gray-600 text-gray-200" : "border-gray-100 text-gray-900"}`}
              >
                Usuário
              </th>
              <th
                className={`border-r px-4 py-3 text-left last:border-r-0 ${isDark ? "border-gray-600 text-gray-200" : "border-gray-100 text-gray-900"}`}
              >
                Papel
              </th>
              <th
                className={`border-r px-4 py-3 text-left last:border-r-0 ${isDark ? "border-gray-600 text-gray-200" : "border-gray-100 text-gray-900"}`}
              >
                Departamento
              </th>
              <th
                className={`border-r px-4 py-3 text-center last:border-r-0 ${isDark ? "border-gray-600 text-gray-200" : "border-gray-100 text-gray-900"}`}
              >
                Status
              </th>
              <th
                className={`border-r px-4 py-3 text-center last:border-r-0 ${isDark ? "border-gray-600 text-gray-200" : "border-gray-100 text-gray-900"}`}
              >
                Trilhas
              </th>
              <th
                className={`border-r px-4 py-3 text-left last:border-r-0 ${isDark ? "border-gray-600 text-gray-200" : "border-gray-100 text-gray-900"}`}
              >
                Último Login
              </th>
              <th
                className={`px-4 py-3 text-center ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody
            className={`divide-y ${isDark ? "divide-gray-700" : "divide-gray-100"}`}
          >
            {isLoadingUsers ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                    <p
                      className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                    >
                      Carregando usuários...
                    </p>
                  </div>
                </td>
              </tr>
            ) : filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <svg
                      className={`h-12 w-12 ${isDark ? "text-gray-600" : "text-gray-400"}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                      />
                    </svg>
                    <div>
                      <p
                        className={`text-base font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        Nenhum usuário encontrado
                      </p>
                      <p
                        className={`mt-1 text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        {searchTerm ||
                        roleFilter !== "Todos" ||
                        statusFilter !== "Todos"
                          ? "Tente ajustar os filtros de busca"
                          : "Clique em 'Adicionar Usuário' para começar"}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}
                >
                  <td className="px-4 py-4 align-middle">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers((prev) => [...prev, user.id]);
                        } else {
                          setSelectedUsers((prev) =>
                            prev.filter((id) => id !== user.id),
                          );
                        }
                      }}
                      className="rounded"
                    />
                  </td>

                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                      >
                        {user.avatar}
                      </span>
                      <div>
                        <div
                          className={`text-base font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                        >
                          {user.name}
                        </div>
                        <div
                          className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        >
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-4 py-4 align-middle">
                    <span
                      className={`inline-flex min-w-[72px] items-center justify-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
                        user.role === "Administrador"
                          ? isDark
                            ? "border-purple-800 bg-purple-900/30 text-purple-400"
                            : "border-purple-200 bg-purple-50 text-purple-700"
                          : user.role === "Gestor"
                            ? isDark
                              ? "border-blue-800 bg-blue-900/30 text-blue-400"
                              : "border-blue-200 bg-blue-50 text-blue-700"
                            : user.role === "Autor de conteúdo"
                              ? isDark
                                ? "border-orange-800 bg-orange-900/30 text-orange-400"
                                : "border-orange-200 bg-orange-50 text-orange-700"
                              : user.role === "Mentor"
                                ? isDark
                                  ? "border-green-800 bg-green-900/30 text-green-400"
                                  : "border-green-200 bg-green-50 text-green-700"
                                : isDark
                                  ? "border-gray-600 bg-gray-700 text-gray-300"
                                  : "border-gray-200 bg-gray-50 text-gray-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>

                  <td
                    className={`px-4 py-4 align-middle text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    <div>{user.department || "-"}</div>
                    <div
                      className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
                    >
                      {user.position || "-"}
                    </div>
                  </td>

                  <td className="w-36 px-4 py-4 align-middle">
                    <div className="flex justify-center">
                      <select
                        value={user.status}
                        onChange={(e) =>
                          handleUserStatusChange(
                            user.id,
                            e.target.value as UserStatus,
                          )
                        }
                        className={`mx-auto rounded-md border-0 px-2 py-1 text-sm font-medium ${
                          user.status === "Ativo"
                            ? isDark
                              ? "bg-green-900/30 text-green-400"
                              : "bg-green-50 text-green-800"
                            : user.status === "Inativo"
                              ? "bg-gray-50 text-gray-700"
                              : user.status === "Suspenso"
                                ? "bg-red-50 text-red-800"
                                : "bg-yellow-50 text-yellow-800"
                        }`}
                      >
                        <option value="Ativo">Ativo</option>
                        <option value="Inativo">Inativo</option>
                        <option value="Suspenso">Suspenso</option>
                        <option value="Pendente">Pendente</option>
                      </select>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-center align-middle text-sm text-gray-700">
                    <div>{user.enrolledTrails.length} inscritas</div>
                    <div className="text-sm text-gray-500">
                      {user.completedTrails.length} concluídas
                    </div>
                  </td>

                  <td className="px-4 py-4 align-middle text-sm text-gray-600">
                    {user.lastLogin || "-"}
                  </td>

                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedUser(user);
                          setShowExceptionModal(true);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-orange-600 hover:bg-gray-100"
                        title="Gerenciar Exceções"
                      >
                        ⚠️
                      </button>
                      <button
                        onClick={() => {
                          setSelectedUsers([user.id]);
                          setShowAssignModal(true);
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-blue-600 hover:bg-gray-100"
                        title="Atribuir Trilhas"
                      >
                        📚
                      </button>
                      <button
                        onClick={() => handleEditUser(user)}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-gray-600 hover:bg-gray-100"
                        title="Editar"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-red-600 hover:bg-gray-100"
                        title="Excluir"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Ações em lote */}
      {selectedUsers.length > 0 && (
        <div className="flex items-center gap-4 rounded-lg bg-blue-50 p-4">
          <span className="text-sm text-gray-700">
            {selectedUsers.length} usuário(s) selecionado(s)
          </span>
          <button
            onClick={() => setShowAssignModal(true)}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Atribuir Trilhas
          </button>
          <button
            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
            onClick={async () => {
              // placeholder for suspend action
              alert("Funcionalidade de suspender ainda não implementada.");
            }}
          >
            Suspender
          </button>
          <button
            onClick={async () => {
              const ok = window.confirm(
                `Deseja realmente excluir ${selectedUsers.length} usuário(s)? Esta ação não pode ser desfeita.`,
              );
              if (!ok) return;
              try {
                // chamar endpoint de exclusão em massa
                await apiUtils.post("/users/bulk-delete/", {
                  ids: selectedUsers,
                });
                await loadUsers();
                setSelectedUsers([]);
              } catch (err) {
                console.error("Erro na exclusão em massa", err);
                alert(
                  "Falha ao excluir usuários selecionados. Verifique permissões.",
                );
              }
            }}
            className="rounded bg-red-700 px-4 py-2 text-white hover:bg-red-800"
          >
            Excluir selecionados
          </button>
        </div>
      )}
    </div>
  );

  const renderPermissionsTab = () => (
    <div className="space-y-6">
      <h3
        className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        Gestão de Perfis e Permissões
      </h3>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[
          "Aprendiz",
          "Mentor",
          "Gestor",
          "Autor de conteúdo",
          "Administrador",
        ].map((role) => (
          <div
            key={role}
            className={`rounded-lg border p-6 shadow ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
          >
            <h4
              className={`mb-4 font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
            >
              {role}
            </h4>
            <div className="space-y-2">
              {role === "Aprendiz" && (
                <>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Visualizar trilhas
                  </label>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Completar módulos
                  </label>
                </>
              )}
              {role === "Mentor" && (
                <>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Visualizar trilhas
                  </label>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Mentorar usuários
                  </label>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Avaliar progresso
                  </label>
                </>
              )}
              {role === "Gestor" && (
                <>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Atribuir trilhas
                  </label>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Visualizar relatórios
                  </label>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Gerenciar equipe
                  </label>
                </>
              )}
              {role === "Autor de conteúdo" && (
                <>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Criar trilhas
                  </label>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Editar conteúdo
                  </label>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Publicar trilhas
                  </label>
                </>
              )}
              {role === "Administrador" && (
                <>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Acesso total
                  </label>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Auditoria
                  </label>
                  <label
                    className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                  >
                    <input type="checkbox" defaultChecked className="mr-2" />
                    Configurações sistema
                  </label>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBulkTab = () => (
    <div className="space-y-6">
      <h3
        className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        Matrícula em Massa
      </h3>

      <div
        className={`rounded-lg p-6 shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        <h4
          className={`mb-4 font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
        >
          Importar Usuários via Planilha
        </h4>

        <div className="space-y-4">
          <div>
            <label
              className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
            >
              Arquivo de Importação (.xlsx, .csv)
            </label>
            <input
              type="file"
              accept=".xlsx,.csv"
              onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
              className={`block w-full text-sm ${isDark ? "text-gray-400 file:bg-blue-900/30 file:text-blue-400" : "text-gray-500 file:bg-blue-50 file:text-blue-700"} file:mr-4 file:rounded-full file:border-0 file:px-4 file:py-2 file:text-sm file:font-semibold hover:file:bg-blue-100`}
            />
          </div>

          <div
            className={`rounded p-4 ${isDark ? "bg-blue-900/20 text-blue-300" : "bg-blue-50 text-blue-800"}`}
          >
            <h5
              className={`mb-2 font-medium ${isDark ? "text-blue-300" : "text-blue-900"}`}
            >
              Formato da Planilha:
            </h5>
            <ul className="space-y-1 text-sm">
              <li>• Nome (obrigatório)</li>
              <li>• Email (obrigatório)</li>
              <li>• Departamento</li>
              <li>• Cargo</li>
              <li>• Papel (Aprendiz, Mentor, Gestor, Autor de Conteúdo)</li>
            </ul>
          </div>

          <button
            onClick={handleBulkUpload}
            disabled={!bulkFile}
            className={`rounded px-4 py-2 text-white transition-colors ${!bulkFile ? (isDark ? "bg-gray-700" : "bg-gray-400") : "bg-green-600 hover:bg-green-700"}`}
          >
            Processar Importação
          </button>
        </div>
      </div>

      <div
        className={`rounded-lg p-6 shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        <h4
          className={`mb-4 font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
        >
          Histórico de Importações
        </h4>
        <div className="space-y-3">
          <div
            className={`flex items-center justify-between rounded p-3 ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
          >
            <div>
              <span
                className={`font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
              >
                usuarios_outubro_2024.xlsx
              </span>
              <span
                className={`ml-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                152 usuários importados
              </span>
            </div>
            <span
              className={`text-sm ${isDark ? "text-green-400" : "text-green-600"}`}
            >
              ✅ Sucesso
            </span>
          </div>
          <div
            className={`flex items-center justify-between rounded p-3 ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
          >
            <div>
              <span
                className={`font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
              >
                novos_colaboradores.csv
              </span>
              <span
                className={`ml-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                23 usuários importados
              </span>
            </div>
            <span
              className={`text-sm ${isDark ? "text-green-400" : "text-green-600"}`}
            >
              ✅ Sucesso
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssignmentsTab = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3
          className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
        >
          Atribuição Automática de Trilhas
        </h3>
        <button
          onClick={() => setShowRuleModal(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Nova Regra
        </button>
      </div>

      <div className="space-y-4">
        {assignmentRules.map((rule) => (
          <div
            key={rule.id}
            className={`rounded-lg border p-6 shadow ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4
                  className={`font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
                >
                  {rule.name}
                </h4>
                <div
                  className={`mt-2 space-y-1 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  <div>
                    Critérios:{" "}
                    {Object.entries(rule.criteria)
                      .map(
                        ([key, value]) =>
                          `${key === "department" ? "Departamento" : key === "position" ? "Cargo" : "Papel"}: ${value}`,
                      )
                      .join(", ")}
                  </div>
                  <div>
                    Trilhas: {rule.trailIds.length} trilha(s) atribuída(s)
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label
                  className={`flex cursor-pointer items-center ${isDark ? "text-gray-200" : "text-gray-700"}`}
                >
                  <input
                    type="checkbox"
                    checked={rule.active}
                    onChange={(e) => {
                      setAssignmentRules((prev) =>
                        prev.map((r) =>
                          r.id === rule.id
                            ? { ...r, active: e.target.checked }
                            : r,
                        ),
                      );
                    }}
                    className="mr-2"
                  />
                  Ativa
                </label>
                <button
                  className={
                    isDark
                      ? "text-blue-400 hover:text-blue-300"
                      : "text-blue-600 hover:text-blue-800"
                  }
                >
                  Editar
                </button>
                <button
                  className={
                    isDark
                      ? "text-red-400 hover:text-red-300"
                      : "text-red-600 hover:text-red-800"
                  }
                >
                  Excluir
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderExceptionsTab = () => (
    <div className="space-y-6">
      <h3
        className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        Gestão de Exceções e Dispensas
      </h3>

      <div
        className={`overflow-hidden rounded-lg shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        <table className="w-full">
          <thead className={isDark ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              <th
                className={`p-4 text-left ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                Usuário
              </th>
              <th
                className={`p-4 text-left ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                Exceção
              </th>
              <th
                className={`p-4 text-left ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                Motivo
              </th>
              <th
                className={`p-4 text-left ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                Data
              </th>
              <th
                className={`p-4 text-left ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                Status
              </th>
              <th
                className={`p-4 text-left ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                Ações
              </th>
            </tr>
          </thead>
          <tbody
            className={
              isDark ? "divide-y divide-gray-700" : "divide-y divide-gray-100"
            }
          >
            {users
              .filter((u) => u.exceptions.length > 0)
              .map((user) =>
                user.exceptions.map((exception, idx) => {
                  const [type, reason] = exception.split(":");
                  return (
                    <tr
                      key={`${user.id}-${idx}`}
                      className={`border-t ${isDark ? "border-gray-700 hover:bg-gray-700" : "border-gray-100 hover:bg-gray-50"}`}
                    >
                      <td
                        className={`p-4 ${isDark ? "text-gray-200" : "text-gray-900"}`}
                      >
                        <div className="flex items-center gap-2">
                          <span>{user.avatar}</span>
                          <span>{user.name}</span>
                        </div>
                      </td>
                      <td
                        className={`p-4 ${isDark ? "text-gray-200" : "text-gray-900"}`}
                      >
                        {type}
                      </td>
                      <td
                        className={`p-4 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {reason || "Sem motivo especificado"}
                      </td>
                      <td
                        className={`p-4 ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        2024-10-17
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${isDark ? "bg-yellow-900/30 text-yellow-400" : "bg-yellow-100 text-yellow-800"}`}
                        >
                          Ativa
                        </span>
                      </td>
                      <td className="p-4">
                        <button
                          className={
                            isDark
                              ? "text-red-400 hover:text-red-300"
                              : "text-red-600 hover:text-red-800"
                          }
                        >
                          Revogar
                        </button>
                      </td>
                    </tr>
                  );
                }),
              )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderAuditTab = () => (
    <div className="space-y-6">
      <h3
        className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        Auditoria do Sistema
      </h3>

      <div
        className={`flex gap-4 rounded-lg p-4 ${isDark ? "bg-gray-800" : "bg-gray-50"}`}
      >
        <input
          type="date"
          className={`rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
          defaultValue="2024-10-01"
        />
        <input
          type="date"
          className={`rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
          defaultValue="2024-10-17"
        />
        <select
          className={`rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
        >
          <option>Todas as Ações</option>
          <option>Login</option>
          <option>Usuário criado</option>
          <option>Trilha atribuída</option>
          <option>Exceção concedida</option>
        </select>
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Filtrar
        </button>
      </div>

      <div
        className={`overflow-hidden rounded-lg shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        <table className="w-full">
          <thead className={isDark ? "bg-gray-700" : "bg-gray-50"}>
            <tr>
              <th
                className={`p-4 text-left ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                Data/Hora
              </th>
              <th
                className={`p-4 text-left ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                Ação
              </th>
              <th
                className={`p-4 text-left ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                Usuário
              </th>
              <th
                className={`p-4 text-left ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                Alvo
              </th>
              <th
                className={`p-4 text-left ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                IP
              </th>
              <th
                className={`p-4 text-left ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                Detalhes
              </th>
            </tr>
          </thead>
          <tbody
            className={
              isDark ? "divide-y divide-gray-700" : "divide-y divide-gray-100"
            }
          >
            {auditLogs.map((log) => (
              <tr
                key={log.id}
                className={`border-t ${isDark ? "border-gray-700 hover:bg-gray-700" : "border-gray-100 hover:bg-gray-50"}`}
              >
                <td
                  className={`p-4 text-sm ${isDark ? "text-gray-200" : "text-gray-900"}`}
                >
                  {log.timestamp}
                </td>
                <td className="p-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-medium ${
                      log.action.includes("criado")
                        ? isDark
                          ? "bg-green-900/30 text-green-400"
                          : "bg-green-100 text-green-800"
                        : log.action.includes("atribuída")
                          ? isDark
                            ? "bg-blue-900/30 text-blue-400"
                            : "bg-blue-100 text-blue-800"
                          : log.action.includes("Exceção")
                            ? isDark
                              ? "bg-orange-900/30 text-orange-400"
                              : "bg-orange-100 text-orange-800"
                            : isDark
                              ? "bg-gray-700 text-gray-300"
                              : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {log.action}
                  </span>
                </td>
                <td
                  className={`p-4 ${isDark ? "text-gray-200" : "text-gray-900"}`}
                >
                  {log.user}
                </td>
                <td
                  className={`p-4 ${isDark ? "text-gray-200" : "text-gray-900"}`}
                >
                  {log.target}
                </td>
                <td
                  className={`p-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {log.ip}
                </td>
                <td
                  className={`p-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderReportsTab = () => (
    <div className="space-y-6">
      <h3
        className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        Relatórios e Dashboards
      </h3>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div
          className={`rounded-lg p-6 shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <h4
            className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Total de Usuários
          </h4>
          <p className="text-3xl font-bold text-blue-600">{users.length}</p>
          <p
            className={`text-sm ${isDark ? "text-green-400" : "text-green-600"}`}
          >
            +5 este mês
          </p>
        </div>
        <div
          className={`rounded-lg p-6 shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <h4
            className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Usuários Ativos
          </h4>
          <p className="text-3xl font-bold text-green-600">
            {users.filter((u) => u.status === "Ativo").length}
          </p>
          <p
            className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            {Math.round(
              (users.filter((u) => u.status === "Ativo").length /
                users.length) *
                100,
            )}
            % do total
          </p>
        </div>
        <div
          className={`rounded-lg p-6 shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <h4
            className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Trilhas Concluídas
          </h4>
          <p className="text-3xl font-bold text-purple-600">
            {users.reduce((acc, u) => acc + u.completedTrails.length, 0)}
          </p>
          <p
            className={`text-sm ${isDark ? "text-green-400" : "text-green-600"}`}
          >
            +12 esta semana
          </p>
        </div>
        <div
          className={`rounded-lg p-6 shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <h4
            className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Taxa de Conclusão
          </h4>
          <p className="text-3xl font-bold text-orange-600">74%</p>
          <p
            className={`text-sm ${isDark ? "text-green-400" : "text-green-600"}`}
          >
            +3% vs mês anterior
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          className={`rounded-lg p-6 shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <h4
            className={`mb-4 font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
          >
            Usuários por Papel
          </h4>
          <div className="space-y-3">
            {[
              "Aprendiz",
              "Mentor",
              "Gestor",
              "Autor de conteúdo",
              "Administrador",
            ].map((role) => {
              const count = users.filter((u) => u.role === role).length;
              const percentage = (count / users.length) * 100;
              return (
                <div key={role}>
                  <div
                    className={`flex justify-between text-sm ${isDark ? "text-gray-200" : "text-gray-900"}`}
                  >
                    <span>{role}</span>
                    <span>{count} usuários</span>
                  </div>
                  <div
                    className={`h-2 w-full rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                  >
                    <div
                      className="h-2 rounded-full bg-blue-600"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div
          className={`rounded-lg p-6 shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <h4
            className={`mb-4 font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
          >
            Progresso por Departamento
          </h4>
          <div className="space-y-3">
            {["TI", "RH", "Vendas", "Educação"].map((dept) => {
              const deptUsers = users.filter((u) => u.department === dept);
              const totalTrails = deptUsers.reduce(
                (acc, u) => acc + u.enrolledTrails.length,
                0,
              );
              const completedTrails = deptUsers.reduce(
                (acc, u) => acc + u.completedTrails.length,
                0,
              );
              const percentage =
                totalTrails > 0 ? (completedTrails / totalTrails) * 100 : 0;
              return (
                <div key={dept}>
                  <div
                    className={`flex justify-between text-sm ${isDark ? "text-gray-200" : "text-gray-900"}`}
                  >
                    <span>{dept}</span>
                    <span>{Math.round(percentage)}% completo</span>
                  </div>
                  <div
                    className={`h-2 w-full rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                  >
                    <div
                      className="h-2 rounded-full bg-green-600"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Exportar Relatório Completo
        </button>
        <button className="rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700">
          Agendar Relatório Automático
        </button>
      </div>
    </div>
  );

  const renderSettingsTab = () => (
    <div className="space-y-6">
      <h3
        className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
      >
        Configurações do Sistema
      </h3>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div
          className={`rounded-lg p-6 shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <h4
            className={`mb-4 font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
          >
            Configurações Gerais
          </h4>
          <div className="space-y-4">
            <div>
              <label
                className={`mb-1 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Nome do Sistema
              </label>
              <input
                type="text"
                value={settings.general.siteName}
                onChange={(e) =>
                  handleSettingChange("general.siteName", e.target.value)
                }
                className={`w-full rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
              />
            </div>
            <div>
              <label
                className={`mb-1 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Máximo de Usuários
              </label>
              <input
                type="number"
                value={settings.general.maxUsers}
                onChange={(e) =>
                  handleSettingChange(
                    "general.maxUsers",
                    parseInt(e.target.value),
                  )
                }
                className={`w-full rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
              />
            </div>
            <label
              className={`flex items-center ${isDark ? "text-gray-300" : "text-gray-900"}`}
            >
              <input
                type="checkbox"
                checked={settings.general.maintenance}
                onChange={(e) =>
                  handleSettingChange("general.maintenance", e.target.checked)
                }
                className="mr-2"
              />
              Modo de Manutenção
            </label>
            <label
              className={`flex items-center ${isDark ? "text-gray-300" : "text-gray-900"}`}
            >
              <input
                type="checkbox"
                checked={settings.general.registrationEnabled}
                onChange={(e) =>
                  handleSettingChange(
                    "general.registrationEnabled",
                    e.target.checked,
                  )
                }
                className="mr-2"
              />
              Permitir Registro de Novos Usuários
            </label>
            <label
              className={`flex items-center ${isDark ? "text-gray-300" : "text-gray-900"}`}
            >
              <input
                type="checkbox"
                checked={settings.general.autoAssignment}
                onChange={(e) =>
                  handleSettingChange(
                    "general.autoAssignment",
                    e.target.checked,
                  )
                }
                className="mr-2"
              />
              Atribuição Automática de Trilhas
            </label>
          </div>
        </div>

        <div
          className={`rounded-lg p-6 shadow ${isDark ? "bg-gray-800" : "bg-white"}`}
        >
          <h4
            className={`mb-4 font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
          >
            Segurança
          </h4>
          <div className="space-y-4">
            <div>
              <label
                className={`mb-1 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Tamanho Mínimo da Senha
              </label>
              <input
                type="number"
                value={settings.security.passwordMinLength}
                onChange={(e) =>
                  handleSettingChange(
                    "security.passwordMinLength",
                    parseInt(e.target.value),
                  )
                }
                className={`w-full rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
              />
            </div>
            <div>
              <label
                className={`mb-1 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Timeout da Sessão (minutos)
              </label>
              <input
                type="number"
                value={settings.security.sessionTimeout}
                onChange={(e) =>
                  handleSettingChange(
                    "security.sessionTimeout",
                    parseInt(e.target.value),
                  )
                }
                className={`w-full rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
              />
            </div>
            <div>
              <label
                className={`mb-1 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Tentativas de Login
              </label>
              <input
                type="number"
                value={settings.security.loginAttempts}
                onChange={(e) =>
                  handleSettingChange(
                    "security.loginAttempts",
                    parseInt(e.target.value),
                  )
                }
                className={`w-full rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
              />
            </div>
            <div>
              <label
                className={`mb-1 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Retenção de Logs de Auditoria (dias)
              </label>
              <input
                type="number"
                value={settings.security.auditRetention}
                onChange={(e) =>
                  handleSettingChange(
                    "security.auditRetention",
                    parseInt(e.target.value),
                  )
                }
                className={`w-full rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
              />
            </div>
            <label
              className={`flex items-center ${isDark ? "text-gray-300" : "text-gray-900"}`}
            >
              <input
                type="checkbox"
                checked={settings.security.twoFactorAuth}
                onChange={(e) =>
                  handleSettingChange(
                    "security.twoFactorAuth",
                    e.target.checked,
                  )
                }
                className="mr-2"
              />
              Autenticação de Dois Fatores
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
          Salvar Configurações
        </button>
        <button className="rounded bg-gray-600 px-4 py-2 text-white hover:bg-gray-700">
          Restaurar Padrões
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-gray-100"}`}
    >
      {/* Top accent bar (site standard) */}
      <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-400" />

      {/* Header: refined visual only (no added actions) */}
      <header className={`${isDark ? "bg-gray-800" : "bg-white"}`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/admin")}
                aria-label="Voltar para admin"
                className={`inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm transition ${isDark ? "text-gray-400 hover:bg-gray-700 hover:text-gray-100" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>

              <div className="leading-tight">
                <h1
                  className={`text-2xl font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                >
                  Administração de Usuários
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className={`rounded-full p-2.5 shadow transition-all duration-200 hover:scale-105 hover:shadow-md ${isDark ? "bg-gray-800" : "bg-gray-200"}`}
                aria-label={isDark ? "Modo claro" : "Modo escuro"}
              >
                {isDark ? (
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: "#e5e7eb" }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: "#233E97" }}
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        <div
          className={`border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}
        />
      </header>

      {/* Navigation - extracted modern tabs component */}
      <AdminTabs activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Content */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {activeTab === "users" && renderUsersTab()}
        {activeTab === "permissions" && renderPermissionsTab()}
        {activeTab === "bulk" && renderBulkTab()}
        {activeTab === "assignments" && renderAssignmentsTab()}
        {activeTab === "exceptions" && renderExceptionsTab()}
        {activeTab === "audit" && renderAuditTab()}
      </main>

      {/* Modals */}
      {showAddModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div
            className={`w-full max-w-md rounded-lg p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <h3
              className={`mb-4 text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
            >
              Adicionar Novo Usuário
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Nome completo"
                className={`w-full rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" : "border-gray-300 bg-white text-gray-900"}`}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                type="email"
                placeholder="Email"
                className={`w-full rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" : "border-gray-300 bg-white text-gray-900"}`}
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
              <input
                type="password"
                placeholder="Senha (temporária)"
                className={`w-full rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" : "border-gray-300 bg-white text-gray-900"}`}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <select
                className={`w-full rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
              >
                <option value="Aprendiz">Aprendiz</option>
                <option value="Mentor">Mentor</option>
                <option value="Gestor">Gestor</option>
                <option value="Autor de conteúdo">Autor de Conteúdo</option>
                <option value="Administrador">Administrador</option>
              </select>
              <input
                type="text"
                placeholder="Departamento"
                className={`w-full rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" : "border-gray-300 bg-white text-gray-900"}`}
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
              />
              <input
                type="text"
                placeholder="Cargo"
                className={`w-full rounded-md border px-3 py-2 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" : "border-gray-300 bg-white text-gray-900"}`}
                value={newPosition}
                onChange={(e) => setNewPosition(e.target.value)}
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAddModal(false)}
                className={`rounded border px-4 py-2 ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-300 text-gray-600 hover:bg-gray-50"}`}
              >
                Cancelar
              </button>
              <button
                onClick={handleAddUser}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div
            className={`w-full max-w-lg rounded-lg p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <h3
              className={`mb-4 text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
            >
              Atribuir Trilhas
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Usuários selecionados: {selectedUsers.length}
                </label>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Selecione as trilhas:
                </label>
                <div className="max-h-60 overflow-y-auto rounded border border-gray-300 p-3">
                  {trails.map((trail) => (
                    <label key={trail.id} className="flex items-center py-2">
                      <input type="checkbox" className="mr-3" />
                      <span>{trail.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowAssignModal(false)}
                className="rounded border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                Atribuir
              </button>
            </div>
          </div>
        </div>
      )}

      {showExceptionModal && selectedUser && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">
              Gerenciar Exceções - {selectedUser.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tipo de Exceção
                </label>
                <select className="w-full rounded-md border border-gray-300 px-3 py-2">
                  <option value="">Selecione o tipo</option>
                  <option value="dispensa_trilha">Dispensa de Trilha</option>
                  <option value="dispensa_modulo">Dispensa de Módulo</option>
                  <option value="prazo_estendido">Prazo Estendido</option>
                  <option value="acesso_especial">Acesso Especial</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Motivo
                </label>
                <textarea
                  placeholder="Descreva o motivo da exceção..."
                  className="h-24 w-full rounded-md border border-gray-300 px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setShowExceptionModal(false)}
                className="rounded border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button className="rounded bg-orange-600 px-4 py-2 text-white hover:bg-orange-700">
                Conceder Exceção
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAndSettings;
