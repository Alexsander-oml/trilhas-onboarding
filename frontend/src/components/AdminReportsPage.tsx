import { useState, useMemo, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import ProfileMenu from "./ProfileMenu";
import NotificationPanel from "./NotificationPanel";
import { authService } from "../services/authService";
import { useTrails } from "../hooks/useTrails";
import type { Trail } from "../types/api";

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export default function AdminReportsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { trails: hookTrails, isLoading } = useTrails();

  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "all">(
    "30d",
  );
  const [indicatorStyle, setIndicatorStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const navContainerRef = useRef<HTMLElement | null>(null);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const storedUser = authService.getStoredUser?.();
  const role =
    (storedUser as unknown as Record<string, unknown>)?.role ??
    (storedUser as unknown as Record<string, unknown>)?.perfil ??
    "Aprendiz";
  const isAdmin = ["Administrador", "Gestor"].includes(String(role));

  const trails = useMemo(() => hookTrails || [], [hookTrails]);

  // Calcular estatísticas a partir dos dados
  const stats = useMemo(() => {
    if (trails.length === 0) {
      return {
        totalTrails: 0,
        publishedTrails: 0,
        totalEnrollments: 0,
        completionRate: 0,
        activeUsers: 0,
        completedTrails: 0,
      };
    }

    const published = trails.filter(
      (t: Trail) =>
        (t.status || "").toLowerCase() === "ativo" ||
        (t.status || "").toLowerCase() === "publicada",
    );

    const totalEnr = trails.reduce((acc: number, t: Trail) => {
      const enr =
        typeof t.inscricoes === "string"
          ? parseInt(t.inscricoes)
          : t.inscricoes || 0;
      return acc + enr;
    }, 0);

    const completed = trails.reduce((acc: number) => {
      // Trail não tem completed_count na tipagem, usar 0 por padrão
      return acc + 0;
    }, 0);

    const completionRate =
      totalEnr > 0 ? Math.round((completed / totalEnr) * 100) : 0;

    return {
      totalTrails: trails.length,
      publishedTrails: published.length,
      totalEnrollments: totalEnr,
      completionRate,
      activeUsers: Math.floor(totalEnr * 0.7), // Estimativa
      completedTrails: completed,
    };
  }, [trails]);

  const navigationLinks = useMemo(
    () => [
      {
        key: "dashboard",
        label: "Dashboard",
        path: "/admin",
        ariaLabel: "Ir para dashboard",
        visible: isAdmin,
        match: (value: string) => value === "/admin",
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
        path: "/admin/certificados",
        ariaLabel: "Gerenciar certificados",
        visible: isAdmin,
        match: (value: string) => value.startsWith("/admin/certificados"),
      },
    ],
    [isAdmin],
  );

  // Dados para gráficos - Mover antes do return condicional
  const enrollmentsByTrail = useMemo<ChartData[]>(() => {
    return trails
      .sort((a, b) => {
        const aVal =
          typeof a.inscricoes === "string"
            ? parseInt(a.inscricoes)
            : a.inscricoes || 0;
        const bVal =
          typeof b.inscricoes === "string"
            ? parseInt(b.inscricoes)
            : b.inscricoes || 0;
        return bVal - aVal;
      })
      .slice(0, 5)
      .map((t) => ({
        label: t.name || "Sem nome",
        value:
          typeof t.inscricoes === "string"
            ? parseInt(t.inscricoes)
            : t.inscricoes || 0,
        color: "#233E97",
      }));
  }, [trails]);

  const completionByTrail = useMemo<ChartData[]>(() => {
    return trails
      .filter((t) => {
        const enr =
          typeof t.inscricoes === "string"
            ? parseInt(t.inscricoes)
            : t.inscricoes || 0;
        return enr > 0;
      })
      .sort((a, b) => {
        const aEnr =
          typeof a.inscricoes === "string"
            ? parseInt(a.inscricoes)
            : a.inscricoes || 1;
        const bEnr =
          typeof b.inscricoes === "string"
            ? parseInt(b.inscricoes)
            : b.inscricoes || 1;
        // Sem completed_count, usar 0
        const rateA = (0 / aEnr) * 100;
        const rateB = (0 / bEnr) * 100;
        return rateB - rateA;
      })
      .slice(0, 5)
      .map((t) => {
        const enr =
          typeof t.inscricoes === "string"
            ? parseInt(t.inscricoes)
            : t.inscricoes || 1;
        return {
          label: t.name || "Sem nome",
          value: Math.round((0 / enr) * 100), // Sem completed_count, usar 0
          color: "#10B981",
        };
      });
  }, [trails]);

  const statusDistribution = useMemo<ChartData[]>(() => {
    const published = trails.filter(
      (t) =>
        (t.status || "").toLowerCase() === "ativo" ||
        (t.status || "").toLowerCase() === "publicada",
    ).length;
    const draft = trails.length - published;

    return [
      { label: "Publicadas", value: published, color: "#10B981" },
      { label: "Rascunho", value: draft, color: "#F59E0B" },
    ];
  }, [trails]);

  // Atualizar indicador quando pathname ou links mudarem
  useMemo(() => {
    const updateIndicator = () => {
      const pathname = location.pathname;
      const activeLink = navigationLinks.find(
        (link) => link.visible && link.match(pathname),
      );

      if (!activeLink) {
        setIndicatorStyle({ left: 0, width: 0, opacity: 0 });
        return;
      }

      const btn = navRefs.current[activeLink.key];
      const container = navContainerRef.current;

      if (btn && container) {
        const containerRect = container.getBoundingClientRect();
        const btnRect = btn.getBoundingClientRect();
        const left = btnRect.left - containerRect.left;
        const width = btnRect.width;
        setIndicatorStyle({ left, width, opacity: 1 });
      }
    };

    // Usar requestAnimationFrame para garantir que o DOM está atualizado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateIndicator();
      });
    });

    // Adicionar listener para resize
    const handleResize = () => updateIndicator();
    window.addEventListener("resize", handleResize);

    // Cleanup function
    return () => window.removeEventListener("resize", handleResize);
  }, [location.pathname, navigationLinks]);

  if (!isAdmin) {
    navigate("/trails");
    return null;
  }

  // Componente de gráfico de barras simples
  const BarChart: React.FC<{ data: ChartData[]; maxValue?: number }> = ({
    data,
    maxValue,
  }) => {
    const max = maxValue || Math.max(...data.map((d) => d.value), 1);

    return (
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span
                className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
              >
                {item.label}
              </span>
              <span
                className={`font-bold ${isDark ? "text-gray-200" : "text-gray-900"}`}
              >
                {item.value}
                {maxValue ? "%" : ""}
              </span>
            </div>
            <div
              className={`h-8 rounded-lg ${isDark ? "bg-gray-700" : "bg-gray-200"}`}
            >
              <div
                className="flex h-full items-center justify-end rounded-lg px-2 transition-all duration-500"
                style={{
                  width: `${(item.value / max) * 100}%`,
                  backgroundColor: item.color || "#233E97",
                }}
              >
                {item.value > 0 && (
                  <span className="text-xs font-semibold text-white">
                    {item.value}
                    {maxValue ? "%" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Componente de gráfico de pizza/rosquinha simples
  const PieChart: React.FC<{ data: ChartData[] }> = ({ data }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);

    if (total === 0) {
      return (
        <div
          className={`flex h-64 items-center justify-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
        >
          Sem dados disponíveis
        </div>
      );
    }

    let cumulativePercent = 0;

    return (
      <div className="flex items-center justify-center gap-8">
        <svg
          width="200"
          height="200"
          viewBox="0 0 200 200"
          className="-rotate-90 transform"
        >
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke={isDark ? "#374151" : "#E5E7EB"}
            strokeWidth="40"
          />
          {data.map((item, idx) => {
            const percent = (item.value / total) * 100;
            const strokeDasharray = `${(percent * 502.4) / 100} ${502.4}`;
            const strokeDashoffset = -cumulativePercent * 5.024;
            cumulativePercent += percent;

            return (
              <circle
                key={idx}
                cx="100"
                cy="100"
                r="80"
                fill="none"
                stroke={item.color}
                strokeWidth="40"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="space-y-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded"
                style={{ backgroundColor: item.color }}
              />
              <div className="text-sm">
                <div
                  className={`font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  {item.label}
                </div>
                <div
                  className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}
                >
                  {item.value} ({Math.round((item.value / total) * 100)}%)
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const buttonFocus = `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 ${isDark ? "focus-visible:ring-offset-gray-900" : "focus-visible:ring-offset-white"}`;

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
              {navigationLinks
                .filter((link) => link.visible)
                .map((link) => {
                  const isActive = link.match(window.location.pathname);
                  return (
                    <div key={link.key} className="relative">
                      <button
                        ref={(el) => {
                          navRefs.current[link.key] = el;
                        }}
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
                  Relatórios e Análises
                </h1>
                <p className="mt-1 text-sm text-white/75">
                  Visão geral do desempenho da plataforma e métricas de
                  aprendizagem
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
          {/* Time Range Filter */}
          <div className="mb-6 flex gap-2">
            {[
              { value: "7d", label: "Últimos 7 dias" },
              { value: "30d", label: "Últimos 30 dias" },
              { value: "90d", label: "Últimos 90 dias" },
              { value: "all", label: "Todo período" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() =>
                  setTimeRange(option.value as "7d" | "30d" | "90d" | "all")
                }
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  timeRange === option.value
                    ? "text-white"
                    : isDark
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                }`}
                style={
                  timeRange === option.value
                    ? { backgroundColor: "#233E97" }
                    : undefined
                }
              >
                {option.label}
              </button>
            ))}
          </div>

          {isLoading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                <p
                  className={`mt-4 text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                >
                  Carregando relatórios...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div
                  className={`rounded-xl border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Total de Trilhas
                      </p>
                      <p
                        className={`mt-2 text-3xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                      >
                        {stats.totalTrails}
                      </p>
                      <p
                        className={`mt-1 text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        {stats.publishedTrails} publicadas
                      </p>
                    </div>
                    <div
                      className="rounded-full p-3"
                      style={{ backgroundColor: "#233E9720" }}
                    >
                      <svg
                        className="h-8 w-8"
                        style={{ color: "#233E97" }}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-xl border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Total de Matrículas
                      </p>
                      <p
                        className={`mt-2 text-3xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                      >
                        {stats.totalEnrollments}
                      </p>
                      <p
                        className={`mt-1 text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        {stats.activeUsers} usuários ativos
                      </p>
                    </div>
                    <div className="rounded-full bg-green-500/20 p-3">
                      <svg
                        className="h-8 w-8 text-green-600"
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
                    </div>
                  </div>
                </div>

                <div
                  className={`rounded-xl border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p
                        className={`text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
                      >
                        Taxa de Conclusão
                      </p>
                      <p
                        className={`mt-2 text-3xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                      >
                        {stats.completionRate}%
                      </p>
                      <p
                        className={`mt-1 text-xs ${isDark ? "text-gray-500" : "text-gray-500"}`}
                      >
                        {stats.completedTrails} trilhas concluídas
                      </p>
                    </div>
                    <div className="rounded-full bg-blue-500/20 p-3">
                      <svg
                        className="h-8 w-8 text-blue-600"
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
                    </div>
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid gap-6 lg:grid-cols-2">
                {/* Top 5 Trilhas por Matrículas */}
                <div
                  className={`rounded-xl border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
                >
                  <h3
                    className={`mb-6 text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                  >
                    Top 5 Trilhas por Matrículas
                  </h3>
                  {enrollmentsByTrail.length > 0 ? (
                    <BarChart data={enrollmentsByTrail} />
                  ) : (
                    <div
                      className={`flex h-64 items-center justify-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Nenhuma trilha com matrículas
                    </div>
                  )}
                </div>

                {/* Top 5 Trilhas por Taxa de Conclusão */}
                <div
                  className={`rounded-xl border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
                >
                  <h3
                    className={`mb-6 text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                  >
                    Top 5 Trilhas por Taxa de Conclusão
                  </h3>
                  {completionByTrail.length > 0 ? (
                    <BarChart data={completionByTrail} maxValue={100} />
                  ) : (
                    <div
                      className={`flex h-64 items-center justify-center text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
                    >
                      Nenhuma trilha com conclusões
                    </div>
                  )}
                </div>

                {/* Distribuição de Status das Trilhas */}
                <div
                  className={`rounded-xl border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
                >
                  <h3
                    className={`mb-6 text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                  >
                    Status das Trilhas
                  </h3>
                  <PieChart data={statusDistribution} />
                </div>

                {/* Métricas Rápidas */}
                <div
                  className={`rounded-xl border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
                >
                  <h3
                    className={`mb-6 text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                  >
                    Métricas Gerais
                  </h3>
                  <div className="space-y-4">
                    <div
                      className="flex items-center justify-between border-b pb-4"
                      style={{ borderColor: isDark ? "#374151" : "#E5E7EB" }}
                    >
                      <div>
                        <p
                          className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          Média de Módulos por Trilha
                        </p>
                        <p
                          className={`mt-1 text-2xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                        >
                          {trails.length > 0
                            ? Math.round(
                                trails.reduce(
                                  (acc, t) => acc + (t.modulesCount || 0),
                                  0,
                                ) / trails.length,
                              )
                            : 0}
                        </p>
                      </div>
                      <div className="rounded-full bg-purple-500/20 p-3">
                        <svg
                          className="h-6 w-6 text-purple-600"
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
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-between border-b pb-4"
                      style={{ borderColor: isDark ? "#374151" : "#E5E7EB" }}
                    >
                      <div>
                        <p
                          className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          Média de Matrículas por Trilha
                        </p>
                        <p
                          className={`mt-1 text-2xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                        >
                          {trails.length > 0
                            ? Math.round(stats.totalEnrollments / trails.length)
                            : 0}
                        </p>
                      </div>
                      <div className="rounded-full bg-orange-500/20 p-3">
                        <svg
                          className="h-6 w-6 text-orange-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p
                          className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          Trilhas Ativas
                        </p>
                        <p
                          className={`mt-1 text-2xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                        >
                          {stats.publishedTrails}
                        </p>
                      </div>
                      <div className="rounded-full bg-teal-500/20 p-3">
                        <svg
                          className="h-6 w-6 text-teal-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Export Actions */}
              <div className="mt-8 flex justify-end gap-3">
                <button
                  className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${isDark ? "border-gray-600 bg-gray-800 text-gray-300 hover:bg-gray-700" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"}`}
                >
                  <div className="flex items-center gap-2">
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
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Exportar CSV
                  </div>
                </button>
                <button
                  className="rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
                  style={{ backgroundColor: "#233E97" }}
                >
                  <div className="flex items-center gap-2">
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
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    Exportar PDF
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
