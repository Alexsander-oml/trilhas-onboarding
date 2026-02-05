import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import MaterialViewer from "./MaterialViewer";
import ProfileMenu from "./ProfileMenu";
import { authService } from "../services/authService";
import { trailService } from "../services/trailService";
import { progressService } from "../services/progressService";
import {
  enrollmentService,
  type EnrollmentStatus,
} from "../services/enrollmentService";

// Tipagens mínimas (ajuste se já houver tipagem compartilhada)
type Material = { id: number; name: string; type: string };
type Module = { id: number; name: string; materials: Material[] };

const TrailViewer: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [trail, setTrail] = useState<any>(undefined);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [currentMaterialIndex, setCurrentMaterialIndex] = useState(0);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [collapsedModules, setCollapsedModules] = useState<Set<number>>(
    new Set(),
  );
  const [completedMaterials, setCompletedMaterials] = useState<Set<string>>(
    new Set(),
  );

  // Estados para controle de visualização e status da matrícula
  const [enrollmentStatus, setEnrollmentStatus] =
    useState<EnrollmentStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [showRefazerModal, setShowRefazerModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const storedUser = authService.getStoredUser?.();
  const userId =
    (storedUser as any)?.id ??
    (storedUser as any)?.userId ??
    (storedUser as any)?.sub ??
    "guest";

  // Busca real da trilha e dos módulos
  // Patch para TrailViewer - Linhas 38-74
  // Substitua o useEffect existente por este código

  // Busca real da trilha e dos módulos
  useEffect(() => {
    let isMounted = true;

    async function fetchTrail() {
      if (!id) return;
      setIsBootstrapping(true);
      try {
        // Tentar buscar versão detalhada primeiro
        let trailData;
        try {
          trailData = await trailService.getDetailedTrailById(Number(id));
          console.log("📊 Dados DETALHADOS da trilha:", trailData);
        } catch (detailErr) {
          console.log("⚠️ Endpoint detalhado não disponível, usando padrão");
          trailData = await trailService.getTrailById(Number(id));
          console.log("📊 Dados da trilha recebidos:", trailData);
        }

        // Se os módulos não têm materials, tentar extrair do changelog
        let processedModules = trailData?.modules ?? [];
        if (processedModules.length > 0 && !processedModules[0]?.materials) {
          console.log(
            "⚠️ Módulos sem materials, tentando extrair do changelog",
          );
          if (trailData?.changelog) {
            try {
              const changelogData =
                typeof trailData.changelog === "string"
                  ? JSON.parse(trailData.changelog)
                  : trailData.changelog;
              console.log("📋 Changelog processado:", changelogData);
              if (changelogData?.modules) {
                // Mapear os materiais do changelog para os módulos E buscar id_atividade do backend
                processedModules = await Promise.all(
                  processedModules.map(async (mod: any, index: number) => {
                    const changelogModule = changelogData.modules[index];
                    let materials = changelogModule?.materials || [];

                    // Para cada material tipo quiz, buscar o id_atividade real do backend
                    if (materials.length > 0) {
                      materials = await Promise.all(
                        materials.map(async (mat: any) => {
                          // Se for quiz e não tem id_atividade, buscar do backend
                          if (mat.type === "quiz" && !mat.id_atividade) {
                            try {
                              // Buscar atividades do módulo
                              const token =
                                localStorage.getItem("authToken") ||
                                localStorage.getItem("access_token");
                              const response = await fetch(
                                `http://localhost:8000/api/modulos/${mod.id_modulo}/atividades/`,
                                {
                                  headers: {
                                    Authorization: `Bearer ${token}`,
                                    "Content-Type": "application/json",
                                  },
                                },
                              );

                              if (response.ok) {
                                const atividades = await response.json();
                                // Procurar a atividade que corresponde ao quiz
                                const atividadeQuiz = atividades.find(
                                  (a: any) =>
                                    a.titulo === mat.name ||
                                    (a.quiz &&
                                      (a.quiz.titulo === mat.name ||
                                        a.titulo?.includes("Quiz"))),
                                );

                                if (atividadeQuiz) {
                                  console.log(
                                    `✅ Mapeado ${mat.name} → Atividade ${atividadeQuiz.id_atividade}`,
                                  );
                                  return {
                                    ...mat,
                                    id_atividade: atividadeQuiz.id_atividade,
                                  };
                                }
                              }
                            } catch (err) {
                              console.warn(
                                `⚠️ Erro ao buscar id_atividade para ${mat.name}:`,
                                err,
                              );
                            }
                          }
                          return mat;
                        }),
                      );
                    }

                    return {
                      ...mod,
                      materials,
                    };
                  }),
                );
                console.log("✅ Módulos processados:", processedModules);
                console.log(
                  "📚 Materials do primeiro módulo:",
                  processedModules[0]?.materials,
                );
              }
            } catch (parseErr) {
              console.error("❌ Erro ao processar changelog:", parseErr);
            }
          }
        }

        if (!isMounted) return;
        setTrail(trailData);
        setModules(processedModules);
        setCurrentModuleIndex(0);
        setCurrentMaterialIndex(0);
      } catch (err) {
        console.error("❌ Erro ao buscar trilha:", err);
        if (!isMounted) return;
        setTrail(undefined);
        setModules([]);
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    }

    fetchTrail();
    return () => {
      isMounted = false;
    };
  }, [id]);

  // Buscar status da matrícula após carregar a trilha
  useEffect(() => {
    async function fetchEnrollmentStatus() {
      if (!id || !trail) return;

      setIsLoadingStatus(true);
      try {
        const status = await enrollmentService.getEnrollmentStatus(Number(id));
        setEnrollmentStatus(status);
        console.log("📊 Status da matrícula:", status);
      } catch (err) {
        console.error("❌ Erro ao buscar status da matrícula:", err);
        setEnrollmentStatus(null);
      } finally {
        setIsLoadingStatus(false);
      }
    }

    fetchEnrollmentStatus();
  }, [id, trail]);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleModule = (moduleId: number) => {
    setCollapsedModules((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(moduleId)) {
        newSet.delete(moduleId);
      } else {
        newSet.add(moduleId);
      }
      return newSet;
    });
  };

  const isModuleCollapsed = (moduleId: number) => {
    return collapsedModules.has(moduleId);
  };

  const markAsCompleted = (moduleId: number, materialId: number) => {
    const key = `${moduleId}-${materialId}`;
    setCompletedMaterials((prev) => new Set([...prev, key]));

    // TODO: Integrar com progressService.completeMaterial quando necessário
  };

  const unmarkAsCompleted = (moduleId: number, materialId: number) => {
    const key = `${moduleId}-${materialId}`;
    setCompletedMaterials((prev) => {
      const newSet = new Set(prev);
      newSet.delete(key);
      return newSet;
    });
  };

  const toggleCompleted = (moduleId: number, materialId: number) => {
    if (isCompleted(moduleId, materialId)) {
      unmarkAsCompleted(moduleId, materialId);
    } else {
      markAsCompleted(moduleId, materialId);
    }
  };

  const isCompleted = (moduleId: number, materialId: number) => {
    return completedMaterials.has(`${moduleId}-${materialId}`);
  };

  const getQuizInfo = (moduleId: number, materialId: number) => {
    // TODO: Integrar com progressService.getQuizAttempts quando necessário
    // Por enquanto, retornando null para evitar erros
    return null;
  };

  const goToMaterial = (moduleIndex: number, materialIndex: number) => {
    setCurrentModuleIndex(moduleIndex);
    setCurrentMaterialIndex(materialIndex);
  };

  const getProgressPercentage = () => {
    if (!modules || modules.length === 0) return 0;

    // Se temos enrollmentStatus, usar o valor do backend
    if (enrollmentStatus) {
      return enrollmentStatus.progresso_percentual;
    }
    const totalMaterials = modules.reduce(
      (acc, mod) => acc + (mod.materials?.length || 0),
      0,
    );
    if (totalMaterials === 0) return 0;
    return Math.round((completedMaterials.size / totalMaterials) * 100);
  };

  const getMaterialIcon = (type: string) => {
    switch (type) {
      case "video":
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
        );
      case "pdf":
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );
      case "quiz":
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
              clipRule="evenodd"
            />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  // Handlers para refazer e resetar trilha
  const handleRefazerTrilha = async () => {
    if (!id) return;

    try {
      const response = await enrollmentService.refazerTrilha(Number(id));
      console.log("✅ Trilha liberada para refazer:", response);

      // Atualizar status local
      if (enrollmentStatus) {
        setEnrollmentStatus({
          ...enrollmentStatus,
          modo_visualizacao: false,
          status: "EmAndamento",
        });
      }

      setShowRefazerModal(false);
      alert(response.message + "\n\n" + response.observacao);

      // Recarregar a página para atualizar o estado
      window.location.reload();
    } catch (err: any) {
      console.error("❌ Erro ao refazer trilha:", err);
      alert("Erro ao refazer trilha: " + err.message);
    }
  };

  const handleResetarProgresso = async () => {
    if (!id) return;

    const confirmacao = window.confirm(
      "⚠️ ATENÇÃO: Esta ação irá apagar TODO o seu histórico de progresso desta trilha!\n\n" +
        "Isso inclui:\n" +
        "- Todas as atividades concluídas\n" +
        "- Todas as tentativas de quiz\n" +
        "- Todo o histórico de visualização\n\n" +
        "Você terá que começar do zero.\n\n" +
        "Tem certeza que deseja continuar?",
    );

    if (!confirmacao) return;

    try {
      const response = await enrollmentService.resetarProgresso(Number(id));
      console.log("✅ Progresso resetado:", response);

      setShowResetModal(false);
      alert(
        response.message +
          "\n\n" +
          `${response.progressos_apagados} registros de progresso foram removidos.\n\n` +
          response.observacao,
      );

      // Recarregar a página para resetar completamente o estado
      window.location.reload();
    } catch (err: any) {
      console.error("❌ Erro ao resetar progresso:", err);
      alert("Erro ao resetar progresso: " + err.message);
    }
  };

  // Retornos condicionais ANTES do JSX principal
  if (isBootstrapping) {
    return <div>Carregando...</div>;
  }

  if (!trail) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Trilha não encontrada
          </h2>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Verifica se há módulos disponíveis
  if (!modules || modules.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-100">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Nenhum módulo encontrado
          </h2>
          <p className="mb-4 text-gray-600">
            Esta trilha não possui módulos configurados.
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Variáveis derivadas do estado
  const currentModule = modules[currentModuleIndex];
  const currentMaterial = currentModule?.materials?.[currentMaterialIndex];

  // JSX principal - ÚNICO return ao final
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-gray-900 lg:flex-row">
      {/* Top-right icons: notificações e perfil (visível na página da trilha) */}
      <div className="absolute top-3 right-4 z-50 flex items-center space-x-3">
        <button
          className="relative rounded-full p-2 shadow-sm transition-all duration-200 hover:shadow-md"
          style={{ backgroundColor: "#233E97" }}
          title="Notificações"
        >
          <svg
            className="h-5 w-5 text-white"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
          </svg>
          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            1
          </div>
        </button>
        <ProfileMenu />
      </div>
      {/* Sidebar - Conteúdo do Curso */}
      <div
        className={`${sidebarCollapsed ? "w-16 lg:w-16" : "w-full lg:w-80 xl:w-96"} relative z-20 flex h-full flex-col overflow-visible border-b border-gray-200 bg-white transition-all duration-300 lg:border-r lg:border-b-0`}
      >
        {/* Header da Sidebar */}
        <div className="relative overflow-visible border-b border-gray-200 bg-gray-50 p-4 lg:bg-white lg:p-6">
          {!sidebarCollapsed ? (
            /* Layout normal - sidebar expandida */
            <div className="mb-3 flex items-center justify-between lg:mb-4">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    const user = authService.getStoredUser();
                    const role =
                      (user as unknown as { role?: string })?.role || null;
                    if (role === "Administrador") navigate("/admin");
                    else if (role === "Mentor") navigate("/trails");
                    else if (role === "Aprendiz") navigate("/trails");
                    else navigate("/dashboard");
                  }}
                  className="group flex items-center text-sm text-gray-600 transition-colors hover:text-gray-900 lg:text-base"
                  title="Voltar ao dashboard"
                >
                  <div className="rounded-md p-1 transition-colors group-hover:bg-gray-100">
                    <svg
                      className="mr-1 h-4 w-4 lg:mr-2 lg:h-5 lg:w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </div>
                  <span className="hidden sm:inline">Voltar</span>
                  <span className="sm:hidden">←</span>
                </button>

                <div className="h-6 w-px bg-gray-300"></div>

                <button
                  onClick={toggleSidebar}
                  className="group flex items-center rounded-md p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600 lg:hidden"
                  title="Minimizar menu lateral"
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
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                  <span className="ml-1 text-xs">Minimizar</span>
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <div className="text-xs font-medium text-gray-500 lg:text-sm">
                  {getProgressPercentage()}%
                </div>
                <button
                  onClick={toggleSidebar}
                  className="group hidden items-center rounded-md p-2 text-gray-600 transition-colors hover:bg-blue-50 hover:text-blue-600 lg:flex"
                  title="Minimizar menu lateral"
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
                      d="M11 19l-7-7 7-7m8 14l-7-7 7-7"
                    />
                  </svg>
                  <span className="ml-1 hidden text-xs xl:block">
                    Minimizar
                  </span>
                </button>
              </div>
            </div>
          ) : (
            /* Layout colapsado - sidebar retraída */
            <div className="relative flex flex-col items-center space-y-6">
              {/* Header com botões */}
              <div className="relative flex h-12 w-full items-center justify-center">
                <button
                  onClick={() => {
                    const user = authService.getStoredUser();
                    const role =
                      (user as unknown as { role?: string })?.role || null;
                    if (role === "Administrador") navigate("/admin");
                    else if (role === "Mentor") navigate("/trails");
                    else if (role === "Aprendiz") navigate("/trails");
                    else navigate("/dashboard");
                  }}
                  className="group absolute left-0 rounded-md p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  title="Voltar ao dashboard"
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
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                <button
                  onClick={toggleSidebar}
                  className="hover:bg-opacity-80 group absolute z-10 rounded-r-lg p-2.5 text-white shadow-md transition-all duration-200 hover:shadow-lg"
                  title="Expandir menu lateral"
                  style={{
                    backgroundColor: "#1E3A8A",
                    right: "-12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
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
                      d="M13 5l7 7-7 7M5 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>

              {/* Progresso Circular */}
              <div className="relative mt-4 h-12 w-12">
                <svg
                  className="h-12 w-12 -rotate-90 transform"
                  viewBox="0 0 36 36"
                >
                  {/* Círculo de fundo */}
                  <path
                    className="text-gray-200"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Círculo de progresso */}
                  <path
                    className="text-blue-600"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    fill="none"
                    strokeDasharray={`${getProgressPercentage()}, 100`}
                    d="M18 2.0845
                      a 15.9155 15.9155 0 0 1 0 31.831
                      a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                {/* Porcentagem no centro */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-gray-700">
                    {getProgressPercentage()}%
                  </span>
                </div>
              </div>

              {/* Indicador visual adicional */}
              <div className="flex space-x-1">
                {modules.map((_: Module, index: number) => {
                  const mod = modules[index];
                  const materialsLen = mod.materials?.length || 0;
                  const completedCount =
                    materialsLen > 0 && mod.materials
                      ? mod.materials.filter((material: Material) =>
                          completedMaterials.has(`${mod.id}-${material.id}`),
                        ).length
                      : 0;
                  const moduleProgress =
                    materialsLen > 0
                      ? (completedCount / materialsLen) * 100
                      : 0;

                  return (
                    <div
                      key={index}
                      className={`h-3 w-1 rounded-full transition-colors ${
                        moduleProgress === 100
                          ? "bg-green-500"
                          : moduleProgress > 0
                            ? "bg-yellow-400"
                            : "bg-gray-300"
                      }`}
                      title={`Módulo ${index + 1}: ${Math.round(moduleProgress)}%`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {!sidebarCollapsed && (
            <>
              <h1 className="mb-2 line-clamp-2 text-lg font-bold text-gray-900 lg:text-xl">
                {trail.name}
              </h1>
              <p className="mb-3 line-clamp-2 hidden text-xs text-gray-600 lg:mb-4 lg:block lg:text-sm">
                {trail.description}
              </p>

              {/* Barra de Progresso */}
              <div className="h-1.5 w-full rounded-full bg-gray-200 lg:h-2">
                <div
                  className="h-1.5 rounded-full bg-green-600 transition-all duration-300 lg:h-2"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>

              {/* Banner de Modo Visualização / Status */}
              {enrollmentStatus && enrollmentStatus.modo_visualizacao && (
                <div className="mt-3 rounded-lg border-2 border-blue-300 bg-blue-50 p-3">
                  <div className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-xs font-bold text-blue-900">
                        🎓 Trilha Concluída
                      </p>
                      <p className="mt-1 text-xs text-blue-800">
                        Você completou esta trilha! Agora você pode apenas
                        visualizar o conteúdo.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões de Ação para Administradores */}
              {enrollmentStatus &&
                enrollmentStatus.is_admin &&
                enrollmentStatus.permite_refazer && (
                  <div className="mt-3 space-y-2">
                    <button
                      onClick={() => setShowRefazerModal(true)}
                      className="w-full rounded-lg bg-green-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-green-700"
                    >
                      🔄 Refazer Trilha
                    </button>
                    <button
                      onClick={() => setShowResetModal(true)}
                      className="w-full rounded-lg border-2 border-red-600 bg-white px-4 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                    >
                      ⚠️ Resetar Progresso
                    </button>
                  </div>
                )}
            </>
          )}
        </div>

        {/* Lista de Conteúdos */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {!sidebarCollapsed &&
            modules.map((module: Module, moduleIndex: number) => (
              <div key={module.id} className="border-b border-gray-200">
                <button
                  onClick={() => toggleModule(module.id)}
                  className="flex w-full items-center justify-between bg-gray-50 p-4 transition-colors hover:bg-gray-100"
                >
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">
                      {module.name}
                    </h3>
                    <div className="mt-1 text-sm text-gray-500">
                      {module.materials?.length || 0}{" "}
                      {(module.materials?.length || 0) === 1 ? "item" : "itens"}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-xs text-gray-500">
                      {module.materials?.filter((material) =>
                        completedMaterials.has(`${module.id}-${material.id}`),
                      ).length || 0}
                      /{module.materials?.length || 0}
                    </div>
                    <svg
                      className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${
                        isModuleCollapsed(module.id) ? "rotate-0" : "rotate-90"
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </button>

                {!isModuleCollapsed(module.id) && module.materials && (
                  <div className="divide-y divide-gray-100">
                    {module.materials.map(
                      (material: Material, materialIndex: number) => {
                        const isActive =
                          moduleIndex === currentModuleIndex &&
                          materialIndex === currentMaterialIndex;
                        const isCompleted = completedMaterials.has(
                          `${module.id}-${material.id}`,
                        );

                        return (
                          <button
                            key={`${module.id}-${material.id}-${materialIndex}`}
                            onClick={() =>
                              goToMaterial(moduleIndex, materialIndex)
                            }
                            className={`flex w-full items-center p-3 text-left transition-colors hover:bg-gray-50 lg:p-4 ${
                              isActive
                                ? "border-r-2 border-blue-600 bg-blue-50"
                                : ""
                            }`}
                          >
                            <div
                              className={`mr-2 flex-shrink-0 rounded-lg p-1.5 lg:mr-3 lg:p-2 ${isCompleted ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"}`}
                            >
                              {isCompleted ? (
                                <svg
                                  className="h-4 w-4 lg:h-5 lg:w-5"
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              ) : (
                                <div className="h-4 w-4 lg:h-5 lg:w-5">
                                  {getMaterialIcon(material.type)}
                                </div>
                              )}
                            </div>

                            <div className="min-w-0 flex-1">
                              <div
                                className={`truncate text-sm font-medium lg:text-base ${isActive ? "text-blue-600" : "text-gray-900"}`}
                              >
                                {material.name}
                              </div>

                              {material.type === "quiz" ? (
                                // Exibição simples para quizzes na sidebar
                                (() => {
                                  const quizInfo = getQuizInfo(
                                    module.id,
                                    material.id,
                                  );
                                  if (
                                    quizInfo &&
                                    quizInfo.score !== null &&
                                    quizInfo.score !== undefined
                                  ) {
                                    const passed = quizInfo.score >= 70;
                                    return (
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 capitalize">
                                          Quiz
                                        </span>
                                        <div
                                          className={`rounded px-2 py-1 text-xs font-medium ${
                                            passed
                                              ? "bg-green-100 text-green-700"
                                              : "bg-red-100 text-red-700"
                                          }`}
                                        >
                                          {passed ? "✅" : "❌"}{" "}
                                          {quizInfo.score}%
                                        </div>
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-500 capitalize">
                                          Quiz
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          Não realizado
                                        </span>
                                      </div>
                                    );
                                  }
                                })()
                              ) : (
                                // Exibição padrão para outros tipos
                                <div className="text-xs text-gray-500 capitalize lg:text-sm">
                                  {material.type}
                                </div>
                              )}
                            </div>

                            {isActive && (
                              <div className="ml-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue-600 lg:h-2 lg:w-2"></div>
                            )}
                          </button>
                        );
                      },
                    )}
                  </div>
                )}
              </div>
            ))}

          {sidebarCollapsed && (
            <div className="space-y-3 p-3">
              {modules.map((module: Module, moduleIndex: number) => {
                const isActive = moduleIndex === currentModuleIndex;
                const completedCount =
                  module.materials?.filter((material) =>
                    completedMaterials.has(`${module.id}-${material.id}`),
                  ).length || 0;
                const progress =
                  (module.materials?.length || 0) > 0
                    ? (completedCount / (module.materials?.length || 1)) * 100
                    : 0;

                return (
                  <button
                    key={module.id}
                    onClick={() => {
                      // Se o módulo ativo não for este, vá para o primeiro material deste módulo
                      if (moduleIndex !== currentModuleIndex) {
                        goToMaterial(moduleIndex, 0);
                      }
                    }}
                    className={`relative flex w-full flex-col items-center rounded-xl p-2 transition-all duration-200 ${
                      isActive
                        ? "border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md"
                        : "border border-gray-200 bg-gray-50 hover:bg-gray-100 hover:shadow-sm"
                    }`}
                    title={`${module.name} - ${completedCount}/${module.materials?.length || 0} concluído`}
                  >
                    {/* Indicador de progresso circular */}
                    <div className="relative mb-2">
                      <svg
                        className="h-10 w-10 -rotate-90 transform"
                        viewBox="0 0 36 36"
                      >
                        <path
                          className="text-gray-200"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={
                            progress === 100
                              ? "text-green-500"
                              : progress > 0
                                ? "text-blue-500"
                                : "text-gray-300"
                          }
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={`${progress}, 100`}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div
                        className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
                          isActive ? "text-blue-700" : "text-gray-700"
                        }`}
                      >
                        {moduleIndex + 1}
                      </div>
                    </div>

                    {/* Indicador de status */}
                    <div
                      className={`text-xs font-medium ${
                        isActive ? "text-blue-700" : "text-gray-600"
                      }`}
                    >
                      {completedCount}/{module.materials?.length || 0}
                    </div>

                    {/* Indicador ativo */}
                    {isActive && (
                      <div className="absolute top-1/2 -right-1 h-6 w-1 -translate-y-1/2 transform rounded-full bg-blue-600"></div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Botão flutuante para expandir sidebar (mobile) */}
      {sidebarCollapsed && (
        <button
          onClick={toggleSidebar}
          className="group fixed right-6 bottom-6 z-[100] transform rounded-full bg-gradient-to-r from-blue-600 to-blue-700 p-4 text-white shadow-xl backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:from-blue-700 hover:to-blue-800 hover:shadow-2xl lg:hidden"
          title="Expandir menu de navegação"
        >
          <svg
            className="h-6 w-6 transition-transform group-hover:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <div className="absolute -top-1 -right-1 h-3 w-3 animate-pulse rounded-full bg-orange-500"></div>
        </button>
      )}

      {/* Área Principal - Conteúdo */}
      <div
        className={`flex h-full flex-1 flex-col ${sidebarCollapsed ? "pb-20 lg:pb-0" : ""} transition-all duration-300`}
      >
        {/* Header Principal */}
        <div
          className={`flex-shrink-0 border-b border-gray-200 bg-white transition-all duration-300 ${
            sidebarCollapsed ? "p-2 pl-20 lg:p-3 lg:pl-6" : "p-4 lg:p-6"
          }`}
        >
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-0">
            <div className="min-w-0 flex-1">
              <h2
                className={`truncate font-bold text-gray-900 transition-all duration-300 ${
                  sidebarCollapsed
                    ? "text-base lg:text-lg"
                    : "text-lg lg:text-2xl"
                }`}
              >
                {currentMaterial ? currentMaterial.name : trail.name}
              </h2>
              <p
                className={`mt-1 text-gray-600 capitalize transition-all duration-300 ${
                  sidebarCollapsed
                    ? "text-xs lg:text-sm"
                    : "text-sm lg:text-base"
                }`}
              >
                {currentMaterial ? currentMaterial.type : ""}
              </p>
            </div>

            {!sidebarCollapsed && currentModule && currentMaterial && (
              <button
                onClick={() =>
                  toggleCompleted(currentModule.id, currentMaterial.id)
                }
                className={`flex-shrink-0 rounded-lg px-4 py-2 text-sm font-medium transition-colors lg:px-6 lg:text-base ${
                  isCompleted(currentModule.id, currentMaterial.id)
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                <span className="hidden lg:inline">
                  {isCompleted(currentModule.id, currentMaterial.id)
                    ? "Desmarcar Conclusão"
                    : "Marcar como Concluído"}
                </span>
                <span className="lg:hidden">
                  {isCompleted(currentModule.id, currentMaterial.id)
                    ? "✗ Desfazer"
                    : "✓ Concluir"}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Área de Conteúdo */}
        <div
          className={`flex-1 overflow-y-auto bg-gray-50 ${sidebarCollapsed ? "pr-4 lg:pr-4" : ""} relative`}
        >
          {/* Botão compacto de conclusão quando sidebar está colapsada */}
          {sidebarCollapsed && currentMaterial && currentModule && (
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => {
                  if (currentModule && currentMaterial)
                    toggleCompleted(currentModule.id, currentMaterial.id);
                }}
                className={`rounded-full p-2 font-medium shadow-lg transition-all duration-300 hover:scale-105 ${
                  isCompleted(currentModule.id, currentMaterial.id)
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
                title={
                  isCompleted(currentModule.id, currentMaterial.id)
                    ? "Desmarcar Conclusão"
                    : "Marcar como Concluído"
                }
              >
                {isCompleted(currentModule.id, currentMaterial.id) ? (
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
                ) : (
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
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            </div>
          )}

          {currentMaterial ? (
            <div className="p-4 lg:p-6">
              <MaterialViewer
                material={currentMaterial}
                trailId={trail.id}
                moduleId={currentModule!.id}
                userId={userId}
                onComplete={(score) => {
                  if (currentModule && currentMaterial)
                    markAsCompleted(currentModule.id, currentMaterial.id);
                  console.log("Material completado com score:", score);
                }}
              />
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <span className="mb-4 block text-6xl">📚</span>
              <h3 className="mb-2 text-xl font-semibold">
                Nenhum material selecionado
              </h3>
              <p>Selecione um material da sidebar para começar</p>
            </div>
          )}
        </div>

        {/* Navegação inferior */}
        <div
          className={`flex-shrink-0 border-t border-gray-200 bg-white transition-all duration-300 ${
            sidebarCollapsed ? "p-2 lg:p-3" : "p-4 lg:p-6"
          }`}
        >
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <button
              onClick={() => {
                if (currentMaterialIndex > 0) {
                  setCurrentMaterialIndex(currentMaterialIndex - 1);
                } else if (currentModuleIndex > 0) {
                  setCurrentModuleIndex(currentModuleIndex - 1);
                  const prevModule = modules[currentModuleIndex - 1];
                  setCurrentMaterialIndex(
                    prevModule?.materials?.length
                      ? prevModule.materials.length - 1
                      : 0,
                  );
                }
              }}
              disabled={currentModuleIndex === 0 && currentMaterialIndex === 0}
              className={`flex items-center text-gray-600 transition-all duration-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-50 ${
                sidebarCollapsed
                  ? "px-2 py-1 text-xs lg:text-sm"
                  : "px-3 py-2 text-sm lg:px-4 lg:text-base"
              }`}
            >
              <svg
                className={`mr-1 transition-all duration-300 lg:mr-2 ${
                  sidebarCollapsed
                    ? "h-3 w-3 lg:h-4 lg:w-4"
                    : "h-4 w-4 lg:h-5 lg:w-5"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {!sidebarCollapsed && (
                <>
                  <span className="hidden sm:inline">Anterior</span>
                  <span className="sm:hidden">←</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                // defensive: ensure currentModule exists before accessing materials
                if (!currentModule || !currentModule.materials) return;
                if (currentMaterialIndex < currentModule.materials.length - 1) {
                  setCurrentMaterialIndex(currentMaterialIndex + 1);
                } else if (currentModuleIndex < modules.length - 1) {
                  setCurrentModuleIndex(currentModuleIndex + 1);
                  setCurrentMaterialIndex(0);
                }
              }}
              disabled={
                !currentModule ||
                !currentModule.materials ||
                (currentModuleIndex === modules.length - 1 &&
                  currentMaterialIndex ===
                    (currentModule.materials?.length || 1) - 1)
              }
              className={`flex items-center rounded-lg bg-blue-600 text-white transition-all duration-300 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 ${
                sidebarCollapsed
                  ? "px-2 py-1 text-xs lg:text-sm"
                  : "px-3 py-2 text-sm lg:px-4 lg:text-base"
              }`}
            >
              {!sidebarCollapsed && (
                <>
                  <span className="hidden sm:inline">Próximo</span>
                  <span className="sm:hidden">→</span>
                </>
              )}
              <svg
                className={`transition-all duration-300 ${
                  sidebarCollapsed
                    ? "h-3 w-3 lg:h-4 lg:w-4"
                    : "ml-1 h-4 w-4 lg:ml-2 lg:h-5 lg:w-5"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Certificado de Conclusão */}
      {/* Certificado removido para funcionamento mínimo */}

      {/* Modal de Confirmação: Refazer Trilha */}
      {showRefazerModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-gray-900">
              Refazer Trilha
            </h3>
            <p className="mb-4 text-sm text-gray-700">
              Ao refazer esta trilha:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-gray-700">
              <li>Seu histórico de progresso será mantido</li>
              <li>Você poderá continuar de onde parou</li>
              <li>Poderá refazer as atividades se desejar</li>
              <li>Os registros anteriores permanecerão salvos</li>
            </ul>
            <p className="mb-6 text-sm font-medium text-green-700">
              ✅ Esta ação não apaga seu histórico.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowRefazerModal(false)}
                className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleRefazerTrilha}
                className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação: Resetar Progresso */}
      {showResetModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
          <div className="max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-xl font-bold text-red-600">
              ⚠️ Resetar Progresso
            </h3>
            <p className="mb-4 text-sm font-bold text-gray-900">
              ATENÇÃO: Esta ação é irreversível!
            </p>
            <p className="mb-4 text-sm text-gray-700">
              Ao resetar o progresso desta trilha:
            </p>
            <ul className="mb-4 list-disc space-y-1 pl-5 text-sm text-red-700">
              <li>TODO o histórico de progresso será apagado</li>
              <li>Todas as atividades concluídas serão removidas</li>
              <li>Todas as tentativas de quiz serão deletadas</li>
              <li>Você terá que começar do zero</li>
            </ul>
            <p className="mb-6 text-sm font-bold text-red-700">
              ⚠️ Esta ação NÃO pode ser desfeita!
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowResetModal(false)}
                className="flex-1 rounded-lg border-2 border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleResetarProgresso}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Resetar Tudo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrailViewer;
