import { useState, useEffect, useMemo, useRef } from "react";
import ProfileMenu from "./ProfileMenu";
import NotificationPanel from "./NotificationPanel";
import FAURGLogo from "../assets/FAURG-logo-horizontal-reduzida.png";
import { useTrails } from "../hooks/useTrails";
import type { Trail } from "../types/api";
import { useNavigate, useLocation } from "react-router-dom";
import progressService, {
  getUserEnrollments,
} from "../services/progressService";
import { authService } from "../services/authService";
import { useTheme } from "../contexts/ThemeContext";

// Reuse the same imagery helper as other pages
const getTrailImage = (trailName: string): string => {
  const name = trailName.toLowerCase();
  if (name.includes("compliance") || name.includes("ética"))
    return "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=600&fit=crop&auto=format";
  if (name.includes("liderança") || name.includes("desenvolvimento"))
    return "https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=600&fit=crop&auto=format";
  if (name.includes("onboarding") || name.includes("integração"))
    return "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&h=600&fit=crop&auto=format";
  if (name.includes("segurança") || name.includes("informação"))
    return "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=1200&h=600&fit=crop&auto=format";
  if (name.includes("vendas") || name.includes("comercial"))
    return "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200&h=600&fit=crop&auto=format";
  if (name.includes("tecnologia") || name.includes("ti"))
    return "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200&h=600&fit=crop&auto=format";
  if (name.includes("marketing") || name.includes("comunicação"))
    return "https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=1200&h=600&fit=crop&auto=format";
  return "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&h=600&fit=crop&auto=format";
};

