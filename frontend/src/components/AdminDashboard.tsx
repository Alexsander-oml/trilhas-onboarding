import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTrails } from "../hooks/useTrails";
import { authService } from "../services/authService";
import type { User } from "../types/api";
import ProfileMenu from "./ProfileMenu";
import NotificationPanel from "./NotificationPanel";
import FAURGLogo from "../assets/FAURG-logo-horizontal-reduzida.png";
import { useTheme } from "../contexts/ThemeContext";

// Função para retornar a imagem apropriada para cada trilha
const getTrailImage = (trailName: string): string => {
  const name = trailName.toLowerCase();

  if (name.includes("compliance") || name.includes("ética")) {
    return "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=400&h=200&fit=crop&auto=format";
  } else if (name.includes("liderança") || name.includes("desenvolvimento")) {
    return "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=200&fit=crop&auto=format";
  } else if (name.includes("onboarding") || name.includes("integração")) {
    return "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&h=200&fit=crop&auto=format";
  } else if (name.includes("segurança") || name.includes("informação")) {
    return "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=400&h=200&fit=crop&auto=format";
  } else if (name.includes("vendas") || name.includes("comercial")) {
    return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop&auto=format";
  } else if (name.includes("tecnologia") || name.includes("ti")) {
    return "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop&auto=format";
  } else if (name.includes("marketing") || name.includes("comunicação")) {
    return "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=400&h=200&fit=crop&auto=format";
  } else {
    // Imagem padrão para trilhas genéricas
    return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop&auto=format";
  }
};

