import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import { getUserEnrollments } from "../services/progressService";
import { useTrails, type Trail } from "../contexts/TrailsContext";
import { useProgress } from "../contexts/ProgressContext";

export default function PersonalPanelAprendiz() {
  const stored = authService.getStoredUser();
  const navigate = useNavigate();
  const location = useLocation();
  // minimal display fields for the learner panel
  const displayName =
    (stored as any)?.first_name ||
    (stored as any)?.firstName ||
    stored?.username ||
    "Usuário";
  const displayEmail = stored?.email || "";
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  type SideNavLink = {
    key: string;
    label: string;
    path: string;
    ariaLabel: string;
    match: (value: string) => boolean;
  };

  const navLinks: SideNavLink[] = useMemo(
    () => [
      {
        key: "painel-aprendiz",
        label: "Meu painel",
        path: "/painel-aprendiz",
        ariaLabel: "Ir para painel do aprendiz",
        match: (value: string) =>
          value === "/painel-aprendiz" || value.startsWith("/painel-aprendiz/"),
      },
      {
        key: "painel",
        label: "Meu perfil",
        path: "/painel",
        ariaLabel: "Ir para meu perfil",
        match: (value: string) =>
          value === "/painel" || value.startsWith("/painel/"),
      },
      {
        key: "certificados",
        label: "Certificados",
        path: "/certificados",
        ariaLabel: "Ver certificados",
        match: (value: string) => value.startsWith("/certificados"),
      },
      {
        key: "meu-aprendizado",
        label: "Meu histórico de aprendizado",
        path: "/meu-aprendizado",
        ariaLabel: "Ver meu histórico de aprendizado",
        match: (value: string) => value.startsWith("/meu-aprendizado"),
      },
    ],
    [],
  );

  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({
    height: 0,
    top: 0,
    opacity: 0,
  });

  // Aprendiz-specific state
  const { trails } = useTrails();
  const { userProgress, getUserProgress, saveProgress } = useProgress();
  const [enrolledIds, setEnrolledIds] = useState<Record<number, boolean>>({});
  const [selectedTrailId, setSelectedTrailId] = useState<number | null>(
    trails?.[0]?.id || null,
  );
  const [notifications, setNotifications] = useState<
    Array<{ id: string; text: string; when?: string }>
  >([]);
  const [activeTab, setActiveTab] = useState<
    "contents" | "quizzes" | "certificate"
  >("contents");

  // Initialize avatar preview once on mount from stored user (do not override
  // temporary previews created by file selection). Reading stored user here
  // ensures this runs only on mount and not on every render (avoids flashy
  // overwrite when user selects a new image).
  useEffect(() => {
    try {
      const s = authService.getStoredUser();
      const av = (s as any)?.avatar || (s as any)?.avatar_url || null;
      if (av) setAvatarPreview(av);
    } catch (err) {
      console.warn("Could not read stored avatar", err);
    }
  }, []);

  const handleAvatarClick = useCallback(() => {
    if (fileInputRef.current) fileInputRef.current.click();
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // preview locally
    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(String(reader.result));
    reader.readAsDataURL(f);

    // attempt to upload if service supports it
    try {
      if ((authService as any).uploadAvatar) {
        await (authService as any).uploadAvatar(f);
        // refresh stored user after upload
        const s = authService.getStoredUser();
        const av = (s as any)?.avatar || (s as any)?.avatar_url || null;
        if (av) setAvatarPreview(av);
      }
    } catch (err) {
      console.warn("Avatar upload failed", err);
    }
  };

  // initialize selected trail when trails load
  useEffect(() => {
    if (!selectedTrailId && trails && trails.length) {
      // prefer first enrolled trail if available
      const firstEnrolled = trails.find((t) => enrolledIds[t.id]);
      setSelectedTrailId(firstEnrolled?.id || trails[0].id);
    }
  }, [trails, enrolledIds, selectedTrailId]);

  // load user enrollments so we only show enrolled trails in Minhas Trilhas
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const user = authService.getStoredUser();
        if (!user) return;
        const enrollments = await getUserEnrollments();
        const map: Record<number, boolean> = {};
        enrollments.forEach((e: { trail_id: number }) => {
          map[e.trail_id] = true;
        });
        if (mounted) setEnrolledIds(map);
      } catch (err) {
        console.warn(
          "Could not load user enrollments for PersonalPanelAprendiz",
          err,
        );
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // Build simple notifications based on deadlines and incomplete materials
  // Only include notifications for trails the user is enrolled in (enrolledIds)
  useEffect(() => {
    try {
      const user = authService.getStoredUser();
      const uid = user?.id;
      if (!uid) return;
      const notes: Array<{ id: string; text: string; when?: string }> = [];
      // filter to enrolled trails only
      const myTrails = (trails || []).filter((t) => enrolledIds[t.id]);
      for (const t of myTrails) {
        const prog = getUserProgress(uid, t.id);
        if (!prog || prog.overallProgress < 100) {
          if (t.deadline) {
            notes.push({
              id: `deadline-${t.id}`,
              text: `Prazo para concluir "${t.name}" em ${t.deadline}`,
              when: t.deadline,
            });
          }
          // add one reminder per trail
          notes.push({
            id: `incomplete-${t.id}`,
            text: `Você tem atividades pendentes na trilha "${t.name}"`,
          });
        }
      }
      setNotifications(notes.slice(0, 6));
    } catch (err) {
      console.warn("Could not build notifications", err);
    }
  }, [trails, userProgress, enrolledIds, getUserProgress]);

  useEffect(() => {
    const { pathname } = location;
    const updateIndicator = () => {
      const activeLink = navLinks.find((link) => link.match(pathname));
      const container = navContainerRef.current;
      const buttonRef = activeLink ? navRefs.current[activeLink.key] : null;

      if (container && buttonRef) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = buttonRef.getBoundingClientRect();

        setIndicatorStyle({
          height: buttonRect.height,
          top: buttonRect.top - containerRect.top,
          opacity: 1,
        });
      } else {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [location, navLinks]);

  // Helper: user id
  const getUserId = () => (authService.getStoredUser() as any)?.id || null;

  const getTrailProgressPercent = (trail: Trail) => {
    const uid = getUserId();
    if (!uid) return 0;
    const p = getUserProgress(uid, trail.id);
    return p ? Math.round(p.overallProgress) : 0;
  };

  const handleMarkRead = (
    trailId: number,
    moduleIndex: number,
    materialIndex: number,
  ) => {
    const uid = getUserId();
    if (!uid) return;
    // Save 100% progress for the material
    saveProgress(uid, trailId, moduleIndex, materialIndex, 100);
  };

  const collectQuizzes = () => {
    const list: Array<{
      trail: Trail;
      moduleIndex: number;
      materialIndex: number;
      material: any;
    }> = [];
    trails.forEach((t) => {
      (t.modules || []).forEach((m: any, mi: number) => {
        (m.materials || []).forEach((mat: any, mbi: number) => {
          if ((mat as any).type === "quiz")
            list.push({
              trail: t,
              moduleIndex: mi,
              materialIndex: mbi,
              material: mat,
            });
        });
      });
    });
    return list;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-6 lg:grid-cols-3">
        {/* Left column - profile card */}
        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-lg lg:sticky lg:top-6">
          <div className="mb-6 h-36 overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="-mt-14 mb-4 flex flex-col items-center">
            <div className="relative">
              <button
                type="button"
                onClick={handleAvatarClick}
                aria-label="Alterar avatar"
                className="flex h-28 w-28 transform items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-3xl font-bold text-white shadow-lg ring-4 ring-white transition-transform hover:scale-105 focus:outline-none"
              >
                {avatarPreview ? (
                  // show image preview if available
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                    {(stored?.username || "U").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </button>
              {/* clickable edit overlay */}
              <div className="absolute -right-1 -bottom-1 rounded-full border bg-white p-1 shadow">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.465.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.465l9.9-9.9a2 2 0 012.828 0z" />
                </svg>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              {displayName}
            </h3>
            <div className="mt-1 text-sm text-gray-500">{displayEmail}</div>
          </div>

          <div className="mt-6 border-t pt-4">
            <nav
              ref={navContainerRef}
              className="profile-nav relative space-y-2 text-sm"
            >
              {navLinks.map((link) => {
                const isActive = link.match(location.pathname);
                return (
                  <div key={link.key} className="relative">
                    <button
                      ref={(el) => (navRefs.current[link.key] = el)}
                      onClick={() => navigate(link.path)}
                      className={`block w-full rounded px-2 py-2 text-left text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white focus:outline-none ${isActive ? "bg-blue-50 font-semibold text-gray-900" : ""}`}
                      style={{
                        opacity: isActive ? 1 : 0.92,
                        transition:
                          "background-color 200ms ease, opacity 200ms ease",
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
                className="pointer-events-none absolute left-0 w-1.5 rounded-full bg-blue-600"
                style={{
                  top: 0,
                  height:
                    indicatorStyle.height > 0
                      ? `${indicatorStyle.height}px`
                      : "0px",
                  opacity: indicatorStyle.opacity,
                  boxShadow:
                    indicatorStyle.opacity > 0
                      ? "0 0 10px 1px rgba(59, 130, 246, 0.5)"
                      : "none",
                  transform: `translateY(${indicatorStyle.top}px)`,
                  transition:
                    "transform 260ms ease, height 200ms ease, opacity 160ms ease, box-shadow 160ms ease",
                  willChange: "transform, height",
                }}
              ></div>
              <button
                onClick={() => {
                  authService.logout();
                  navigate("/login");
                }}
                className="mt-2 w-full rounded px-2 py-2 text-left text-red-600 transition-all duration-200 hover:bg-red-50 focus:ring-2 focus:ring-red-400 focus:ring-offset-2 focus:ring-offset-white focus:outline-none"
              >
                Sair
              </button>
            </nav>
          </div>
        </div>

        {/* Right column - Aprendiz dashboard */}
        <div className="space-y-6 rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Painel do Aprendiz
              </h2>
              <div className="text-sm text-gray-500">
                Centralize sua jornada: acompanhe progresso, acesse atividades e
                veja recomendações
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/aprendiz")}
                className="rounded-md border border-gray-200 px-3 py-1 text-sm"
              >
                Ir para Home
              </button>
            </div>
          </div>

          {/* Top summary: progresso geral e recomendações */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-gray-100 bg-gray-50 p-5">
              <div className="text-xs text-gray-600">Progresso geral</div>
              <div className="mt-2 flex items-center gap-4">
                <div className="text-3xl font-bold text-blue-600">
                  {(() => {
                    const uid = getUserId();
                    if (!uid || !trails || trails.length === 0) return "0%";
                    const sums = trails.map(
                      (t) => getUserProgress(uid, t.id)?.overallProgress || 0,
                    );
                    const avg = Math.round(
                      sums.reduce((a, b) => a + b, 0) / (sums.length || 1),
                    );
                    return `${avg}%`;
                  })()}
                </div>
                <button
                  onClick={() => setSelectedTrailId(trails?.[0]?.id || null)}
                  className="rounded border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700"
                >
                  Ver minhas trilhas
                </button>
              </div>
            </div>
            <div className="rounded-lg border border-gray-100 bg-white p-3 md:col-span-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium text-gray-800">
                  Recomendações
                </div>
                <div className="text-xs text-gray-400">Sugestões rápidas</div>
              </div>
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                {(() => {
                  const uid = getUserId();
                  if (!uid)
                    return (
                      <li className="text-gray-500">
                        Faça login para ver recomendações
                      </li>
                    );
                  // recommend first incomplete materials (keeps same logic)
                  const items: string[] = [];
                  for (const t of trails) {
                    const p = getUserProgress(uid, t.id);
                    if (!p || p.overallProgress < 100) {
                      // shorten the displayed sentence to keep card compact
                      items.push(
                        `Continue "${t.name}" — ${Math.round(p?.overallProgress || 0)}%`,
                      );
                    }
                    if (items.length >= 3) break;
                  }
                  if (items.length === 0)
                    return (
                      <li className="text-gray-500">
                        Parabéns — suas trilhas estão concluídas
                      </li>
                    );

                  return items.map((it, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-xs text-blue-600">
                        ✓
                      </span>
                      <span className="truncate text-sm text-gray-800">
                        {it}
                      </span>
                    </li>
                  ));
                })()}
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Minhas Trilhas */}
            <section className="space-y-4 overflow-hidden rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-1">
                <h3 className="text-base font-medium text-gray-800">
                  Minhas Trilhas
                </h3>
                <div className="text-sm text-gray-500">
                  Acesso rápido às atividades
                </div>
              </div>

              <div className="space-y-3">
                {(() => {
                  const myTrails = (trails || []).filter(
                    (t) => enrolledIds[t.id],
                  );
                  return myTrails && myTrails.length ? (
                    myTrails.map((t) => (
                      <div
                        key={t.id}
                        className={`flex w-full items-center justify-between gap-4 py-3 ${selectedTrailId === t.id ? "rounded bg-blue-50 p-3" : "px-2"}`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-sm font-semibold text-gray-800">
                            {(t.name || "").slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="truncate font-medium text-gray-800">
                              {t.name}
                            </div>
                            <div className="mt-1 text-xs text-gray-500">
                              {t.modules?.length || 0} fases
                            </div>
                            <div className="mt-2 h-2 w-44 max-w-full rounded-full bg-gray-100">
                              <div
                                className="h-2 rounded-full bg-blue-600"
                                style={{
                                  width: `${getTrailProgressPercent(t)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-shrink-0 flex-col items-center gap-2 sm:flex-row">
                          <button
                            onClick={() => navigate(`/trail/${t.id}`)}
                            className="rounded border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                          >
                            Acessar
                          </button>
                          <button
                            onClick={() => setSelectedTrailId(t.id)}
                            className="rounded bg-blue-600 px-3 py-1 text-xs text-white"
                          >
                            Selecionar
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-gray-500">
                      Você não está inscrito em nenhuma trilha
                    </div>
                  );
                })()}
              </div>
            </section>

            {/* Tabbed area: modern floating tabs above card */}
            <div className="relative">
              {/* Floating tabs */}
              <div className="-mt-6 mb-2 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="inline-flex space-x-2 rounded-full bg-white/60 px-2 py-1 shadow-sm backdrop-blur">
                    <button
                      onClick={() => setActiveTab("contents")}
                      role="tab"
                      aria-selected={activeTab === "contents"}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition ${activeTab === "contents" ? "bg-blue-600 text-white shadow" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      Conteúdos
                    </button>
                    <button
                      onClick={() => setActiveTab("quizzes")}
                      role="tab"
                      aria-selected={activeTab === "quizzes"}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition ${activeTab === "quizzes" ? "bg-blue-600 text-white shadow" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      Quizzes
                    </button>
                    <button
                      onClick={() => setActiveTab("certificate")}
                      role="tab"
                      aria-selected={activeTab === "certificate"}
                      className={`rounded-full px-3 py-1 text-sm font-medium transition ${activeTab === "certificate" ? "bg-blue-600 text-white shadow" : "text-gray-700 hover:bg-gray-100"}`}
                    >
                      Certificado
                    </button>
                  </div>
                </div>
              </div>

              {/* Card below aligned with tabs */}
              <div className="rounded-lg border border-gray-100 bg-white p-4 pt-8 shadow-sm">
                {activeTab === "contents" && (
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Conteúdos Disponíveis</h3>
                      <div className="text-sm text-gray-500">
                        Listagem de módulos e materiais
                      </div>
                    </div>
                    <div className="mt-3 space-y-3 text-sm">
                      {(() => {
                        const sel = trails.find(
                          (tr) => tr.id === selectedTrailId,
                        );
                        if (!sel)
                          return (
                            <div className="text-gray-500">
                              Selecione uma trilha à esquerda
                            </div>
                          );
                        return sel.modules && sel.modules.length ? (
                          <div className="space-y-3">
                            {sel.modules.map((m: any, mi: number) => (
                              <div key={mi} className="p-2">
                                <div className="truncate font-medium text-gray-800">
                                  {m.title || m.name || `Fase ${mi + 1}`}
                                </div>
                                <div className="mt-2 space-y-2">
                                  {(m.materials || []).map(
                                    (mat: any, mbi: number) => (
                                      <div
                                        key={mbi}
                                        className="flex w-full items-center justify-between border-b border-gray-100 py-2 last:border-b-0"
                                      >
                                        <div className="flex min-w-0 items-center gap-3">
                                          <div className="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs">
                                            {mat.type === "video"
                                              ? "▶"
                                              : mat.type === "pdf"
                                                ? "📄"
                                                : mat.type === "quiz"
                                                  ? "✎"
                                                  : "•"}
                                          </div>
                                          <div className="truncate text-gray-700">
                                            {mat.title ||
                                              mat.name ||
                                              `Material ${mbi + 1}`}
                                          </div>
                                        </div>
                                        <div className="flex flex-shrink-0 items-center gap-2">
                                          <button
                                            onClick={() =>
                                              navigate(`/trail/${sel.id}`)
                                            }
                                            className="rounded border border-gray-200 bg-white px-2 py-1 text-xs whitespace-nowrap text-gray-700"
                                          >
                                            Abrir
                                          </button>
                                          <button
                                            onClick={() =>
                                              handleMarkRead(sel.id, mi, mbi)
                                            }
                                            className="rounded border border-green-100 bg-green-50 px-2 py-1 text-xs whitespace-nowrap text-green-700"
                                          >
                                            Marcar como lido
                                          </button>
                                        </div>
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500">
                            Esta trilha não possui módulos cadastrados
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {activeTab === "quizzes" && (
                  <div>
                    <h3 className="font-medium">Meus Quizzes</h3>
                    <div className="mt-3 space-y-2 text-sm">
                      {collectQuizzes().length ? (
                        collectQuizzes().map((q, i) => {
                          const uid = getUserId();
                          const prog = uid
                            ? getUserProgress(uid, q.trail.id)
                            : undefined;
                          const moduleProg = prog?.modulesProgress?.find(
                            (mp: any) => mp.moduleId === q.moduleIndex,
                          );
                          const matProg = moduleProg?.materialsProgress?.find(
                            (mp: any) => mp.materialId === q.materialIndex,
                          );
                          return (
                            <div
                              key={i}
                              className="flex items-center justify-between"
                            >
                              <div>
                                <div className="font-medium">
                                  {q.material.title ||
                                    q.material.name ||
                                    "Quiz"}
                                </div>
                                <div className="text-xs text-gray-500">
                                  {q.trail.name} — Tentativas:{" "}
                                  {matProg?.attempts || 0} — Nota:{" "}
                                  {matProg?.score ?? "—"}
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() =>
                                    navigate(`/trail/${q.trail.id}`)
                                  }
                                  className="rounded border border-gray-200 bg-white px-3 py-1 text-xs text-gray-700 hover:bg-gray-50"
                                >
                                  Ir para quiz
                                </button>
                                <button
                                  onClick={() =>
                                    navigate(`/trail/${q.trail.id}`)
                                  }
                                  className="rounded border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs text-yellow-700 hover:bg-yellow-100"
                                >
                                  Refazer
                                </button>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-gray-500">
                          Nenhum quiz encontrado
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === "certificate" && (
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Certificado</h3>
                      <div className="text-sm text-gray-500">
                        Disponível após conclusão de todos os módulos
                      </div>
                    </div>
                    <div>
                      {(() => {
                        const sel = trails.find(
                          (tr) => tr.id === selectedTrailId,
                        );
                        if (!sel)
                          return (
                            <button
                              className="rounded bg-gray-100 px-3 py-2 text-sm"
                              disabled
                            >
                              Selecionar trilha
                            </button>
                          );
                        const prog = getUserProgress(getUserId() || 0, sel.id);
                        const done = prog?.overallProgress === 100;
                        return done ? (
                          <button
                            onClick={() => {
                              const content = `Certificado de conclusão - ${sel.name}\nConcluído por ${(stored as any)?.username || "Usuário"}`;
                              const blob = new Blob([content], {
                                type: "text/plain",
                              });
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement("a");
                              a.href = url;
                              a.download = `${sel.name.replace(/\s+/g, "_")}_certificado.txt`;
                              document.body.appendChild(a);
                              a.click();
                              a.remove();
                              URL.revokeObjectURL(url);
                            }}
                            className="rounded bg-blue-600 px-3 py-2 text-white"
                          >
                            Baixar certificado
                          </button>
                        ) : (
                          <button
                            className="rounded bg-gray-100 px-3 py-2 text-sm"
                            disabled
                          >
                            Certificado indisponível
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mensagens / Notificações */}
          <div className="rounded-lg border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Mensagens / Notificações</h3>
              <div className="text-sm text-gray-500">Lembretes automáticos</div>
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {notifications && notifications.length ? (
                notifications.map((n) => (
                  <li key={n.id} className="flex items-center justify-between">
                    <div>{n.text}</div>
                    <div className="text-xs text-gray-400">{n.when || ""}</div>
                  </li>
                ))
              ) : (
                <li className="text-gray-500">Nenhuma notificação</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