export default function AprendizHome() {
  const { trails, fetchTrails, isLoading } = useTrails();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const { isDark, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [enrolledIds, setEnrolledIds] = useState<Record<number, boolean>>({});
  const [currentUser, setCurrentUser] = useState<{
    firstName?: string;
    lastName?: string;
    username?: string;
    role?: string;
  } | null>(null);
  const [aboutTrail, setAboutTrail] = useState<Trail | null>(null);
  const [confirmEnrollTrail, setConfirmEnrollTrail] = useState<Trail | null>(
    null,
  );

  // Default to showing only active trails for aprendizes
  const [filters, setFilters] = useState<{
    search: string;
    category: string;
    modules: string;
    sortBy: string;
  }>({ search: "", category: "", modules: "", sortBy: "newest" });
  const [moduleCounts, setModuleCounts] = useState<Record<number, number>>({});

  // Carregar trilhas do backend ao montar
  useEffect(() => {
    fetchTrails();
  }, [fetchTrails]);

  useEffect(() => {
    const u = authService.getStoredUser();
    if (u)
      setCurrentUser(
        u as {
          firstName?: string;
          lastName?: string;
          username?: string;
          role?: string;
        },
      );
    const t = window.setTimeout(() => setMounted(true), 30);
    return () => clearTimeout(t);
  }, []);

  // Derivar contagem de módulos somente após carregamento assíncrono
  useEffect(() => {
    if (isLoading) return;
    const map: Record<number, number> = {};
    trails.forEach((trail) => {
      map[trail.id] = getModuleCount(trail);
    });
    setModuleCounts(map);
  }, [trails, isLoading]);

  useEffect(() => {
    let mounted = true;
    const user = authService.getStoredUser();
    if (!user) return;
    (async () => {
      try {
        const enrollments = await getUserEnrollments();
        console.log("📚 [AprendizHome] Enrollments carregadas:", enrollments);
        const map: Record<number, boolean> = {};
        enrollments.forEach((e: any) => {
          // Tentar diferentes formatos de ID
          const trailId = e.trail_id || e.id_trilha || e.trailId;
          if (trailId) {
            map[trailId] = true;
          }
        });
        console.log("🗺️ [AprendizHome] Mapa de IDs inscritos:", map);
        if (mounted) setEnrolledIds(map);
      } catch (err) {
        // fallback: keep existing behavior (no enrollments)
        console.warn(
          "Não foi possível carregar inscrições do usuário, fallback para checagem individual",
          err,
        );
        const activeTrails = trails.filter((t) => {
          return t.status === "Publicada";
        });
        const map: Record<number, boolean> = {};
        await Promise.all(
          activeTrails.map(async (t) => {
            try {
              await progressService.getTrailProgress(t.id);
              if (mounted) map[t.id] = true;
            } catch {
              if (mounted) map[t.id] = false;
            }
          }),
        );
        if (mounted) setEnrolledIds(map);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [trails]);

  const handleEnroll = (trail: Trail) => {
    setConfirmEnrollTrail(trail);
  };

  const confirmEnroll = async () => {
    if (!confirmEnrollTrail) return;

    setMessage(null);
    setError(null);
    setLoadingId(confirmEnrollTrail.id);
    try {
      await progressService.initializeTrailProgress(confirmEnrollTrail.id);
      setEnrolledIds((prev) => ({ ...prev, [confirmEnrollTrail.id]: true }));
      setMessage("Inscrição realizada com sucesso!");
      setConfirmEnrollTrail(null);
      setTimeout(() => navigate("/trails"), 700);
    } catch (err: unknown) {
      const e = err as
        | { response?: { data?: { detail?: string } }; message?: string }
        | undefined;
      console.error("Erro ao inscrever na trilha", err);
      setError(e?.response?.data?.detail || e?.message || "Erro ao inscrever");
      setConfirmEnrollTrail(null);
    } finally {
      setLoadingId(null);
    }
  };

  const role = currentUser?.role || null;

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
        path: role === "Administrador" ? "/admin" : "/aprendiz",
        ariaLabel: "Ir para página inicial",
        match: (value: string) =>
          value.startsWith("/aprendiz") || value === "/admin",
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
        key: "certificados",
        label: "Certificados",
        path: "/certificados",
        ariaLabel: "Ver certificados",
        match: (value: string) => value.startsWith("/certificados"),
      },
    ],
    [role],
  );

  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
    opacity: 0,
  });

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

  const tagLabel = (tag: any) =>
    typeof tag === "string"
      ? tag
      : tag?.name || tag?.nome || tag?.label || tag?.title || "";

  // derive categories and helpers (same behavior as TrailsCatalog)
  const categories = Array.from(
    new Set(
      trails
        .flatMap((trail: Trail) => (trail.tags ?? []).map(tagLabel))
        .filter((t) => t && t.trim().length > 0),
    ),
  );

  const parseTime = (v?: string | number | Date) =>
    v ? new Date(v).getTime() : 0;

  const getTotalSteps = (trail: Trail) => {
    const modules = safeModules(trail);
    return modules.reduce(
      (total: number, module) => total + (module.materials?.length || 0),
      0,
    );
  };

  const getDifficultyColor = (status: string) => {
    switch (status) {
      case "Ativo":
        return "bg-green-100 text-green-800";
      case "Rascunho":
        return "bg-yellow-100 text-yellow-800";
      case "Pausado":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const safeModules = (trail: Trail) =>
    Array.isArray(trail.modules) ? trail.modules : [];

  // Função para obter contagem de módulos (consistente com AdminDashboard e TrailsCatalog)
  const getModuleCount = (trail: Trail): number => {
    // Prioridade 1: Campo moduleCount já calculado pelo backend
    if (typeof trail?.moduleCount === "number") {
      return trail.moduleCount;
    }

    // Prioridade 2: Array modules direto
    if (Array.isArray(trail?.modules)) {
      return trail.modules.length;
    }

    // Prioridade 3: Changelog parseado (objeto ou array)
    if (trail?.changelog) {
      if (typeof trail.changelog === "object") {
        if (Array.isArray(trail.changelog.modules)) {
          return trail.changelog.modules.length;
        }
        if (Array.isArray(trail.changelog)) {
          return trail.changelog.length;
        }
      }

      // Prioridade 4: Parse de changelog string
      if (typeof trail.changelog === "string" && trail.changelog.trim()) {
        try {
          const parsed = JSON.parse(trail.changelog);
          if (Array.isArray(parsed)) return parsed.length;
          if (parsed && Array.isArray(parsed.modules))
            return parsed.modules.length;
        } catch {
          // Ignorar erro de parse
        }
      }
    }

    return 0;
  };

  const filteredTrails = trails
    .filter((trail: Trail) => {
      const tagLabels = (trail.tags ?? []).map(tagLabel);
      const matchesSearch =
        trail.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        trail.description.toLowerCase().includes(filters.search.toLowerCase());
      const matchesCategory =
        !filters.category || tagLabels.includes(filters.category);
      const matchesModules =
        !filters.modules ||
        (() => {
          const moduleCount = moduleCounts[trail.id] ?? getModuleCount(trail);
          switch (filters.modules) {
            case "1-3":
              return moduleCount >= 1 && moduleCount <= 3;
            case "4-6":
              return moduleCount >= 4 && moduleCount <= 6;
            case "7+":
              return moduleCount >= 7;
            default:
              return true;
          }
        })();
      // If we're on the Aprendiz home, show active trails available for enrollment
      // (i.e. active AND NOT already enrolled)
      const isAprendizView = role === "Aprendiz";
      const isEnrolled = !!enrolledIds[trail.id];
      if (isAprendizView) {
        // ensure we only surface published trails for enrollment
        const isActive = trail.status === "Publicada";
        return (
          matchesSearch &&
          matchesCategory &&
          matchesModules &&
          isActive &&
          !isEnrolled
        );
      }
      return matchesSearch && matchesCategory && matchesModules;
    })
    .sort((a: Trail, b: Trail) => {
      switch (filters.sortBy) {
        case "newest":
          return parseTime(b.createdAt) - parseTime(a.createdAt);
        case "oldest":
          return parseTime(a.createdAt) - parseTime(b.createdAt);
        case "title":
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  return (
    <div
      className={`min-h-screen font-sans transition-all duration-300 ${mounted ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"} ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
      style={{ backgroundColor: isDark ? "#111827" : "#F9FAFB" }}
    >
      {/* Navbar (same look as admin) */}
      <header
        className="relative z-40 font-semibold shadow-md"
        style={{ backgroundColor: "#233E97", height: "64px" }}
      >
        <div className="w-full px-8">
          <div className="flex h-full items-end justify-between pb-2">
            <div className="ml-6 flex items-center" />
            <nav
              ref={navContainerRef}
              className="relative hidden flex-1 justify-center space-x-8 md:ml-8 md:flex"
            >
              {navLinks.map((link) => {
                const isActive = link.match(pathname);
                return (
                  <div key={link.key} className="relative">
                    <button
                      ref={(el) => (navRefs.current[link.key] = el)}
                      onClick={() =>
                        link.key === "certificados"
                          ? navigate(link.path, { state: { from: pathname } })
                          : navigate(link.path)
                      }
                      className={`flex cursor-pointer items-center px-4 py-4 text-sm font-semibold transition-all duration-300 ease-out hover:scale-105 hover:brightness-125 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900 focus:outline-none md:text-base ${isActive ? "opacity-100" : "opacity-85"}`}
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
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className={`rounded-full p-2.5 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none ${isDark ? "bg-gray-800" : "bg-white"}`}
                aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
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
      </header>

      {/* Header Visual - Semicírculo branco com logo FAURG (match TrailsCatalog) */}
      <div
        className="relative w-full overflow-hidden shadow-md"
        style={{ backgroundColor: "#233E97", height: "350px" }}
      >
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
          className={`mb-8 rounded-xl border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-100 bg-white"}`}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Search */}
            <div>
              <label
                className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Buscar trilhas
              </label>
              <input
                type="text"
                placeholder="Digite o nome da trilha..."
                value={filters.search}
                onChange={(e) =>
                  setFilters({ ...filters, search: e.target.value })
                }
                className={`w-full rounded-lg border px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
              />
            </div>

            {/* Category Filter */}
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

            {/* Módulos Filter */}
            <div>
              <label
                className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Número de Módulos
              </label>
              <select
                value={filters.modules}
                onChange={(e) =>
                  setFilters({ ...filters, modules: e.target.value })
                }
                className={`w-full rounded-lg border px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
              >
                <option value="">Todos</option>
                <option value="1-3">1-3 módulos</option>
                <option value="4-6">4-6 módulos</option>
                <option value="7+">7+ módulos</option>
              </select>
            </div>

            {/* Certificado Filter */}
            <div>
              <label
                className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                Certificado
              </label>
              <select
                className={`w-full rounded-lg border px-3 py-2 transition-all focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
              >
                <option value="">Todos</option>
                <option value="com">Com certificado</option>
                <option value="sem">Sem certificado</option>
              </select>
            </div>
          </div>
        </div>
        {message && (
          <div
            className={`mt-4 mb-4 rounded border p-3 ${isDark ? "border-green-900 bg-green-900/20 text-green-400" : "border-green-200 bg-green-50 text-green-800"}`}
          >
            {message}
          </div>
        )}
        {error && (
          <div
            className={`mb-4 rounded border p-3 ${isDark ? "border-red-900 bg-red-900/20 text-red-400" : "border-red-200 bg-red-50 text-red-800"}`}
          >
            {error}
          </div>
        )}

        {/* Results Count */}
        <div className="mb-6 flex items-center justify-between">
          <p className={isDark ? "text-gray-400" : "text-gray-600"}>
            {filteredTrails.length} trilha
            {filteredTrails.length !== 1 ? "s" : ""} encontrada
            {filteredTrails.length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Trails Grid */}
        {filteredTrails.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto max-w-md">
              <div
                className={`mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full ${isDark ? "bg-gray-800" : "bg-gray-100"}`}
              >
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3
                className={`mb-2 text-lg font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
              >
                Nenhuma trilha encontrada
              </h3>
              <p className={isDark ? "text-gray-400" : "text-gray-600"}>
                Tente ajustar os filtros ou criar uma nova trilha.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTrails.map((trail: Trail) => (
              <div
                key={trail.id}
                className={`transform overflow-hidden rounded-lg shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${isDark ? "bg-gray-800" : "bg-white"}`}
              >
                {/* Trail Image/Banner */}
                <div className="relative h-48 overflow-hidden">
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
                  <div className="absolute right-4 bottom-4 left-4">
                    <h3 className="mb-1 line-clamp-2 text-xl font-bold text-white">
                      {trail.name}
                    </h3>
                  </div>
                </div>

                {/* Trail Content */}
                <div className="p-6">
                  <p
                    className={`mb-4 line-clamp-3 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    {trail.description}
                  </p>

                  {/* Stats */}
                  <div
                    className={`mb-4 flex items-center gap-4 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    <div className="flex items-center gap-1">
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
                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                        />
                      </svg>
                      {moduleCounts[trail.id] ?? getModuleCount(trail)} módulo
                      {(moduleCounts[trail.id] ?? getModuleCount(trail)) !== 1
                        ? "s"
                        : ""}
                    </div>
                    <div className="flex items-center gap-1">
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
                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      {getTotalSteps(trail)} etapas
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="mb-4">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${getDifficultyColor(trail.status ?? "")}`}
                    >
                      {trail.status}
                    </span>
                  </div>

                  {/* Tags */}
                  {(trail.tags ?? []).length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {(trail.tags ?? [])
                          .map(tagLabel)
                          .filter((t) => t && t.trim().length > 0)
                          .slice(0, 3)
                          .map((tag: string, index: number) => (
                            <span
                              key={index}
                              className={`rounded px-2 py-1 text-xs ${isDark ? "bg-gray-700 text-gray-300" : "bg-gray-100 text-gray-700"}`}
                            >
                              {tag}
                            </span>
                          ))}
                        {(trail.tags ?? [])
                          .map(tagLabel)
                          .filter((t) => t && t.trim().length > 0).length >
                          3 && (
                          <span
                            className={`text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                          >
                            +
                            {(trail.tags ?? [])
                              .map(tagLabel)
                              .filter((t) => t && t.trim().length > 0).length -
                              3}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setAboutTrail(trail)}
                      className={`w-1/2 rounded-lg border px-4 py-3 font-medium transition-all hover:scale-105 hover:shadow-sm ${isDark ? "border-gray-600 bg-gray-700 text-gray-200 hover:bg-gray-600" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"}`}
                    >
                      Ver Sobre
                    </button>
                    <div className="w-1/2">
                      {enrolledIds[trail.id] ? (
                        <button
                          onClick={() => navigate(`/trail/${trail.id}`)}
                          className="w-full rounded-lg py-3 font-medium text-white transition-all hover:opacity-90"
                          style={{ backgroundColor: "#10B981" }}
                        >
                          Continuar
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnroll(trail)}
                          disabled={loadingId === trail.id}
                          className="w-full rounded-lg py-3 font-medium text-white transition-all hover:opacity-90"
                          style={{ backgroundColor: "#233E97" }}
                        >
                          {loadingId === trail.id
                            ? "Inscrevendo..."
                            : "Inscrever"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {/* About modal */}
      {aboutTrail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setAboutTrail(null)}
          />
          <div
            className={`relative z-10 mx-4 w-full max-w-2xl rounded-lg p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <button
              onClick={() => setAboutTrail(null)}
              aria-label="Fechar"
              className={`absolute top-3 right-3 transition-all ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}
            >
              ✕
            </button>
            <h2
              className={`mb-2 text-2xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
            >
              {aboutTrail.name}
            </h2>
            <p className={`mb-4 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              {aboutTrail.description}
            </p>
            <div
              className={`mb-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              <div>
                Módulos:{" "}
                {moduleCounts[aboutTrail.id] ?? getModuleCount(aboutTrail)}
              </div>
              <div>
                Etapas:{" "}
                {safeModules(aboutTrail).reduce(
                  (acc, m) => acc + (m.materials?.length || 0),
                  0,
                )}
              </div>
              {aboutTrail.tags && aboutTrail.tags.length > 0 && (
                <div className="mt-2">Tags: {aboutTrail.tags.join(", ")}</div>
              )}
            </div>
            <div className="flex justify-end gap-3">
              {!enrolledIds[aboutTrail.id] ? (
                <button
                  onClick={() => {
                    setAboutTrail(null);
                    handleEnroll(aboutTrail);
                  }}
                  className="rounded-md px-4 py-2 font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#233E97" }}
                >
                  Inscrever
                </button>
              ) : (
                <button
                  onClick={() => navigate(`/trail/${aboutTrail.id}`)}
                  className="rounded-md px-4 py-2 font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#10B981" }}
                >
                  Continuar
                </button>
              )}
              <button
                onClick={() => setAboutTrail(null)}
                className={`rounded-md border px-4 py-2 transition-all ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmEnrollTrail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmEnrollTrail(null)}
          />
          <div
            className={`relative z-10 mx-4 w-full max-w-md rounded-lg p-6 ${isDark ? "bg-gray-800" : "bg-white"}`}
          >
            <h2
              className={`mb-4 text-xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
            >
              Confirmar Inscrição
            </h2>
            <p className={`mb-6 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
              Deseja se inscrever na trilha{" "}
              <strong>{confirmEnrollTrail.name}</strong>?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmEnrollTrail(null)}
                className={`rounded-md border px-4 py-2 transition-all ${isDark ? "border-gray-600 text-gray-300 hover:bg-gray-700" : "border-gray-200 text-gray-700 hover:bg-gray-50"}`}
              >
                Cancelar
              </button>
              <button
                onClick={confirmEnroll}
                disabled={loadingId === confirmEnrollTrail.id}
                className="rounded-md px-4 py-2 font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ backgroundColor: "#233E97" }}
              >
                {loadingId === confirmEnrollTrail.id
                  ? "Inscrevendo..."
                  : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