// Função para destacar termo pesquisado no título
const highlightSearchTerm = (text: string, searchTerm: string) => {
  if (!searchTerm.trim()) return text;

  const regex = new RegExp(`(${searchTerm})`, "gi");
  const parts = text.split(regex);

  return parts.map((part, index) => {
    if (part.toLowerCase() === searchTerm.toLowerCase()) {
      return (
        <span
          key={index}
          className="font-semibold underline decoration-1 underline-offset-2"
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { trails, deleteTrail, fetchTrails, isLoading } = useTrails();
  const { isDark, toggleTheme } = useTheme();
  const location = useLocation();
  const { pathname } = location;
  const [currentUser, setCurrentUser] = useState<
    (Partial<User> & { role?: string }) | null
  >(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos os status");
  const [departmentFilter, setDepartmentFilter] = useState(
    "Todos os departamentos",
  );
  const [sortBy, setSortBy] = useState("Ordenar por nome");
  const [visualizacao, setVisualizacao] = useState("Cartões");
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [selectedTrails, setSelectedTrails] = useState<Set<number>>(new Set());

  // Buscar trilhas ao montar componente
  useEffect(() => {
    fetchTrails();
  }, [fetchTrails]);

  useEffect(() => {
    try {
      const u = authService.getStoredUser();
      if (u) setCurrentUser(u);
    } catch {
      // ignore
    }
  }, []);

  // Debounce search term for real-time search with 300ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Role helpers based on permission matrix
  const role =
    (currentUser as unknown as { role?: string } | null)?.role || null;
  const canCreateTrail =
    !!role && ["Autor de Conteúdo", "Gestor", "Administrador"].includes(role);
  const canManageUsers = !!role && ["Gestor", "Administrador"].includes(role);
  const canViewReports = !!role && ["Gestor", "Administrador"].includes(role);
  const canAccessSettings =
    !!role && ["Administrador", "Gestor"].includes(role);

  const normalizeStatus = (status?: string) => {
    if (!status) return "";
    if (status.toLowerCase() === "ativo") return "Publicada";
    return status;
  };

  const getModuleCount = (trail: any): number => {
    if (typeof trail?.modulesCount === "number") return trail.modulesCount;
    if (typeof trail?.total_modulos === "number") return trail.total_modulos;
    if (Array.isArray(trail?.modules)) return trail.modules.length;
    return 0;
  };

  type NavLink = {
    key: string;
    label: string;
    path: string;
    ariaLabel: string;
    visible: boolean;
    match: (value: string) => boolean;
  };

  const navLinks: NavLink[] = useMemo(() => {
    const homePath = role === "Aprendiz" ? "/painel-aprendiz" : "/admin";

    return [
      {
        key: "home",
        label: "Página Inicial",
        path: homePath,
        ariaLabel: "Ir para página inicial",
        visible: true,
        match: (value: string) =>
          value === "/admin" || value === "/painel-aprendiz",
      },
      {
        key: "trails",
        label: "Trilhas",
        path: "/trails",
        ariaLabel: "Ir para trilhas",
        visible: true,
        match: (value: string) =>
          value.startsWith("/trails") || value.startsWith("/trail"),
      },
      {
        key: "users",
        label: "Usuários",
        path: "/admin/register",
        ariaLabel: "Gerenciar usuários",
        visible: canManageUsers,
        match: (value: string) => value.startsWith("/admin/register"),
      },
      {
        key: "reports",
        label: "Relatórios",
        path: "/admin/reports",
        ariaLabel: "Ver relatórios",
        visible: canViewReports,
        match: (value: string) => value.startsWith("/admin/reports"),
      },
      {
        key: "certificados",
        label: "Certificados",
        path: "/admin/certificados",
        ariaLabel: "Gerenciar certificados",
        visible: canAccessSettings,
        match: (value: string) => value.startsWith("/admin/certificados"),
      },
    ];
  }, [role, canManageUsers, canViewReports, canAccessSettings]);

  const buttonFocus = `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${isDark ? "focus-visible:ring-offset-gray-900" : "focus-visible:ring-offset-white"}`;

  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
    opacity: 0,
  });

  useEffect(() => {
    const updateIndicator = () => {
      const activeLink = navLinks.find(
        (link) => link.visible && link.match(pathname),
      );
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

  const handleDeleteTrail = (id: number, name: string) => {
    if (
      confirm(
        `Tem certeza que deseja excluir a trilha "${name}"? Esta ação não pode ser desfeita.`,
      )
    ) {
      deleteTrail(id);
    }
  };

  const handleDeleteMultipleTrails = async () => {
    if (selectedTrails.size === 0) return;

    const trailNames = Array.from(selectedTrails)
      .map((id) => trails.find((t) => t.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    if (
      confirm(
        `Tem certeza que deseja excluir ${selectedTrails.size} trilha${selectedTrails.size > 1 ? "s" : ""}?\n\n${trailNames}\n\nEsta ação não pode ser desfeita.`,
      )
    ) {
      const deletePromises = Array.from(selectedTrails).map((id) =>
        deleteTrail(id),
      );
      await Promise.all(deletePromises);
      setSelectedTrails(new Set());
    }
  };

  const toggleTrailSelection = (id: number) => {
    setSelectedTrails((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedTrails.size === filteredTrails.length) {
      setSelectedTrails(new Set());
    } else {
      setSelectedTrails(new Set(filteredTrails.map((t: any) => t.id)));
    }
  };

  /**
   * CÁLCULO DE ESTATÍSTICAS DINÂMICAS
   *
   * Esta função substitui os valores hardcoded por cálculos baseados nos dados reais.
   * As estatísticas são recalculadas automaticamente quando trilhas são modificadas.
   *
   * MÉTRICAS CALCULADAS:
   * - Usuários Ativos: Soma de inscrições em trilhas ativas
   * - Trilhas Publicadas: Trilhas com status 'Ativo' ou 'Pausado' (exclui rascunhos)
   * - Total de Matrículas: Soma de todas as inscrições (incluindo trilhas inativas)
   * - Taxa de Conclusão: Média ponderada pelas inscrições de cada trilha
   *
   * FUTURO (com backend):
   * - Estes cálculos serão feitos no servidor
   * - Dados virão de endpoints específicos (/api/admin/stats/)
   * - Cache automático com React Query
   * - Atualizações em tempo real
   */
  const calculateStatistics = () => {
    // Filtrar apenas trilhas ativas para usuários ativos
    const activeTrails = trails.filter((trail) => trail.status === "Ativo");

    // USUÁRIOS ATIVOS: Soma das inscrições de trilhas ativas apenas
    // Lógica: usuário é "ativo" se tem trilha ativa em andamento
    const totalActiveUsers = activeTrails.reduce((total, trail) => {
      const inscricoes =
        parseInt((trail.inscricoes || "").replace(/\D/g, "")) || 0;
      return total + inscricoes;
    }, 0);

    // TRILHAS PUBLICADAS: Excluir apenas rascunhos
    // Lógica: trilha é "publicada" se está ativa ou pausada (não em rascunho)
    const publishedTrails = trails.filter(
      (trail) => trail.status !== "Rascunho",
    ).length;

    // TOTAL DE MATRÍCULAS: Somar TODAS as inscrições (incluindo trilhas pausadas)
    // Lógica: matrícula vale mesmo que trilha esteja inativa
    const totalEnrollments = trails.reduce((total, trail) => {
      const inscricoes =
        parseInt((trail.inscricoes || "").replace(/\D/g, "")) || 0;
      return total + inscricoes;
    }, 0);

    // TAXA DE CONCLUSÃO MÉDIA PONDERADA
    // Lógica: trilhas com mais inscritos têm mais peso no cálculo da média
    const weightedCompletionRate = trails.reduce((totalWeighted, trail) => {
      const inscricoes =
        parseInt((trail.inscricoes || "").replace(/\D/g, "")) || 0;
      const taxa = trail.taxaConclusao || 0;
      return totalWeighted + taxa * inscricoes; // Peso = número de inscritos
    }, 0);

    // Calcular média ponderada (evitar divisão por zero)
    const averageCompletionRate =
      totalEnrollments > 0
        ? Math.round(weightedCompletionRate / totalEnrollments)
        : 0;

    return {
      activeUsers: totalActiveUsers,
      publishedTrails,
      totalEnrollments,
      completionRate: averageCompletionRate,
    };
  };

  const stats = calculateStatistics();

  // Filter and sort trails
  const parseTime = (v?: string | number | Date) =>
    v ? new Date(v).getTime() : 0;

  type TrailWithDepartment = (typeof trails)[number] & { department?: string };

  // Departamentos únicos para o filtro
  const departmentOptions = Array.from(
    new Set(
      (trails as TrailWithDepartment[])
        .map((trail) => trail.department?.trim())
        .filter((dept): dept is string => !!dept && dept.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const filteredTrails = trails
    .filter((trail) => {
      const nameStr = (trail.name || "").toLowerCase();
      const tagsArr = Array.isArray(trail.tags) ? trail.tags : [];
      const matchesSearch =
        nameStr.includes(debouncedSearchTerm.toLowerCase()) ||
        tagsArr.some((tag) => {
          const label =
            typeof tag === "string"
              ? tag
              : tag?.name || tag?.nome || tag?.label || tag?.title || "";
          return label
            .toLowerCase()
            .includes(debouncedSearchTerm.toLowerCase());
        });

      const matchesStatus =
        statusFilter === "Todos os status" ||
        (statusFilter === "Publicada"
          ? ["Ativo", "Publicada"].includes(trail.status || "")
          : trail.status === statusFilter);

      const matchesDepartment =
        departmentFilter === "Todos os departamentos" ||
        ((trail as TrailWithDepartment).department || "").toLowerCase() ===
          departmentFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesDepartment;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "Ordenar por data":
          return parseTime(b.createdAt) - parseTime(a.createdAt);
        case "Ordenar por status":
          return (a.status ?? "").localeCompare(b.status ?? "");
        case "Ordenar por nome":
        default:
          return (a.name || "").localeCompare(b.name || "");
      }
    });

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
            <div className="ml-6 flex items-center" />

            {/* Menu de navegação centralizado com microinterações sutis */}
            <nav
              ref={navContainerRef}
              className="relative hidden flex-1 justify-center space-x-8 md:ml-6 md:flex"
            >
              {navLinks
                .filter((link) => link.visible)
                .map((link) => {
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
                className="pointer-events-none absolute h-1.5 rounded-full bg-white transition-all duration-300 ease-out"
                style={{
                  bottom: "-9px",
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

            {/* Ícones do usuário à direita */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                {/* Dark mode toggle */}
                <button
                  onClick={toggleTheme}
                  className={`rounded-full p-2.5 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl ${isDark ? "bg-gray-800" : "bg-white"} ${buttonFocus}`}
                  aria-label={
                    isDark ? "Ativar modo claro" : "Ativar modo escuro"
                  }
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

      {/* Header Visual - Semicírculo branco com logo FAURG */}
      <div
        className="relative w-full overflow-hidden shadow-md"
        style={{
          backgroundColor: "#233E97",
          height: "clamp(200px, 30vh, 350px)",
        }}
      >
        {/* Semicírculo branco à esquerda */}
        <div
          className="absolute top-0 left-0 flex h-full items-center rounded-r-full bg-white"
          style={{
            width: "clamp(40%, 35vw, 30%)",
            boxShadow:
              "8px 12px 25px 0px rgba(0,0,0,0.15), inset 0px 4px 25px 0px rgba(0,0,0,0.15)",
            justifyContent: "flex-start",
            paddingLeft: "clamp(12px, 3vw, 24px)",
          }}
        >
          <img
            src={FAURGLogo}
            alt="FAURG Logo"
            className="object-contain"
            style={{ height: "70%", maxWidth: "70%" }}
          />
        </div>

        {/* Texto EDUCAÇÃO CONTINUADA à direita */}
        <div
          className="absolute top-0 right-0 flex h-full items-center justify-end pr-12"
          style={{ width: "60%" }}
        >
          <div className="text-right">
            <h1 className="text-3xl leading-tight font-bold text-white md:text-4xl lg:text-5xl">
              EDUCAÇÃO
              <br />
              CONTINUADA
            </h1>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
        {/* Cards de Estatísticas */}
        <div className="mb-6 grid grid-cols-2 gap-3 lg:mb-8 lg:grid-cols-4 lg:gap-6">
          <div
            className={`rounded-lg border p-3 text-center shadow-sm lg:rounded-xl lg:p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"}`}
          >
            <div
              className={`mb-1 text-xl font-bold lg:mb-2 lg:text-3xl ${isDark ? "text-blue-400" : "text-blue-900"}`}
            >
              {stats.activeUsers}
            </div>
            <div
              className={`text-xs font-medium lg:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Usuários ativos
            </div>
          </div>
          <div
            className={`rounded-lg border p-3 text-center shadow-sm lg:rounded-xl lg:p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"}`}
          >
            <div
              className={`mb-1 text-xl font-bold lg:mb-2 lg:text-3xl ${isDark ? "text-blue-400" : "text-blue-600"}`}
            >
              {stats.publishedTrails}
            </div>
            <div
              className={`text-xs font-medium lg:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Trilhas publicadas
            </div>
          </div>
          <div
            className={`rounded-lg border p-3 text-center shadow-sm lg:rounded-xl lg:p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"}`}
          >
            <div
              className={`mb-1 text-xl font-bold lg:mb-2 lg:text-3xl ${isDark ? "text-blue-400" : "text-blue-900"}`}
            >
              {stats.totalEnrollments}
            </div>
            <div
              className={`text-xs font-medium lg:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Matrículas
            </div>
          </div>
          <div
            className={`rounded-lg border p-3 text-center shadow-sm lg:rounded-xl lg:p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"}`}
          >
            <div
              className={`mb-1 text-xl font-bold lg:mb-2 lg:text-3xl ${isDark ? "text-blue-400" : "text-blue-900"}`}
            >
              {stats.completionRate}%
            </div>
            <div
              className={`text-xs font-medium lg:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Taxa conclusão
            </div>
          </div>
        </div>

        {/* Botões Principais */}
        <div className="mb-6 flex flex-wrap items-center gap-4 lg:mb-8">
          {canCreateTrail && (
            <button
              onClick={() => navigate("/create-trail")}
              className="inline-flex items-center gap-2 rounded-lg px-6 py-3 font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
              style={{ backgroundColor: "#233E97" }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor = "#1e3a8a")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor = "#233E97")
              }
              aria-label="Criar nova trilha de aprendizado"
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
              Nova Trilha
            </button>
          )}
          <button
            onClick={() => navigate("/trails")}
            className={`inline-flex items-center gap-2 rounded-lg border px-6 py-3 font-medium shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
            aria-label="Ver catálogo de trilhas"
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Ver Catálogo
          </button>
          {selectedTrails.size > 0 && (
            <button
              onClick={handleDeleteMultipleTrails}
              className="inline-flex items-center gap-2 rounded-lg border border-red-600 bg-red-600 px-6 py-3 font-medium text-white shadow-sm transition-all duration-200 hover:bg-red-700 hover:shadow-md focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:outline-none"
              aria-label={`Excluir ${selectedTrails.size} trilha${selectedTrails.size > 1 ? "s" : ""} selecionada${selectedTrails.size > 1 ? "s" : ""}`}
            >
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              Excluir {selectedTrails.size} Selecionada
              {selectedTrails.size > 1 ? "s" : ""}
            </button>
          )}
        </div>

        {/* Seção de Filtros e Tabela */}
        <div
          className={`rounded-xl border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"}`}
        >
          {/* Filtros e Busca */}
          <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
            <div className="flex flex-1 flex-col items-stretch space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3">
              <div className="relative flex-1 sm:max-w-xs lg:max-w-sm">
                <input
                  type="text"
                  placeholder="Buscar por título ou tag..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full rounded-md border py-2 ${searchTerm ? "pr-9" : "pr-3"} pl-9 text-sm placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-700"}`}
                  aria-label="Buscar trilhas por título ou tags"
                />
                <svg
                  className="absolute top-2.5 left-2.5 h-4 w-4 text-gray-400"
                  aria-hidden="true"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
                    className={`absolute top-2 right-2 rounded-full p-0.5 transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:outline-none ${isDark ? "text-gray-400 hover:bg-gray-600 hover:text-gray-300" : "text-gray-400 hover:bg-gray-200 hover:text-gray-600"}`}
                    aria-label="Limpar busca"
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
                  </button>
                )}
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`rounded-md border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-700"}`}
                >
                  <option>Todos os status</option>
                  <option>Publicada</option>
                  <option>Rascunho</option>
                  <option>Inativo</option>
                </select>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className={`rounded-md border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-700"}`}
                  aria-label="Filtrar por departamento"
                >
                  <option value="">Todos os departamentos</option>
                  {departmentOptions.map((dept) => (
                    <option key={dept}>{dept}</option>
                  ))}
                </select>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`rounded-md border px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-700"}`}
                >
                  <option>Ordenar por nome</option>
                  <option>Ordenar por data</option>
                  <option>Ordenar por status</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-2">
              <span
                className={`hidden text-sm font-medium lg:block ${isDark ? "text-gray-400" : "text-gray-600"}`}
              >
                Visualização:
              </span>
              <select
                value={visualizacao}
                onChange={(e) => setVisualizacao(e.target.value)}
                className={`rounded-md border px-3 py-2 text-sm ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-700"}`}
              >
                <option>Cartões</option>
                <option>Lista</option>
              </select>
            </div>
          </div>

          {/* Título da seção */}
          <h3
            className={`mb-6 text-xl font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
          >
            Trilhas recentes
          </h3>

          {/* Results Count */}
          <div className="mb-4 flex items-center justify-between">
            <p
              className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              {filteredTrails.length} trilha
              {filteredTrails.length !== 1 ? "s" : ""} encontrada
              {filteredTrails.length !== 1 ? "s" : ""}
              {searchTerm && ` para "${searchTerm}"`}
            </p>
          </div>

          {/* Estado vazio */}
          {filteredTrails.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p
                className={`mb-4 text-center text-base font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Nenhuma trilha recente encontrada
              </p>
              <button
                onClick={() => navigate("/trails")}
                className={`flex items-center gap-2 rounded-lg border px-5 py-2.5 font-medium shadow-sm transition-all duration-200 hover:shadow-md focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                aria-label="Ver catálogo completo de trilhas"
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Ver catálogo completo
              </button>
            </div>
          ) : (
            <>
              {/* Tabela ou Cards de Trilhas */}
              {visualizacao === "Lista" ? (
                // Visualização em Lista (Tabela)
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr
                        className={
                          isDark
                            ? "border-b border-gray-700"
                            : "border-b border-gray-200"
                        }
                      >
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium tracking-wider uppercase ${isDark ? "text-gray-300" : "text-gray-500"}`}
                        >
                          <input
                            type="checkbox"
                            checked={
                              selectedTrails.size === filteredTrails.length &&
                              filteredTrails.length > 0
                            }
                            onChange={toggleSelectAll}
                            className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                            aria-label="Selecionar todas as trilhas"
                          />
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium tracking-wider uppercase ${isDark ? "text-gray-300" : "text-gray-500"}`}
                        >
                          Nome da trilha
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium tracking-wider uppercase ${isDark ? "text-gray-300" : "text-gray-500"}`}
                        >
                          Status
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium tracking-wider uppercase ${isDark ? "text-gray-300" : "text-gray-500"}`}
                        >
                          Inscrições
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium tracking-wider uppercase ${isDark ? "text-gray-300" : "text-gray-500"}`}
                        >
                          Taxa de conclusão
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium tracking-wider uppercase ${isDark ? "text-gray-300" : "text-gray-500"}`}
                        >
                          Prazo
                        </th>
                        <th
                          className={`px-6 py-3 text-left text-xs font-medium tracking-wider uppercase ${isDark ? "text-gray-300" : "text-gray-500"}`}
                        >
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody
                      className={
                        isDark
                          ? "divide-y divide-gray-700 bg-gray-800"
                          : "divide-y divide-gray-200 bg-white"
                      }
                    >
                      {filteredTrails.map((trail) => (
                        <tr
                          key={trail.id}
                          className={`transition-colors ${isDark ? "hover:bg-gray-700/60" : "hover:bg-gray-50"}`}
                        >
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={selectedTrails.has(trail.id)}
                              onChange={() => toggleTrailSelection(trail.id)}
                              className="h-4 w-4 cursor-pointer rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                              aria-label={`Selecionar trilha ${trail.name}`}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div>
                              <div
                                className={`font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
                              >
                                {trail.name}
                              </div>
                              <div
                                className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                              >
                                {trail.description}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                                normalizeStatus(trail.status) === "Publicada"
                                  ? isDark
                                    ? "border-green-700/60 bg-green-900/40 text-green-100"
                                    : "border-green-200 bg-green-100 text-green-800"
                                  : isDark
                                    ? "border-yellow-700/60 bg-yellow-900/40 text-yellow-100"
                                    : "border-yellow-200 bg-yellow-100 text-yellow-800"
                              }`}
                            >
                              {normalizeStatus(trail.status)}
                            </span>
                          </td>
                          <td
                            className={`px-6 py-4 text-sm font-medium ${isDark ? "text-blue-300" : "text-blue-900"}`}
                          >
                            {trail.inscricoes}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div
                                className={`mr-3 h-2 w-16 rounded-full ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
                              >
                                <div
                                  className={`h-2 rounded-full transition-all ${isDark ? "bg-blue-400" : "bg-blue-600"}`}
                                  style={{ width: `${trail.taxaConclusao}%` }}
                                ></div>
                              </div>
                              <span
                                className={`text-sm font-medium ${isDark ? "text-blue-300" : "text-blue-900"}`}
                              >
                                {trail.taxaConclusao}%
                              </span>
                            </div>
                          </td>
                          <td
                            className={`px-6 py-4 text-sm ${isDark ? "text-blue-300" : "text-blue-900"}`}
                          >
                            {trail.deadline
                              ? new Date(trail.deadline).toLocaleDateString(
                                  "pt-BR",
                                )
                              : trail.prazo}
                          </td>
                          <td className="space-x-2 px-6 py-4 text-sm">
                            <div className="flex items-center gap-2">
                              {/* Ação Principal: Ver */}
                              <button
                                onClick={() => navigate(`/trail/${trail.id}`)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 font-medium text-white transition-all duration-200 hover:opacity-90 hover:shadow-md"
                                style={{ backgroundColor: "#233E97" }}
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
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                  />
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                  />
                                </svg>
                                Ver trilha
                              </button>

                              {/* Ação Secundária: Editar */}
                              <button
                                onClick={() =>
                                  navigate(`/edit-trail/${trail.id}`)
                                }
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-4 py-2 font-medium transition-all duration-200 hover:shadow-md ${isDark ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                                title="Editar trilha e gerenciar conteúdo"
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
                                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                  />
                                </svg>
                                Editar
                              </button>

                              {/* Menu de três pontos com Excluir */}
                              <div className="relative">
                                <button
                                  onClick={() =>
                                    setOpenMenuId(
                                      openMenuId === trail.id ? null : trail.id,
                                    )
                                  }
                                  className={`rounded-lg p-2 transition-colors ${isDark ? "text-gray-400 hover:bg-gray-700 hover:text-gray-200" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                                  title="Mais opções"
                                >
                                  <svg
                                    className="h-5 w-5"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                  >
                                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                  </svg>
                                </button>

                                {/* Dropdown menu */}
                                {openMenuId === trail.id && (
                                  <>
                                    {/* Overlay para fechar o menu */}
                                    <div
                                      className="fixed inset-0 z-10"
                                      onClick={() => setOpenMenuId(null)}
                                    />
                                    <div
                                      className={`absolute right-0 z-20 mt-2 w-48 rounded-lg shadow-lg ${isDark ? "border border-gray-700 bg-gray-800" : "border border-gray-200 bg-white"}`}
                                    >
                                      <button
                                        onClick={() => {
                                          setOpenMenuId(null);
                                          handleDeleteTrail(
                                            trail.id,
                                            trail.name,
                                          );
                                        }}
                                        className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm transition-colors ${isDark ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-red-50"}`}
                                      >
                                        <svg
                                          className="h-5 w-5"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                          />
                                        </svg>
                                        Excluir trilha
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                // Visualização em Cartões
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-6 xl:grid-cols-3 2xl:grid-cols-4">
                  {filteredTrails.map((trail) => (
                    <div
                      key={trail.id}
                      className={`flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-300 hover:shadow-lg ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"}`}
                      style={{ minHeight: "480px" }}
                    >
                      {/* Trail Header with Image */}
                      <div className="relative h-32 overflow-hidden">
                        <img
                          src={getTrailImage(trail.name)}
                          alt={trail.name}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            // Fallback para imagem padrão em caso de erro
                            e.currentTarget.src =
                              "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop&auto=format";
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                        <div className="absolute right-4 bottom-3 left-4">
                          <h3 className="line-clamp-2 text-lg font-bold text-white drop-shadow-lg">
                            {highlightSearchTerm(
                              trail.name,
                              debouncedSearchTerm,
                            )}
                          </h3>
                        </div>
                      </div>

                      {/* Trail Content */}
                      <div className="flex flex-1 flex-col p-4 lg:p-6">
                        <p
                          className={`mb-3 line-clamp-2 flex-shrink-0 text-xs lg:mb-4 lg:text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {trail.description}
                        </p>

                        {/* Stats Grid */}
                        <div className="mb-3 grid flex-shrink-0 grid-cols-2 gap-2 lg:mb-4 lg:gap-4">
                          <div
                            className={`rounded-lg p-2 text-center lg:p-3 ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                          >
                            <div
                              className={`text-base font-bold lg:text-lg ${isDark ? "text-blue-400" : "text-blue-900"}`}
                            >
                              {trail.inscricoes}
                            </div>
                            <div
                              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              Inscrições
                            </div>
                          </div>
                          <div
                            className={`rounded-lg p-2 text-center lg:p-3 ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                          >
                            <div
                              className={`text-base font-bold lg:text-lg ${isDark ? "text-blue-400" : "text-blue-900"}`}
                            >
                              {trail.taxaConclusao}%
                            </div>
                            <div
                              className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                            >
                              Conclusão
                            </div>
                          </div>
                        </div>

                        {/* Status and Deadline */}
                        <div className="mb-2 flex flex-shrink-0 items-center justify-between">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              normalizeStatus(trail.status) === "Publicada"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {normalizeStatus(trail.status)}
                          </span>
                          <div
                            className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}
                          >
                            Prazo:{" "}
                            {trail.deadline
                              ? new Date(trail.deadline).toLocaleDateString(
                                  "pt-BR",
                                )
                              : trail.prazo}
                          </div>
                        </div>

                        {/* Módulos e Tags */}
                        <div className="mb-4 flex flex-col gap-2 text-xs text-gray-600 dark:text-gray-300">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded bg-gray-100 px-2 py-1 font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                              {getModuleCount(trail)} módulos
                            </span>
                          </div>
                          {(() => {
                            const tagsArr = Array.isArray(trail.tags)
                              ? trail.tags
                              : Array.isArray((trail as any).rawTags)
                                ? (trail as any).rawTags
                                : [];
                            const labelFor = (tag: any) =>
                              typeof tag === "string"
                                ? tag
                                : tag?.name ||
                                  tag?.nome ||
                                  tag?.label ||
                                  tag?.title ||
                                  "";
                            const labeled = tagsArr
                              .map(labelFor)
                              .filter((t) => t && t.trim().length > 0);
                            if (labeled.length === 0) return null;
                            return (
                              <div className="flex flex-wrap gap-2">
                                {labeled.slice(0, 3).map((tag, index) => (
                                  <span
                                    key={index}
                                    className={`rounded px-2 py-1 text-xs ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {labeled.length > 3 && (
                                  <span
                                    className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                                  >
                                    +{labeled.length - 3}
                                  </span>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                        {/* Spacer to push buttons to bottom */}
                        <div className="flex-grow"></div>

                        {/* Action Buttons */}
                        <div className="mt-auto space-y-2">
                          {/* Ação Principal: Ver Trilha */}
                          <button
                            onClick={() => navigate(`/trail/${trail.id}`)}
                            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:opacity-90 hover:shadow-md"
                            style={{ backgroundColor: "#233E97" }}
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
                                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                              />
                            </svg>
                            Ver trilha
                          </button>

                          {/* Ações Secundárias */}
                          <div className="flex gap-2">
                            {/* Editar */}
                            <button
                              onClick={() =>
                                navigate(`/edit-trail/${trail.id}`)
                              }
                              className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-all duration-200 hover:shadow-md ${isDark ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                              title="Editar trilha e gerenciar conteúdo"
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
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                              Editar
                            </button>

                            {/* Menu de três pontos com Excluir */}
                            <div className="relative">
                              <button
                                onClick={() =>
                                  setOpenMenuId(
                                    openMenuId === trail.id ? null : trail.id,
                                  )
                                }
                                className={`rounded-lg border px-3 py-2 transition-colors ${isDark ? "border-gray-600 bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-gray-200" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`}
                                title="Mais opções"
                              >
                                <svg
                                  className="h-5 w-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>

                              {/* Dropdown menu */}
                              {openMenuId === trail.id && (
                                <>
                                  {/* Overlay para fechar o menu */}
                                  <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setOpenMenuId(null)}
                                  />
                                  <div
                                    className={`absolute right-0 bottom-full z-20 mb-2 w-48 rounded-lg shadow-lg ${isDark ? "border border-gray-700 bg-gray-800" : "border border-gray-200 bg-white"}`}
                                  >
                                    <button
                                      onClick={() => {
                                        setOpenMenuId(null);
                                        handleDeleteTrail(trail.id, trail.name);
                                      }}
                                      className={`flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium transition-colors ${isDark ? "text-red-400 hover:bg-gray-700" : "text-red-600 hover:bg-red-50"}`}
                                    >
                                      <svg
                                        className="h-5 w-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                      Excluir trilha
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Nota inferior */}
          <div
            className={`mt-6 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
          >
            Lista das trilhas com ações de gerenciamento. Use "Editar" para
            abrir o editor da trilha.
          </div>
        </div>
      </main>
      {/* Toast removed - profile menu handles logout UI */}
    </div>
  );
}
