import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import ProfileMenu from "./ProfileMenu";
import NotificationPanel from "./NotificationPanel";

type RuleField = "trail_completion" | "final_score";
type RuleOperator = ">=" | "=" | "<=";
type RuleMetric = "percent" | "score";

interface Rule {
  id: string;
  field: RuleField;
  operator: RuleOperator;
  value: string;
  metric: RuleMetric;
}

interface Certificate {
  id: number;
  title: string;
  description: string;
  trailName: string;
  issueDate: string;
  status: "active" | "inactive" | "pending";
  recipient: string;
  criteriaRules: Rule[];
  validUntil?: string;
  signature?: string;
  responsibleName?: string;
}

export default function AdminCertificados() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const { isDark, toggleTheme } = useTheme();
  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
    opacity: 0,
  });

  type NavLink = {
    key: string;
    label: string;
    path: string;
    ariaLabel: string;
    match: (value: string) => boolean;
  };

  const navLinks: NavLink[] = useMemo(
    () => [
      {
        key: "home",
        label: "Página Inicial",
        path: "/admin",
        ariaLabel: "Ir para página inicial",
        match: (value: string) =>
          value.startsWith("/admin") &&
          !value.includes("certificados") &&
          !value.includes("register"),
      },
      {
        key: "trails",
        label: "Trilhas",
        path: "/trails",
        ariaLabel: "Ir para trilhas",
        match: (value: string) =>
          value.startsWith("/trails") || value.startsWith("/trail"),
      },
      {
        key: "users",
        label: "Usuários",
        path: "/admin/register",
        ariaLabel: "Gerenciar usuários",
        match: (value: string) => value.startsWith("/admin/register"),
      },
      {
        key: "reports",
        label: "Relatórios",
        path: "/admin/reports",
        ariaLabel: "Ver relatórios",
        match: (value: string) => value.startsWith("/admin/reports"),
      },
      {
        key: "certificados",
        label: "Certificados",
        path: "/admin/certificados",
        ariaLabel: "Gerenciar certificados",
        match: (value: string) => value.startsWith("/admin/certificados"),
      },
    ],
    [],
  );

  const buttonFocus = `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${isDark ? "focus-visible:ring-offset-gray-900" : "focus-visible:ring-offset-white"}`;

  useEffect(() => {
    const updateIndicator = () => {
      const activeLink = navLinks.find((link) => link.match(pathname));
      const container = navContainerRef.current;
      const buttonRef = activeLink ? navRefs.current[activeLink.key] : null;

      if (container && buttonRef) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = buttonRef.getBoundingClientRect();

        setIndicatorStyle({
          width: buttonRect.width,
          left: buttonRect.left - containerRect.left,
          opacity: 1,
        });
      } else {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [pathname, navLinks]);
  const [certificates, setCertificates] = useState<Certificate[]>([
    {
      id: 1,
      title: "Certificado de Conclusão - Onboarding",
      description: "Certificado de conclusão da trilha de onboarding",
      trailName: "Trilha de Onboarding FAURG",
      issueDate: "2025-01-15",
      status: "active",
      recipient: "João Silva",
      criteriaRules: [
        {
          id: "r-1",
          field: "trail_completion",
          operator: ">=",
          value: "100",
          metric: "percent",
        },
        {
          id: "r-2",
          field: "final_score",
          operator: ">=",
          value: "70",
          metric: "percent",
        },
      ],
      signature: "assinatura_exemplo.png",
      responsibleName: "Dr. Carlos Silva",
    },
    {
      id: 2,
      title: "Certificado Avançado - Gestão",
      description: "Certificado do curso avançado de gestão",
      trailName: "Gestão de Projetos",
      issueDate: "2025-02-20",
      status: "active",
      recipient: "Maria Santos",
      criteriaRules: [
        {
          id: "r-3",
          field: "trail_completion",
          operator: ">=",
          value: "100",
          metric: "percent",
        },
      ],
      validUntil: "2026-02-20",
      signature: "assinatura_exemplo2.png",
      responsibleName: "Profa. Ana Costa",
    },
  ]);

  const [editingCertificate, setEditingCertificate] =
    useState<Certificate | null>(null);
  const [originalEditingCertificate, setOriginalEditingCertificate] =
    useState<Certificate | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [ruleErrors, setRuleErrors] = useState<Record<string, string>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "todos" | "active" | "inactive" | "pending"
  >("todos");
  const [openStatusDropdown, setOpenStatusDropdown] = useState(false);
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
    id: number;
  } | null>(null);

  const handleEdit = (certificate: Certificate) => {
    setEditingCertificate({ ...certificate });
    setOriginalEditingCertificate({ ...certificate });
    setFormErrors({});
    setRuleErrors({});
    setShowEditModal(true);
  };

  const handleCreateNew = () => {
    const newCertificate: Certificate = {
      id: Math.max(...certificates.map((c) => c.id), 0) + 1,
      title: "",
      description: "",
      trailName: "",
      issueDate: new Date().toISOString().split("T")[0],
      status: "pending",
      recipient: "",
      criteriaRules: [],
      validUntil: "",
      signature: "",
      responsibleName: "",
    };
    setEditingCertificate(newCertificate);
    setOriginalEditingCertificate(newCertificate);
    setFormErrors({});
    setRuleErrors({});
    setShowEditModal(true);
  };

  const validateEditingCertificate = () => {
    if (!editingCertificate) return false;
    const errors: Record<string, string> = {};

    if (!editingCertificate.responsibleName?.trim())
      errors.responsibleName = "Nome do responsável é obrigatório.";
    if (!editingCertificate.signature?.trim())
      errors.signature = "Assinatura é obrigatória.";

    setFormErrors(errors);
    setRuleErrors({});
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!editingCertificate) return;
    const isValid = validateEditingCertificate();
    if (!isValid) return;
    setCertificates(
      certificates.map((cert) =>
        cert.id === editingCertificate.id ? editingCertificate : cert,
      ),
    );
    setShowEditModal(false);
    setEditingCertificate(null);
    setOriginalEditingCertificate(null);
    setFormErrors({});
    setRuleErrors({});
    showToast("Certificado atualizado com sucesso.", "success");
  };

  const handleDelete = (id: number) => {
    const cert = certificates.find((c) => c.id === id);
    if (
      confirm(
        `Tem certeza que deseja excluir "${cert?.title}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      setCertificates(certificates.filter((cert) => cert.id !== id));
      setOpenMenuId(null);
      showToast(`Certificado "${cert?.title}" excluído com sucesso`, "success");
    }
  };

  const handleStatusChange = (id: number, newStatus: Certificate["status"]) => {
    const cert = certificates.find((c) => c.id === id);
    setCertificates(
      certificates.map((cert) =>
        cert.id === id ? { ...cert, status: newStatus } : cert,
      ),
    );
    setOpenMenuId(null);
    const statusLabel =
      newStatus === "active"
        ? "Ativo"
        : newStatus === "inactive"
          ? "Inativo"
          : "Pendente";
    showToast(
      `Status de "${cert?.title}" alterado para ${statusLabel}`,
      "success",
    );
  };

  const showToast = (message: string, type: "success" | "error") => {
    const id = Date.now();
    setToast({ message, type, id });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // Filtrar certificados por busca e status em tempo real
  const filteredCertificates = certificates.filter((cert) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      cert.title.toLowerCase().includes(searchLower) ||
      cert.trailName.toLowerCase().includes(searchLower);

    const matchesStatus =
      statusFilter === "todos" || cert.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const hasEditingChanges = () => {
    if (!editingCertificate || !originalEditingCertificate) return false;
    const keys: Array<keyof Certificate> = [
      "title",
      "description",
      "trailName",
      "issueDate",
      "status",
      "recipient",
      "validUntil",
    ];
    const shallowDiff = keys.some(
      (key) =>
        (editingCertificate[key] || "") !==
        (originalEditingCertificate[key] || ""),
    );
    if (shallowDiff) return true;
    const currentRules = editingCertificate.criteriaRules || [];
    const originalRules = originalEditingCertificate.criteriaRules || [];
    if (currentRules.length !== originalRules.length) return true;
    return currentRules.some((rule, index) => {
      const originalRule = originalRules[index];
      return (
        rule.field !== originalRule.field ||
        rule.operator !== originalRule.operator ||
        rule.value !== originalRule.value ||
        rule.metric !== originalRule.metric
      );
    });
  };

  const editingHasChanges = hasEditingChanges();

  const handleCancelEdit = () => {
    const shouldCancel = editingHasChanges
      ? confirm("Descartar alterações não salvas deste certificado?")
      : true;
    if (!shouldCancel) return;
    setShowEditModal(false);
    setEditingCertificate(null);
    setOriginalEditingCertificate(null);
    setFormErrors({});
    setRuleErrors({});
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      {/* Navbar FAURG */}
      <header
        className="relative z-40 font-semibold shadow-md"
        style={{ backgroundColor: "#233E97", height: "64px" }}
      >
        <div className="w-full px-8">
          <div className="flex h-full items-end justify-between pb-2">
            {/* Logo FAURG removed per request */}
            <div className="ml-6 flex items-center" />

            {/* Menu de navegação centralizado com microinterações sutis */}
            <nav
              ref={navContainerRef}
              className="relative hidden flex-1 justify-center space-x-8 md:ml-6 md:flex"
            >
              {navLinks.map((link) => {
                const isActive = link.match(pathname);
                return (
                  <div key={link.key} className="relative">
                    <button
                      ref={(el) => (navRefs.current[link.key] = el)}
                      onClick={() => navigate(link.path)}
                      className={`flex min-w-[120px] cursor-pointer items-center justify-center rounded-md px-4 py-4 text-center text-sm font-semibold whitespace-nowrap transition-all duration-300 ease-out hover:scale-105 hover:brightness-125 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900 focus:outline-none md:text-base ${buttonFocus} ${isActive ? "opacity-100" : "opacity-85"}`}
                      style={{
                        color: isActive
                          ? "rgb(255, 255, 255)"
                          : "rgba(255, 255, 255, 0.84)",
                        backgroundColor: isActive
                          ? "rgba(255, 255, 255, 0.12)"
                          : "transparent",
                        transition:
                          "color 200ms ease, background-color 200ms ease, opacity 200ms ease",
                      }}
                      aria-label={link.ariaLabel}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {link.label}
                    </button>
                  </div>
                );
              })}

              <div
                className="pointer-events-none absolute h-1.5 rounded-full bg-white"
                style={{
                  bottom: -9,
                  left: 0,
                  width:
                    indicatorStyle.width > 0
                      ? `${indicatorStyle.width}px`
                      : "0px",
                  transform: `translateX(${indicatorStyle.left}px)`,
                  opacity: indicatorStyle.opacity,
                  boxShadow:
                    indicatorStyle.opacity > 0
                      ? "0 0 8px 1px rgba(255, 255, 255, 0.8)"
                      : "none",
                  transition:
                    "transform 280ms ease, width 220ms ease, opacity 180ms ease, box-shadow 180ms ease",
                  willChange: "transform, width",
                }}
              ></div>
            </nav>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                {/* Dark mode toggle */}
                <button
                  onClick={toggleTheme}
                  className={`rounded-full p-2.5 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl ${isDark ? "bg-gray-800" : "bg-white"} ${buttonFocus}`}
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

                <NotificationPanel />

                <ProfileMenu />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Header Administrativo Compacto */}
      <div
        className="relative w-full border-b shadow-sm"
        style={{ backgroundColor: "#233E97" }}
      >
        <div className="relative z-10 px-8 py-4">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">
                  Gestão de Certificados
                </h1>
                <p className="mt-1 text-sm text-white/75">
                  Edite e gerencie certificados de conclusão
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main
        className={`min-h-[calc(100vh-200px)] transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
      >
        <div className="mx-auto max-w-7xl px-4 py-12">
          {/* Seção de Cabeçalho com Ações */}
          <div className="mb-8 flex flex-col items-start gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex-1">
              <h2
                className={`text-2xl font-bold tracking-tight ${isDark ? "text-gray-100" : "text-gray-900"}`}
              >
                Certificados Cadastrados
              </h2>
              <p
                className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Gerencie e personalize certificados de conclusão de trilhas
              </p>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 rounded-lg px-5 py-2.5 font-semibold whitespace-nowrap text-white shadow-md transition-all duration-200 hover:scale-[1.02] hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              style={{ backgroundColor: "#233E97" }}
              aria-label="Criar novo certificado"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="hidden sm:inline">Novo Certificado</span>
              <span className="sm:hidden">Novo</span>
            </button>
          </div>

          {/* Campo de Busca */}
          <div className="mb-8">
            <div className="relative max-w-md flex-1">
              <input
                type="text"
                placeholder="Buscar por nome ou trilha..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full rounded-lg border py-2.5 pr-4 pl-10 text-sm placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-700"}`}
                aria-label="Buscar certificados"
              />
              <svg
                className="absolute top-3 left-3 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className={`absolute top-2.5 right-3 rounded-full p-0.5 transition-colors ${isDark ? "text-gray-400 hover:bg-gray-600 hover:text-gray-300" : "text-gray-400 hover:bg-gray-200 hover:text-gray-600"}`}
                  aria-label="Limpar busca"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              )}
            </div>
            <p
              className={`mt-2 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {filteredCertificates.length} certificado
              {filteredCertificates.length !== 1 ? "s" : ""} encontrado
              {filteredCertificates.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Filtro de Status - Dropdown */}
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative">
              <button
                onClick={() => setOpenStatusDropdown(!openStatusDropdown)}
                className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${
                  isDark
                    ? "border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600"
                    : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                }`}
                aria-label="Filtrar por status"
                aria-expanded={openStatusDropdown}
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                  />
                </svg>
                <span>
                  {statusFilter === "todos"
                    ? "Todos os Status"
                    : statusFilter === "active"
                      ? "Ativo"
                      : statusFilter === "inactive"
                        ? "Inativo"
                        : "Pendente"}
                </span>
                <svg
                  className={`h-4 w-4 transition-transform ${openStatusDropdown ? "rotate-180" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {openStatusDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setOpenStatusDropdown(false)}
                  />
                  <div
                    className={`absolute top-12 left-0 z-40 min-w-max overflow-hidden rounded-lg border shadow-lg ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
                  >
                    {[
                      { value: "todos", label: "Todos os Status", icon: "∞" },
                      { value: "active", label: "Ativo", icon: "✓" },
                      { value: "inactive", label: "Inativo", icon: "–" },
                      { value: "pending", label: "Pendente", icon: "○" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setStatusFilter(
                            option.value as
                              | "todos"
                              | "active"
                              | "inactive"
                              | "pending",
                          );
                          setOpenStatusDropdown(false);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors ${
                          statusFilter === option.value
                            ? isDark
                              ? "bg-blue-900/30 text-blue-300"
                              : "bg-blue-50 text-blue-900"
                            : isDark
                              ? "text-gray-300 hover:bg-gray-700/50"
                              : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                            option.value === "active"
                              ? isDark
                                ? "bg-green-900/30 text-green-300"
                                : "bg-green-100 text-green-700"
                              : option.value === "inactive"
                                ? isDark
                                  ? "bg-gray-700 text-gray-400"
                                  : "bg-gray-100 text-gray-600"
                                : option.value === "pending"
                                  ? isDark
                                    ? "bg-amber-900/30 text-amber-300"
                                    : "bg-amber-100 text-amber-700"
                                  : isDark
                                    ? "bg-blue-900/30 text-blue-300"
                                    : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {option.icon}
                        </span>
                        {option.label}
                        {statusFilter === option.value && (
                          <svg
                            className="ml-auto h-5 w-5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Indicador de Filtros Ativos */}
            {(searchTerm || statusFilter !== "todos") && (
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium tracking-wider uppercase ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  Filtros ativos
                </span>
                <button
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("todos");
                  }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${isDark ? "bg-gray-700 text-gray-300 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                >
                  Limpar filtros
                </button>
              </div>
            )}
          </div>

          {/* Lista de Certificados */}
          <div className="space-y-5">
            {filteredCertificates.map((certificate) => {
              const isEditingActive =
                showEditModal && editingCertificate?.id === certificate.id;
              const isOtherEditing =
                showEditModal && editingCertificate?.id !== certificate.id;
              const changesPending = editingHasChanges;
              const buttonDisabled =
                (isEditingActive && !changesPending) || isOtherEditing;

              return (
                <div
                  key={certificate.id}
                  className={`rounded-xl border p-6 shadow-sm transition-all hover:shadow-md ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"}`}
                >
                  {/* Bloco 1: Título e Status */}
                  <div className="mb-5 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
                    <h3
                      className={`text-lg leading-tight font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                    >
                      {certificate.title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                          certificate.status === "active"
                            ? isDark
                              ? "bg-green-900/30 text-green-300"
                              : "bg-green-50 text-green-700"
                            : certificate.status === "inactive"
                              ? isDark
                                ? "bg-gray-700 text-gray-300"
                                : "bg-gray-100 text-gray-700"
                              : isDark
                                ? "bg-amber-900/30 text-amber-300"
                                : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            certificate.status === "active"
                              ? "bg-green-500"
                              : certificate.status === "inactive"
                                ? "bg-gray-400"
                                : "bg-amber-500"
                          }`}
                          aria-hidden="true"
                        ></span>
                        {certificate.status === "active"
                          ? "Ativo"
                          : certificate.status === "inactive"
                            ? "Inativo"
                            : "Pendente"}
                      </span>
                    </div>
                  </div>

                  {/* Bloco 2: Descrição */}
                  <p
                    className={`mb-5 border-b pb-5 text-sm ${isDark ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-600"}`}
                  >
                    {certificate.description}
                  </p>

                  {/* Bloco 3: Informações Secundárias */}
                  <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <span
                        className={`text-xs font-medium tracking-wider uppercase ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        Trilha
                      </span>
                      <p
                        className={`mt-1 text-sm ${isDark ? "text-gray-300" : "text-gray-900"}`}
                      >
                        {certificate.trailName}
                      </p>
                    </div>
                    {certificate.validUntil && (
                      <div>
                        <span
                          className={`text-xs font-medium tracking-wider uppercase ${isDark ? "text-gray-500" : "text-gray-500"}`}
                        >
                          Válido até
                        </span>
                        <p
                          className={`mt-1 text-sm ${isDark ? "text-gray-300" : "text-gray-900"}`}
                        >
                          {new Date(certificate.validUntil).toLocaleDateString(
                            "pt-BR",
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Bloco 4: Critérios de Emissão */}
                  <div className="mb-6 border-b pb-6">
                    <span
                      className={`text-xs font-medium tracking-wider uppercase ${isDark ? "text-gray-500" : "text-gray-500"}`}
                    >
                      Critérios de Emissão
                    </span>
                    <div className="mt-3 space-y-2">
                      {certificate.criteriaRules &&
                      certificate.criteriaRules.length > 0 ? (
                        certificate.criteriaRules.map((rule) => (
                          <div
                            key={rule.id}
                            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm ${isDark ? "bg-gray-700 text-gray-200" : "bg-gray-100 text-gray-800"}`}
                          >
                            <span
                              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${isDark ? "bg-blue-900/40 text-blue-100" : "bg-blue-100 text-blue-700"}`}
                            >
                              {rule.field === "trail_completion"
                                ? "Conclusão da Trilha"
                                : "Nota Final"}
                            </span>
                            <span className="text-xs font-semibold">
                              {rule.operator}
                            </span>
                            <span className="font-medium">
                              {rule.value}
                              {rule.metric === "percent" ? "%" : ""}
                            </span>
                            <span
                              className={`text-[11px] tracking-wide uppercase ${isDark ? "text-gray-300" : "text-gray-500"}`}
                            >
                              {rule.metric === "percent"
                                ? "Percentual"
                                : "Pontuação"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p
                          className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
                        >
                          Nenhuma regra definida.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bloco 5: Ações */}
                  <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() =>
                          isEditingActive
                            ? handleSave()
                            : handleEdit(certificate)
                        }
                        disabled={buttonDisabled}
                        className={`group relative flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white shadow-md transition-all focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                          buttonDisabled
                            ? "cursor-not-allowed opacity-60"
                            : "hover:-translate-y-[1px] hover:shadow-xl"
                        } ${
                          isDark
                            ? "focus:ring-blue-300 focus:ring-offset-gray-900"
                            : "focus:ring-blue-300 focus:ring-offset-white"
                        } bg-[#233E97]`}
                        aria-label={`Editar certificado ${certificate.title}`}
                        aria-disabled={buttonDisabled}
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        {isEditingActive ? "Salvar alterações" : "Editar"}
                      </button>
                      <div
                        className={`flex items-center gap-2 text-[11px] ${isDark ? "text-gray-400" : "text-gray-500"}`}
                      >
                        <span
                          className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold ${
                            isDark
                              ? "border-amber-500/50 text-amber-200"
                              : "border-amber-300 text-amber-700"
                          }`}
                        >
                          i
                        </span>
                        <span>
                          Edite título, critérios, datas e status conforme
                          políticas ativas.
                        </span>
                      </div>
                    </div>

                    {/* Menu de ações secundárias */}
                    <div className="relative">
                      <button
                        onClick={() =>
                          setOpenMenuId(
                            openMenuId === certificate.id
                              ? null
                              : certificate.id,
                          )
                        }
                        className={`rounded-lg border px-3 py-2 text-sm font-medium transition-all hover:shadow-md ${isDark ? "border-gray-600 bg-gray-700 text-gray-100 hover:bg-gray-600" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                        aria-label="Mais ações"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                        </svg>
                      </button>

                      {/* Dropdown */}
                      {openMenuId === certificate.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setOpenMenuId(null)}
                          />
                          <div
                            className={`absolute top-12 right-0 z-40 w-56 overflow-hidden rounded-lg shadow-lg ${isDark ? "border border-gray-700 bg-gray-800" : "border border-gray-200 bg-white"}`}
                          >
                            {/* Opção: Status */}
                            <div
                              className={`border-b px-4 py-3 ${isDark ? "border-gray-700" : "border-gray-100"}`}
                            >
                              <label
                                className={`block text-xs font-medium tracking-wider uppercase ${isDark ? "text-gray-400" : "text-gray-500"}`}
                              >
                                Status
                              </label>
                              <select
                                value={certificate.status}
                                onChange={(e) => {
                                  handleStatusChange(
                                    certificate.id,
                                    e.target.value as Certificate["status"],
                                  );
                                  setOpenMenuId(null);
                                }}
                                className={`mt-2 w-full rounded border px-2 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                              >
                                <option value="active">Ativo</option>
                                <option value="inactive">Inativo</option>
                                <option value="pending">Pendente</option>
                              </select>
                            </div>

                            {/* Opção: Excluir */}
                            <button
                              onClick={() => {
                                setOpenMenuId(null);
                                handleDelete(certificate.id);
                              }}
                              className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${isDark ? "text-red-300 hover:bg-gray-700/70" : "text-red-600 hover:bg-red-50"}`}
                              aria-label={`Excluir certificado ${certificate.title}`}
                            >
                              <div className="flex items-center gap-2">
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  aria-hidden="true"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Excluir certificado
                              </div>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Toast de Feedback */}
      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 flex items-center gap-3 rounded-lg px-5 py-3 shadow-lg transition-all ${
            toast.type === "success"
              ? isDark
                ? "border border-green-800/50 bg-green-900/30 text-green-300"
                : "border border-green-200 bg-green-50 text-green-900"
              : isDark
                ? "border border-red-800/50 bg-red-900/30 text-red-300"
                : "border border-red-200 bg-red-50 text-red-900"
          }`}
        >
          <svg
            className="h-5 w-5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            {toast.type === "success" ? (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            ) : (
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            )}
          </svg>
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      )}

      {/* Modal de Edição */}
      {showEditModal && editingCertificate && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]">
          <div
            className="absolute inset-0"
            onClick={handleCancelEdit}
            aria-hidden="true"
          />
          <div
            className={`relative z-10 flex h-full w-full max-w-4xl flex-col shadow-2xl transition-transform sm:w-[90vw] lg:w-[45vw] ${
              isDark
                ? "border-l border-gray-700 bg-gray-800 ring-2 ring-amber-400/30"
                : "border-l border-gray-200 bg-white ring-2 ring-amber-500/20"
            }`}
            style={{ minWidth: "320px" }}
          >
            {/* Header fixo */}
            <div
              className={`sticky top-0 z-20 flex items-center justify-between border-b px-6 py-4 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-full shadow-sm ${
                    isDark
                      ? "bg-amber-500/15 text-amber-100"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15.232 5.232l3.536 3.536m-2.036-4.036a2.5 2.5 0 113.536 3.536L7.5 21H3v-4.5L16.732 4.732z"
                    />
                  </svg>
                </span>
                <div>
                  <h2
                    className={`text-lg font-bold ${isDark ? "text-gray-50" : "text-gray-900"}`}
                  >
                    Editar Certificado
                  </h2>
                  <p
                    className={`text-xs ${isDark ? "text-amber-100/80" : "text-amber-800/80"}`}
                  >
                    Modo edição ativo — alterações refletem conforme políticas.
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancelEdit}
                className={`rounded-full p-2 transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                  isDark
                    ? "text-gray-200 hover:bg-gray-700 focus:ring-amber-300 focus:ring-offset-gray-800"
                    : "text-gray-700 hover:bg-gray-100 focus:ring-amber-400 focus:ring-offset-white"
                }`}
                aria-label="Fechar painel de edição"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Conteúdo: Novidades sendo implementadas */}
            <div className="flex-1 flex flex-col items-center justify-center overflow-y-auto px-6 py-12">
              <div className="max-w-xs text-center space-y-4">
                {/* Ícone animado */}
                <div className="flex justify-center">
                  <div
                    className={`flex h-20 w-20 items-center justify-center rounded-full animate-pulse ${
                      isDark
                        ? "bg-blue-900/30 text-blue-300"
                        : "bg-blue-50 text-blue-600"
                    }`}
                  >
                    <svg
                      className="h-10 w-10"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </div>
                </div>

                {/* Texto */}
                <div>
                  <h3
                    className={`text-lg font-bold ${
                      isDark ? "text-gray-100" : "text-gray-900"
                    }`}
                  >
                    Novidades Sendo Implementadas
                  </h3>
                  <p
                    className={`mt-2 text-sm leading-relaxed ${
                      isDark ? "text-gray-400" : "text-gray-600"
                    }`}
                  >
                    Estamos trabalhando em melhorias para a edição de certificados. Novos recursos em breve!
                  </p>
                </div>

                {/* Badge de status */}
                <div className="pt-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium ${
                      isDark
                        ? "bg-yellow-900/30 text-yellow-300"
                        : "bg-yellow-50 text-yellow-700"
                    }`}
                  >
                    <span
                      className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"
                      aria-hidden="true"
                    ></span>
                    Em desenvolvimento
                  </span>
                </div>
              </div>
            </div>
            {/* Seção comentada para reutilização futura */}

            {/* Rodapé fixo */}
            <div
              className={`sticky bottom-0 z-20 flex flex-col gap-3 border-t px-6 py-4 sm:flex-row sm:justify-end sm:gap-4 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"}`}
            >
              <button
                onClick={handleCancelEdit}
                className={`inline-flex items-center justify-center gap-2 rounded-lg border-2 px-6 py-3 text-sm font-semibold transition-all focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                  isDark
                    ? "border-red-500/60 text-red-200 hover:border-red-400 hover:bg-red-500/10 focus:ring-red-300 focus:ring-offset-gray-800"
                    : "border-red-400 text-red-700 hover:border-red-500 hover:bg-red-50 focus:ring-red-300 focus:ring-offset-white"
                }`}
                aria-label="Cancelar edição"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Cancelar edição
              </button>
              <button
                onClick={handleSave}
                disabled={!editingHasChanges}
                className={`rounded-lg px-6 py-3 font-medium text-white shadow-md transition-all focus:ring-2 focus:ring-blue-300 focus:ring-offset-2 focus:outline-none ${
                  editingHasChanges
                    ? "bg-blue-600 hover:bg-blue-700 hover:shadow-lg"
                    : "cursor-not-allowed bg-blue-400/70 opacity-70"
                } ${isDark ? "focus:ring-offset-gray-800" : "focus:ring-offset-white"}`}
                aria-disabled={!editingHasChanges}
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
