import React, { useState, useMemo, useRef, useEffect } from "react";
import ProfileMenu from "./ProfileMenu";
import NotificationPanel from "./NotificationPanel";
import FAURGLogo from "../assets/FAURG-logo-horizontal-reduzida.png";
import { type Trail } from "../contexts/TrailsContext";
import { useTrails } from "../hooks/useTrails";
import { authService } from "../services/authService";
import { getUserEnrollments } from "../services/progressService";
import { useNavigate, useLocation } from "react-router-dom";
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

interface FilterOptions {
  search: string;
  category: string;
  difficulty: string;
  sortBy: string;
  public: string;
  level: string;
  certificate: string;
  department: string;
}

const TrailsCatalog: React.FC = () => {
  const { trails, fetchTrails } = useTrails();
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const storedUser = authService.getStoredUser();
  const currentUser = storedUser as {
    id?: number;
    username?: string;
    email?: string;
    role?: string;
    perfil?: { id_perfil?: number; nome?: string; descricao?: string };
  } | null;
  // Usar 'role' se disponível (normalizado), senão tentar 'perfil.nome'
  const role = currentUser?.role || currentUser?.perfil?.nome || null;

  useEffect(() => {
    fetchTrails();
  }, [fetchTrails]);

  type NavLink = {
    key: string;
    label: string;
    path: string;
    ariaLabel: string;
    visible: boolean;
    match: (value: string) => boolean;
  };

  const navLinks: NavLink[] = useMemo(() => {
    const getHomePath = (r: string | null) => {
      if (r === "Administrador") return "/admin";
      if (r === "Mentor") return "/trails";
      if (r === "Aprendiz") return "/aprendiz";
      return "/admin/reports";
    };

    const homePath = getHomePath(role);
    const isAdmin = role !== "Aprendiz";
    const certificadosPath =
      role === "Administrador" ? "/admin/certificados" : "/certificados";

    return [
      {
        key: "home",
        label: "Página Inicial",
        path: homePath,
        ariaLabel: "Ir para página inicial",
        visible: true,
        match: (value: string) => value.startsWith(homePath),
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
        visible: isAdmin,
        match: (value: string) => value.startsWith("/admin/register"),
      },
      {
        key: "reports",
        label: "Relatórios",
        path: "/admin/reports",
        ariaLabel: "Ver relatórios",
        visible: isAdmin,
        match: (value: string) => value.startsWith("/admin/reports"),
      },
      {
        key: "certificados",
        label: "Certificados",
        path: certificadosPath,
        ariaLabel: "Ver certificados",
        visible: true,
        match: (value: string) =>
          value.startsWith("/certificados") ||
          value.startsWith("/admin/certificados"),
      },
    ];
  }, [role]);

  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
    opacity: 0,
  });

  // Atualizar indicador quando pathname ou navLinks mudarem
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

    // Usar requestAnimationFrame para garantir que o DOM foi atualizado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateIndicator();
      });
    });

    // Listener para resize
    const handleResize = () => {
      requestAnimationFrame(() => updateIndicator());
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pathname, navLinks]);

  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    category: "",
    difficulty: "",
    sortBy: "newest",
    public: "",
    level: "",
    certificate: "",
    department: "",
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showMoreFilters, setShowMoreFilters] = useState(false);

  const [enrolledIds, setEnrolledIds] = useState<Record<number, boolean>>({});
  const [enrolledTrails, setEnrolledTrails] = useState<Trail[]>([]);

  // Inicializar mounted após renderização
  useEffect(() => {
    const t = window.setTimeout(() => setMounted(true), 40);
    return () => clearTimeout(t);
  }, []);

  // Função para obter contagem de módulos (consistente com AdminDashboard)
  const getModuleCount = (trail: Trail): number => {
    // Usar modulesCount se existir (note que Trail de TrailsContext não tem essa propriedade tipada)
    const trailAny = trail as unknown as {
      modulesCount?: number;
      modules?: unknown[];
    };
    if (typeof trailAny.modulesCount === "number") {
      return trailAny.modulesCount;
    }

    // Prioridade 2: Array modules direto
    if (Array.isArray(trail?.modules)) {
      return trail.modules.length;
    }

    return 0;
  };

  // Carregar matrículas do usuário
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (role !== "Aprendiz") return;
      try {
        const enrollments = await getUserEnrollments();
        console.log("📚 Enrollments carregadas:", enrollments);
        const map: Record<number, boolean> = {};
        const trailIds: number[] = [];

        enrollments.forEach((e: any) => {
          const trailId = e.id_trilha;
          if (trailId) {
            map[trailId] = true;
            trailIds.push(trailId);
          }
        });
        console.log("🗺️ Mapa de IDs inscritos:", map);
        console.log("🎯 IDs das trilhas inscritas:", trailIds);

        if (mounted) {
          setEnrolledIds(map);

          // Se não temos trilhas do contexto, carregar direto da API
          if (trails.length === 0 && trailIds.length > 0) {
            console.log(
              "⚠️ Trails vazio, carregando trilhas inscritas da API...",
            );
            try {
              const token = localStorage.getItem("authToken");
              const headers = token ? { Authorization: `Bearer ${token}` } : {};
              const response = await fetch(
                `/api/trails/search/?ids=${trailIds.join(",")}`,
                {
                  headers,
                },
              );
              const data = await response.json();
              console.log("🎯 Trilhas carregadas da API:", data);
              console.log("🔍 Primeira trilha (amostra):", data.trilhas?.[0]);
              if (mounted && data.trilhas) {
                // Normalizar dados da API para o formato esperado pelo componente
                const normalizedTrails = data.trilhas.map((t: any) => ({
                  id: t.id || t.id_trilha,
                  name: t.name || t.nome || t.titulo || "",
                  description: t.description || t.descricao || "",
                  tags: t.tags || [],
                  status: t.status || "Ativo",
                  createdAt:
                    t.createdAt ||
                    t.created_at ||
                    t.data_criacao ||
                    new Date().toISOString(),
                  modules: t.modules || t.modulos || [],
                }));
                console.log("✅ Trilhas normalizadas:", normalizedTrails);
                setEnrolledTrails(normalizedTrails);
              }
            } catch (err) {
              console.error("❌ Erro ao carregar trilhas:", err);
            }
          }
        }
      } catch (err) {
        console.warn("❌ Could not load user enrollments", err);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [role, trails]);

  // Recarregar matrículas quando a página ganha foco (após inscrição)
  useEffect(() => {
    const handleFocus = () => {
      if (role === "Aprendiz") {
        console.log("👁️ Página ganhou foco, recarregando inscrições...");
        getUserEnrollments()
          .then((enrollments) => {
            console.log("📚 Enrollments recarregadas (focus):", enrollments);
            const map: Record<number, boolean> = {};
            enrollments.forEach((e: any) => {
              const trailId = e.id_trilha;
              if (trailId) {
                map[trailId] = true;
              }
            });
            console.log("🗺️ Mapa de IDs inscritos (focus):", map);
            console.log(
              "🎯 IDs das trilhas disponíveis:",
              trails.map((t: Trail) => t.id),
            );
            setEnrolledIds(map);
          })
          .catch((err) => console.warn("❌ Could not reload enrollments", err));
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [role, trails]);

  // Atualizar debouncedSearch após um delay
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(filters.search);
    }, 300);
    return () => clearTimeout(timer);
  }, [filters.search]);

  // Get unique categories from trails
  const categories = Array.from(
    new Set(
      (trails as unknown as Trail[]).flatMap((trail: Trail) => trail.tags),
    ),
  );

  const buttonFocus = `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${isDark ? "focus-visible:ring-offset-gray-900" : "focus-visible:ring-offset-white"}`;

  // Verificar se há filtros ativos (exceto search e sortBy)
  const hasActiveFilters =
    filters.category ||
    filters.difficulty ||
    filters.public ||
    filters.level ||
    filters.certificate ||
    filters.department;

  // Função para limpar todos os filtros
  const clearAllFilters = () => {
    setFilters({
      ...filters,
      category: "",
      difficulty: "",
      public: "",
      level: "",
      certificate: "",
      department: "",
    });
  };

  // Filter and sort trails
  const trailsToUse =
    role === "Aprendiz" && trails.length === 0 ? enrolledTrails : trails;
  const filteredTrails = (trailsToUse as unknown as Trail[])
    .filter((trail: Trail) => {
      // Busca simultânea em título, descrição e tags (ignorando maiúsculas/minúsculas)
      const searchLower = debouncedSearch.toLowerCase();
      const matchesSearch =
        !searchLower ||
        trail.name.toLowerCase().includes(searchLower) ||
        trail.description.toLowerCase().includes(searchLower) ||
        trail.tags.some((tag) => tag.toLowerCase().includes(searchLower));

      const matchesCategory =
        !filters.category || trail.tags.includes(filters.category);
      const matchesDifficulty =
        !filters.difficulty || trail.status === filters.difficulty;

      // Para admin/gestor/autor: mostrar apenas trilhas publicadas por padrão
      // Trilhas publicadas tem status "Ativo" ou "Publicada"
      const isAdminView = role !== "Aprendiz";
      const matchesStatus = isAdminView
        ? ["Ativo", "Publicada"].includes(trail.status || "")
        : true;

      // If this is the Aprendiz view, only show trails the Aprendiz is enrolled in
      if (role === "Aprendiz") {
        return (
          matchesSearch &&
          matchesCategory &&
          matchesDifficulty &&
          !!enrolledIds[trail.id]
        );
      }
      return matchesSearch && matchesCategory && matchesDifficulty && matchesStatus;
    })
    .sort((a: Trail, b: Trail) => {
      switch (filters.sortBy) {
        case "newest":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "oldest":
          return (
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
        case "title":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  const handleStartTrail = (trailId: number) => {
    // Navegar para a página de visualização da trilha
    navigate(`/trail/${trailId}`);
  };

  return (
    <div
      className={`min-h-screen font-sans ${isDark ? "bg-gray-900" : "bg-gray-50"} ${mounted ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"}`}
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
                        ref={(el) => {
                          navRefs.current[link.key] = el;
                        }}
                        onClick={() =>
                          navigate(
                            link.path,
                            link.key === "certificados"
                              ? { state: { from: pathname } }
                              : undefined,
                          )
                        }
                        className={`flex min-w-[120px] cursor-pointer items-center justify-center rounded-md px-4 py-4 text-center text-sm font-semibold whitespace-nowrap hover:scale-105 hover:brightness-125 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900 focus:outline-none md:text-base ${buttonFocus} ${isActive ? "opacity-100" : "opacity-85"}`}
                        style={{
                          color: isActive
                            ? "rgb(255, 255, 255)"
                            : "rgba(255, 255, 255, 0.84)",
                          backgroundColor: isActive
                            ? "rgba(255, 255, 255, 0.12)"
                            : "transparent",
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

            {/* Icons on the right */}
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

      <div
        className="relative w-full overflow-hidden shadow-md"
        style={{ backgroundColor: "#233E97", height: "350px" }}
      >
        {/* Semicírculo branco à esquerda */}
        <div
          className="absolute top-0 left-0 flex h-full items-center rounded-r-full bg-white"
          style={{
            width: "30%",
            boxShadow:
              "8px 12px 25px 0px rgba(0,0,0,0.15), inset 0px 4px 25px 0px rgba(0,0,0,0.15)",
            justifyContent: "flex-start",
            paddingLeft: "24px",
          }}
        >
          <img
            src={FAURGLogo}
            alt="FAURG Logo"
            className="object-contain"
            style={{ height: "70%", maxWidth: "70%" }}
          />
        </div>

        {/* Texto TRILHAS DE APRENDIZADO à direita */}
        <div
          className="absolute top-0 right-0 flex h-full items-center justify-end pr-12"
          style={{ width: "60%" }}
        >
          <div className="text-right">
            <h1 className="text-3xl leading-tight font-bold text-white md:text-4xl lg:text-5xl">
              TRILHAS DE
              <br />
              APRENDIZADO
            </h1>
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-8 sm:px-6 lg:px-8">
        {/* Filters Section */}
        <div
          className={`mb-6 rounded-xl border p-4 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"}`}
        >
          {/* Linha principal de filtros */}
          <div className="flex flex-wrap items-end gap-4">
            {/* Search */}
            <div className="min-w-[200px] flex-1">
              <label
                className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Buscar trilhas
              </label>
              <input
                type="text"
                placeholder="Buscar por título, descrição ou tag..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className={`w-full rounded-lg border px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" : "border-gray-300 bg-white text-gray-900"}`}
              />
            </div>

            {/* Status Filter */}
            <div className="w-40">
              <label
                className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Status
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) =>
                  setFilters({ ...filters, difficulty: e.target.value })
                }
                className={`w-full rounded-lg border px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
              >
                <option value="">Todos</option>
                <option value="Ativo">Ativo</option>
                <option value="Rascunho">Rascunho</option>
                <option value="Pausado">Pausado</option>
              </select>
            </div>

            {/* Público Filter */}
            <div className="w-40">
              <label
                className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Público
              </label>
              <select
                value={filters.public}
                onChange={(e) =>
                  setFilters({ ...filters, public: e.target.value })
                }
                className={`w-full rounded-lg border px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
              >
                <option value="">Todos</option>
                <option value="Público">Público</option>
                <option value="Privado">Privado</option>
              </select>
            </div>

            {/* Botão Mais Filtros */}
            <button
              onClick={() => setShowMoreFilters(!showMoreFilters)}
              className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-medium transition-colors ${isDark ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"} ${buttonFocus}`}
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
                  d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                />
              </svg>
              Mais filtros
            </button>

            {/* Botão Limpar Filtros (apenas quando há filtros ativos) */}
            {hasActiveFilters && (
              <button
                onClick={clearAllFilters}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-600 hover:text-gray-900"} ${buttonFocus}`}
                aria-label="Limpar todos os filtros"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                Limpar filtros
              </button>
            )}
          </div>

          {/* Painel de Mais Filtros (expansível) */}
          {showMoreFilters && (
            <div
              className={`mt-4 grid grid-cols-1 gap-4 border-t pt-4 md:grid-cols-3 ${isDark ? "border-gray-700" : "border-gray-200"}`}
            >
              {/* Categoria */}
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Categoria
                </label>
                <select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters({ ...filters, category: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                >
                  <option value="">Todas as categorias</option>
                  {categories.map((category: string) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Nível */}
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Nível
                </label>
                <select
                  value={filters.level}
                  onChange={(e) =>
                    setFilters({ ...filters, level: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                >
                  <option value="">Todos os níveis</option>
                  <option value="Iniciante">Iniciante</option>
                  <option value="Intermediário">Intermediário</option>
                  <option value="Avançado">Avançado</option>
                </select>
              </div>

              {/* Certificado */}
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Certificado
                </label>
                <select
                  value={filters.certificate}
                  onChange={(e) =>
                    setFilters({ ...filters, certificate: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                >
                  <option value="">Todos</option>
                  <option value="Com certificado">Com certificado</option>
                  <option value="Sem certificado">Sem certificado</option>
                </select>
              </div>

              {/* Departamento */}
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Departamento
                </label>
                <select
                  value={filters.department}
                  onChange={(e) =>
                    setFilters({ ...filters, department: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                >
                  <option value="">Todos os departamentos</option>
                  <option value="TI">TI</option>
                  <option value="RH">RH</option>
                  <option value="Vendas">Vendas</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Financeiro">Financeiro</option>
                </select>
              </div>

              {/* Ordenar por */}
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Ordenar por
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters({ ...filters, sortBy: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                >
                  <option value="newest">Mais recentes</option>
                  <option value="oldest">Mais antigas</option>
                  <option value="title">Nome (A-Z)</option>
                </select>
              </div>
            </div>
          )}

          {/* Chips de filtros ativos */}
          {hasActiveFilters && (
            <div className="mt-3 flex flex-wrap gap-2">
              {filters.category && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"}`}
                >
                  Categoria: {filters.category}
                  <button
                    onClick={() => setFilters({ ...filters, category: "" })}
                    className={`ml-1 hover:text-blue-600 ${buttonFocus}`}
                    aria-label="Remover filtro de categoria"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.difficulty && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"}`}
                >
                  Status: {filters.difficulty}
                  <button
                    onClick={() => setFilters({ ...filters, difficulty: "" })}
                    className={`ml-1 hover:text-blue-600 ${buttonFocus}`}
                    aria-label="Remover filtro de status"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.public && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"}`}
                >
                  Público: {filters.public}
                  <button
                    onClick={() => setFilters({ ...filters, public: "" })}
                    className={`ml-1 hover:text-blue-600 ${buttonFocus}`}
                    aria-label="Remover filtro de público"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.level && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"}`}
                >
                  Nível: {filters.level}
                  <button
                    onClick={() => setFilters({ ...filters, level: "" })}
                    className={`ml-1 hover:text-blue-600 ${buttonFocus}`}
                    aria-label="Remover filtro de nível"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.certificate && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"}`}
                >
                  {filters.certificate}
                  <button
                    onClick={() => setFilters({ ...filters, certificate: "" })}
                    className={`ml-1 hover:text-blue-600 ${buttonFocus}`}
                    aria-label="Remover filtro de certificado"
                  >
                    ×
                  </button>
                </span>
              )}
              {filters.department && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${isDark ? "bg-blue-900/30 text-blue-400" : "bg-blue-100 text-blue-800"}`}
                >
                  Departamento: {filters.department}
                  <button
                    onClick={() => setFilters({ ...filters, department: "" })}
                    className={`ml-1 hover:text-blue-600 ${buttonFocus}`}
                    aria-label="Remover filtro de departamento"
                  >
                    ×
                  </button>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Indicadores sutis */}
        <div
          className={`mb-6 flex items-center gap-6 text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          <div className="flex items-center gap-2">
            <span className="font-normal">Total:</span>
            <span className="font-medium">{trails.length}</span>
          </div>
          <div
            className={`h-3 w-px ${isDark ? "bg-gray-700" : "bg-gray-300"}`}
          ></div>
          <div className="flex items-center gap-2">
            <span className="font-normal">Ativas:</span>
            <span className="font-medium">
              {trails.filter((t) => t.status === "Ativo").length}
            </span>
          </div>
          <div
            className={`h-3 w-px ${isDark ? "bg-gray-700" : "bg-gray-300"}`}
          ></div>
          <div className="flex items-center gap-2">
            <span className="font-normal">Inativas:</span>
            <span className="font-medium">
              {trails.filter((t) => t.status !== "Ativo").length}
            </span>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            {filteredTrails.length} trilha
            {filteredTrails.length !== 1 ? "s" : ""} encontrada
            {filteredTrails.length !== 1 ? "s" : ""}
          </p>
          {role === "Aprendiz" && (
            <p
              className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
            >
              Total inscrito: {Object.keys(enrolledIds).length}
            </p>
          )}
        </div>

        {/* Trails Grid */}
        {filteredTrails.length === 0 ? (
          <div className="py-16 text-center">
            {/* Estado vazio quando há filtros ativos */}
            {hasActiveFilters ? (
              <div className="space-y-4">
                <p
                  className={`text-base font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Nenhuma trilha encontrada
                </p>
                <p
                  className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
                >
                  Tente ajustar os filtros para ver mais resultados
                </p>
                <button
                  onClick={clearAllFilters}
                  className={`mt-4 inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${isDark ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"} ${buttonFocus}`}
                  aria-label="Limpar filtros e mostrar todas as trilhas"
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
                  Limpar filtros
                </button>
              </div>
            ) : trails.length === 0 ? (
              /* Estado vazio quando não há trilhas no sistema */
              <div className="space-y-4">
                <p
                  className={`text-base font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Nenhuma trilha disponível
                </p>
                <p
                  className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
                >
                  {role === "Administrador" ||
                  role === "Autor de conteúdo" ||
                  role === "Gestor"
                    ? "Comece criando sua primeira trilha de aprendizado"
                    : "Aguarde enquanto as trilhas são disponibilizadas"}
                </p>
                {(role === "Administrador" ||
                  role === "Autor de conteúdo" ||
                  role === "Gestor") && (
                  <button
                    onClick={() => navigate("/create-trail")}
                    className={`mt-4 inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-md ${buttonFocus}`}
                    style={{ backgroundColor: "#233E97" }}
                    aria-label="Criar nova trilha"
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
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                    Criar nova trilha
                  </button>
                )}
              </div>
            ) : (
              /* Estado vazio quando a busca não retorna resultados */
              <div className="space-y-4">
                <p
                  className={`text-base font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Nenhuma trilha encontrada
                </p>
                <p
                  className={`text-sm ${isDark ? "text-gray-500" : "text-gray-500"}`}
                >
                  Sua busca não retornou resultados
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrails.map((trail: Trail) => (
              <div
                key={trail.id}
                className={`group overflow-hidden rounded-xl shadow-sm transition-all duration-200 hover:shadow-lg ${isDark ? "border border-gray-700 bg-gray-800" : "border border-gray-100 bg-white"}`}
              >
                {/* Trail Image/Banner */}
                <div className="relative h-40 overflow-hidden">
                  <img
                    src={getTrailImage(trail.name)}
                    alt={trail.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src =
                        "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=200&fit=crop&auto=format";
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>

                  {/* Indicador de Certificado */}
                  <div
                    className="absolute top-3 right-3"
                    title="Oferece certificado"
                  >
                    <div
                      className={`rounded-full p-2 ${isDark ? "bg-gray-900/80" : "bg-white/90"} shadow-lg backdrop-blur-sm`}
                    >
                      <svg
                        className="h-5 w-5 text-yellow-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Trail Content */}
                <div className="space-y-4 p-6">
                  {/* Título */}
                  <h3
                    className={`line-clamp-2 min-h-[3.5rem] text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                  >
                    {trail.name}
                  </h3>

                  {/* Descrição breve (máx 2 linhas) */}
                  <p
                    className={`line-clamp-2 min-h-[2.5rem] text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {trail.description}
                  </p>

                  {/* Divisor sutil */}
                  <div
                    className={`border-t ${isDark ? "border-gray-700" : "border-gray-100"}`}
                  ></div>

                  {/* Informações da trilha */}
                  <div className="space-y-2">
                    {/* Número de módulos */}
                    <div className="flex items-center gap-2">
                      <svg
                        className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-label="Número de módulos"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      <span
                        className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {getModuleCount(trail)} módulo
                        {getModuleCount(trail) !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Carga horária */}
                    <div className="flex items-center gap-2">
                      <svg
                        className={`h-5 w-5 ${isDark ? "text-gray-400" : "text-gray-500"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-label="Carga horária"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span
                        className={`text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                      >
                        {getModuleCount(trail) * 2}h estimadas
                      </span>
                    </div>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => handleStartTrail(trail.id)}
                    className={`w-full rounded-lg py-3 font-semibold text-white transition-all hover:opacity-90 hover:shadow-md ${buttonFocus}`}
                    style={{ backgroundColor: "#233E97" }}
                    aria-label={`Iniciar trilha ${trail.name}`}
                  >
                    Iniciar Trilha
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrailsCatalog;
