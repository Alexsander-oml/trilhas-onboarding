import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import NotificationPanel from "./NotificationPanel";
import FAURGLogo from "../assets/FAURG-logo-horizontal-reduzida.png";
import { authService } from "../services/authService";
import { progressService } from "../services/progressService";
import { useTrails, type Trail } from "../contexts/TrailsContext";
import { useProgress } from "../contexts/ProgressContext";
import { useTheme } from "../contexts/ThemeContext";

export default function MyLearning() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname } = location;
  const [enrollments, setEnrollments] = useState<
    Array<{
      id: number;
      trail_id: number;
      created_at: string;
      progress?: number;
    }>
  >([]);
  const [loading, setLoading] = useState(false);
  const { trails } = useTrails();
  const { getUserProgress } = useProgress();
  const { isDark, toggleTheme } = useTheme();

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
        path: "/aprendiz",
        ariaLabel: "Ir para página inicial",
        match: (value: string) =>
          value.startsWith("/aprendiz") || value.startsWith("/meu-aprendizado"),
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
    [],
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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await progressService.getUserEnrollments();
        setEnrollments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.warn("Failed to load enrollments", err);
        setEnrollments([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const storedUser = authService.getStoredUser();
  const displayName = storedUser?.firstName
    ? `${storedUser.firstName} ${storedUser.lastName || ""}`.trim()
    : storedUser?.username || "Usuário";
  const pageClass = isDark
    ? "bg-gray-900 text-gray-100"
    : "bg-gray-50 text-gray-900";
  const cardClass = `p-6 rounded-lg shadow-sm ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white"}`;
  const subtleText = isDark ? "text-gray-400" : "text-gray-600";
  const borderBox = `border rounded ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`;

  return (
    <div className={`min-h-screen font-sans ${pageClass}`}>
      <header
        className="relative z-40 font-semibold shadow-md"
        style={{
          backgroundColor: isDark ? "#0f172a" : "#233E97",
          height: "64px",
        }}
      >
        <div className="w-full px-8">
          <div className="flex h-full items-end justify-between pb-2">
            <div className="mt-2 ml-6 flex items-center" />

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
                      className={`flex cursor-pointer items-center rounded-md px-4 py-4 text-sm font-semibold transition-all duration-300 ease-out hover:scale-105 hover:brightness-125 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900 focus:outline-none md:text-base ${isActive ? "opacity-100" : "opacity-85"}`}
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

            <div className="mt-2 flex items-center space-x-4">
              <button
                onClick={toggleTheme}
                className={`h-9 w-9 rounded-full border text-sm font-semibold transition-all ${isDark ? "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700" : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"}`}
                title="Alternar tema"
              >
                {isDark ? "☾" : "☀"}
              </button>
              <NotificationPanel />
              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>

      <div
        className="relative w-full overflow-hidden shadow-md"
        style={{
          backgroundColor: isDark ? "#0f172a" : "#233E97",
          height: "220px",
        }}
      >
        <div
          className={`absolute top-0 left-0 flex h-full items-center rounded-r-full ${isDark ? "bg-gray-800" : "bg-white"}`}
          style={{ width: "30%", paddingLeft: "24px" }}
        >
          <img
            src={FAURGLogo}
            alt="FAURG Logo"
            className="object-contain"
            style={{ height: "70%", maxWidth: "70%" }}
          />
        </div>
        <div
          className="absolute top-0 right-0 flex h-full items-center justify-end pr-12"
          style={{ width: "60%" }}
        >
          <div className="text-right">
            <h1 className="text-3xl leading-tight font-bold text-white md:text-4xl lg:text-5xl">
              MEU APRNDIZADO
            </h1>
          </div>
        </div>
      </div>

      <div className="w-full px-6 pt-12 pb-8">
        <div className="mx-auto max-w-6xl">
          <div className={cardClass}>
            <h2 className="mb-2 text-2xl font-bold">Resumo do Aprendizado</h2>
            <p className={`mb-4 ${subtleText}`}>
              Acompanhe seu progresso, retome atividades e baixe certificados.
            </p>

            {loading && <div>Carregando inscrições...</div>}

            {!loading && enrollments.length === 0 && (
              <div className="text-gray-500">Nenhuma inscrição encontrada.</div>
            )}

            {/* Summary cards */}
            {!loading && enrollments.length > 0 && (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {(() => {
                  const total = enrollments.length;
                  const completed = enrollments.filter(
                    (e) => (e.progress || 0) >= 100,
                  ).length;
                  const avg = Math.round(
                    enrollments.reduce((s, e) => s + (e.progress || 0), 0) /
                      (enrollments.length || 1),
                  );
                  return (
                    <>
                      <div className={`flex flex-col p-4 ${borderBox}`}>
                        <div className={`text-sm ${subtleText}`}>
                          Trilhas inscritas
                        </div>
                        <div className="mt-2 text-2xl font-bold">{total}</div>
                      </div>
                      <div className={`flex flex-col p-4 ${borderBox}`}>
                        <div className={`text-sm ${subtleText}`}>
                          Concluídas
                        </div>
                        <div className="mt-2 text-2xl font-bold">
                          {completed}
                        </div>
                      </div>
                      <div className={`flex flex-col p-4 ${borderBox}`}>
                        <div className={`text-sm ${subtleText}`}>
                          Progresso médio
                        </div>
                        <div className="mt-2 text-2xl font-bold">{avg}%</div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Trilhas em andamento */}
            {!loading && enrollments.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 font-medium">Trilhas em andamento</h3>
                <div className="space-y-3">
                  {enrollments.map((e) => {
                    const trail = trails.find((t) => t.id === e.trail_id) as
                      | Trail
                      | undefined;
                    const prog = getUserProgress
                      ? getUserProgress(storedUser?.id || 0, e.trail_id)
                      : undefined;
                    const pct = prog?.overallProgress ?? e.progress ?? 0;
                    return (
                      <div
                        key={e.id}
                        className={`flex flex-col gap-3 rounded p-3 md:flex-row md:items-center md:justify-between ${isDark ? "border border-gray-700 bg-gray-800" : "border border-gray-200 bg-white"}`}
                      >
                        <div className="min-w-0">
                          <div
                            className={`truncate font-medium ${isDark ? "text-gray-100" : "text-gray-800"}`}
                          >
                            {trail?.name || `Trilha #${e.trail_id}`}
                          </div>
                          <div className={`text-xs ${subtleText}`}>
                            Inscrito em{" "}
                            {new Date(e.created_at).toLocaleDateString()}
                          </div>
                          <div
                            className={`mt-2 h-2 w-full rounded ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                          >
                            <div
                              className="h-2 rounded bg-blue-600"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex flex-shrink-0 items-center gap-2">
                          <button
                            onClick={() => navigate(`/trail/${e.trail_id}`)}
                            className={`rounded border px-3 py-1 text-sm ${isDark ? "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700" : "border-gray-200 bg-white hover:bg-gray-50"}`}
                          >
                            Continuar
                          </button>
                          <button
                            onClick={() =>
                              navigate("/certificados", {
                                state: { from: location.pathname },
                              })
                            }
                            className={`rounded border px-3 py-1 text-sm ${isDark ? "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700" : "border-gray-200 bg-gray-50 hover:bg-white"}`}
                          >
                            Certificados
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Próximos prazos */}
            {!loading && enrollments.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 font-medium">Próximos prazos</h3>
                <div className="space-y-2">
                  {(() => {
                    const now = Date.now();
                    const deadlines = enrollments
                      .map((e) => trails.find((t) => t.id === e.trail_id))
                      .filter((t): t is Trail => !!t && !!t.deadline)
                      .map((t) => ({
                        id: t.id,
                        name: t.name,
                        deadline: t.deadline!,
                      }))
                      .filter((d) => new Date(d.deadline).getTime() >= now)
                      .sort(
                        (a, b) =>
                          new Date(a.deadline).getTime() -
                          new Date(b.deadline).getTime(),
                      )
                      .slice(0, 3);
                    if (!deadlines.length)
                      return (
                        <div className={`text-sm ${subtleText}`}>
                          Nenhum prazo próximo
                        </div>
                      );
                    return deadlines.map((d) => (
                      <div
                        key={d.id}
                        className={`flex items-center justify-between rounded p-3 ${isDark ? "border border-gray-700 bg-gray-800" : "border border-gray-200 bg-white"}`}
                      >
                        <div>
                          <div
                            className={`font-medium ${isDark ? "text-gray-100" : "text-gray-800"}`}
                          >
                            {d.name}
                          </div>
                          <div className={`text-xs ${subtleText}`}>
                            Prazo: {new Date(d.deadline).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          {Math.ceil(
                            (new Date(d.deadline).getTime() - now) /
                              (1000 * 60 * 60 * 24),
                          )}{" "}
                          dias
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* Atividades recentes (placeholder baseado em materiais das trilhas) */}
            {!loading && enrollments.length > 0 && (
              <div className="mb-6">
                <h3 className="mb-3 font-medium">Atividades recentes</h3>
                <div className="space-y-2">
                  {(() => {
                    const items: Array<{
                      trailName: string;
                      title: string;
                      type?: string;
                    }> = [];
                    for (const e of enrollments) {
                      const t = trails.find((tt) => tt.id === e.trail_id);
                      if (!t) continue;
                      for (const m of t.modules || []) {
                        for (const mat of m.materials || []) {
                          items.push({
                            trailName: t.name,
                            title: mat.title || mat.name || "Material",
                            type: mat.type,
                          });
                          if (items.length >= 6) break;
                        }
                        if (items.length >= 6) break;
                      }
                      if (items.length >= 6) break;
                    }
                    if (!items.length)
                      return (
                        <div className={`text-sm ${subtleText}`}>
                          Nenhuma atividade recente
                        </div>
                      );
                    return items.map((it, i) => (
                      <div
                        key={i}
                        className={`flex items-center justify-between rounded p-3 ${isDark ? "border border-gray-700 bg-gray-800" : "border border-gray-200 bg-white"}`}
                      >
                        <div>
                          <div
                            className={`font-medium ${isDark ? "text-gray-100" : "text-gray-800"}`}
                          >
                            {it.title}
                          </div>
                          <div className={`text-xs ${subtleText}`}>
                            {it.trailName} — {it.type || "material"}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">Agora</div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                onClick={() => navigate("/trails")}
                className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Ver catálogo
              </button>
              <button
                onClick={() => navigate("/painel")}
                className={`rounded px-4 py-2 ${isDark ? "border border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700" : "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"}`}
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
