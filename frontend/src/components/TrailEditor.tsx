import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTrails } from "../hooks/useTrails";
import { trailService } from "../services/trailService";
import MaterialEditor from "./MaterialEditor";
import { QuizManagerAPI } from "./QuizManagerAPI";
import { useTheme } from "../contexts/ThemeContext";
import api from "../services/api";

interface TrailFormData {
  name: string;
  description: string;
  objectives: string;
  tags: string[];
  targetAudience: string;
  deadline: string;
}

interface Material {
  id: number;
  type: string;
  name: string;
  icon: string;
  color: string;
  url?: string;
  duration?: number;
  description?: string;
  id_atividade?: number; // ID da atividade no backend (para quiz)
  quizId?: number; // ID do quiz (alternativa)
  questoes?: any[]; // Questões do quiz armazenadas localmente
}

interface Module {
  id: number;
  name: string;
  description?: string;
  steps: number;
  materials: Material[];
}

interface DraftPayload {
  formData?: Partial<TrailFormData>;
  modules?: Module[];
  savedAt?: string;
}

type DraggedItem = { moduleId: number; materialIndex: number } | null;

enum TabId {
  INFO = "info",
  CONTENT = "content",
}

export default function TrailEditor() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { createTrail, updateTrail, getTrail, isLoading } = useTrails();
  const { isDark, toggleTheme } = useTheme();

  const pageClass = isDark
    ? "bg-gray-900 text-gray-100"
    : "bg-gray-50 text-gray-900";
  const inputClass = `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? "bg-gray-800 border-gray-600 text-gray-100 placeholder-gray-400" : "bg-white border-gray-300 text-gray-900 placeholder-gray-500"}`;
  const labelClass = `block text-sm font-medium mb-2 ${isDark ? "text-gray-200" : "text-gray-700"}`;
  const cardClass = `rounded-lg border shadow-sm ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"}`;
  const mutedText = isDark ? "text-gray-400" : "text-gray-600";

  const isEditing = !!id;
  const [activeTab, setActiveTab] = useState<TabId>(TabId.INFO);

  // Dados básicos da trilha
  const [formData, setFormData] = useState<TrailFormData>({
    name: "",
    description: "",
    objectives: "",
    tags: [],
    targetAudience: "",
    deadline: "",
  });

  // Gerenciamento de módulos e materiais
  const [modules, setModules] = useState<Module[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialEditorMode, setMaterialEditorMode] = useState<"add" | "edit">(
    "add",
  );
  const [materialEditorOpen, setMaterialEditorOpen] = useState(false);
  const [draggedItem, setDraggedItem] = useState<DraggedItem>(null);
  const [selectedMaterials, setSelectedMaterials] = useState<Set<number>>(
    new Set(),
  ); // Para seleção múltipla

  // Gerenciamento de Quiz
  const [quizManagerOpen, setQuizManagerOpen] = useState(false);
  const [editingModuleId, setEditingModuleId] = useState<number | null>(null);
  const [editingQuizMaterialId, setEditingQuizMaterialId] = useState<
    number | null
  >(null);

  // Pending draft (loaded but not applied) — user can restore or ignore
  const [pendingDraft, setPendingDraft] = useState<DraftPayload | null>(null);
  const restoreDraft = () => {
    if (!pendingDraft) return;
    if (pendingDraft.formData)
      setFormData((prev) => ({ ...prev, ...pendingDraft.formData }));
    if (Array.isArray(pendingDraft.modules) && pendingDraft.modules.length > 0)
      setModules(pendingDraft.modules);
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    setPendingDraft(null);
  };

  const ignoreDraft = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }
    setPendingDraft(null);
  };

  // Autosave draft key (per-trail or new)
  const draftKey =
    isEditing && id ? `faurg:trail_draft_${id}` : "faurg:trail_draft_new";

  // Load draft from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;

      const parsedRaw: unknown = JSON.parse(raw);
      const parsed = parsedRaw as {
        formData?: Partial<typeof formData>;
        modules?: Module[];
        savedAt?: string;
      };

      const hasName =
        typeof parsed?.formData?.name === "string" &&
        parsed.formData.name.trim().length > 0;
      const hasDescription =
        typeof parsed?.formData?.description === "string" &&
        parsed.formData.description.trim().length > 0;
      const hasObjectives =
        typeof parsed?.formData?.objectives === "string" &&
        parsed.formData.objectives.trim().length > 0;
      const hasTargetAudience =
        typeof parsed?.formData?.targetAudience === "string" &&
        parsed.formData.targetAudience.trim().length > 0;
      const hasDeadline =
        typeof parsed?.formData?.deadline === "string" &&
        parsed.formData.deadline.trim().length > 0;
      const hasTags =
        Array.isArray(parsed?.formData?.tags) &&
        parsed.formData.tags.length > 0;

      const hasModules =
        Array.isArray(parsed?.modules) &&
        parsed.modules.some((m) => {
          try {
            const nameOk =
              typeof (m as Module).name === "string" &&
              ((m as Module).name || "").trim().length > 0;
            const materials = Array.isArray((m as Module).materials)
              ? ((m as Module).materials as Material[])
              : [];
            const hasMaterialWithName = materials.some(
              (mat) =>
                typeof mat.name === "string" && mat.name.trim().length > 0,
            );
            return nameOk || materials.length > 0 || hasMaterialWithName;
          } catch {
            return false;
          }
        });

      // Consider recency: only restore drafts saved within the last 30 days
      let recent = false;
      if (typeof parsed?.savedAt === "string") {
        const parsedDate = Date.parse(parsed.savedAt);
        if (!Number.isNaN(parsedDate)) {
          const ageMs = Date.now() - parsedDate;
          const days30 = 1000 * 60 * 60 * 24 * 30;
          recent = ageMs <= days30;
        }
      }

      const meaningful =
        hasName ||
        hasDescription ||
        hasObjectives ||
        hasTargetAudience ||
        hasDeadline ||
        hasTags ||
        hasModules;
      if (!meaningful) return; // don't restore or notify for empty/insignificant drafts
      if (!recent) return; // ignore stale drafts

      // Store the draft in state and let the user decide to restore or ignore
      const draft: DraftPayload = {};
      if (parsed?.formData) draft.formData = parsed.formData;
      if (Array.isArray(parsed?.modules) && parsed.modules.length > 0)
        draft.modules = parsed.modules as Module[];
      if (parsed?.savedAt) draft.savedAt = parsed.savedAt;

      setPendingDraft(draft);
    } catch {
      // ignore parse errors
    }
    // run only once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave every 30s and on unload
  useEffect(() => {
    const saveLocal = () => {
      try {
        const payload = {
          formData,
          modules,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem(draftKey, JSON.stringify(payload));
      } catch {
        // ignore
      }
    };

    const id = window.setInterval(saveLocal, 30_000);
    const onBeforeUnload = () => saveLocal();
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      clearInterval(id);
      window.removeEventListener("beforeunload", onBeforeUnload);
      // final save
      saveLocal();
    };
  }, [formData, modules, draftKey]);

  // Funções de reordenação por drag-and-drop
  const handleDragStart = (moduleId: number, materialIndex: number) => {
    setDraggedItem({ moduleId, materialIndex });
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const handleDrop = (
    targetModuleId: number,
    targetIndex: number,
    e: React.DragEvent,
  ) => {
    e.preventDefault();
    e.stopPropagation();

    if (!draggedItem) return;

    // Se for soltar no mesmo lugar, não fazer nada
    if (
      draggedItem.moduleId === targetModuleId &&
      draggedItem.materialIndex === targetIndex
    ) {
      setDraggedItem(null);
      return;
    }

    setModules((prevModules) => {
      const newModules = [...prevModules];

      // Encontrar os módulos fonte e destino
      const sourceModuleIndex = newModules.findIndex(
        (m) => m.id === draggedItem.moduleId,
      );
      const targetModuleIndex = newModules.findIndex(
        (m) => m.id === targetModuleId,
      );

      if (sourceModuleIndex === -1 || targetModuleIndex === -1)
        return prevModules;

      // Se for o mesmo módulo, apenas reordenar
      if (draggedItem.moduleId === targetModuleId) {
        const module = { ...newModules[sourceModuleIndex] };
        const materials = [...module.materials];

        // Remover do índice original
        const [movedMaterial] = materials.splice(draggedItem.materialIndex, 1);

        // Inserir no novo índice (ajustar se necessário)
        const newIndex =
          draggedItem.materialIndex < targetIndex
            ? targetIndex - 1
            : targetIndex;
        materials.splice(newIndex, 0, movedMaterial);

        module.materials = materials;
        newModules[sourceModuleIndex] = module;
      } else {
        // Mover entre módulos diferentes
        const sourceModule = { ...newModules[sourceModuleIndex] };
        const targetModule = { ...newModules[targetModuleIndex] };

        // Extrair o material que está sendo movido
        const movedMaterial = sourceModule.materials[draggedItem.materialIndex];

        // Remover do módulo fonte
        sourceModule.materials = sourceModule.materials.filter(
          (_, index) => index !== draggedItem.materialIndex,
        );
        sourceModule.steps = sourceModule.materials.length;

        // Adicionar ao módulo destino na posição correta
        const targetMaterials = [...targetModule.materials];
        targetMaterials.splice(targetIndex, 0, movedMaterial);
        targetModule.materials = targetMaterials;
        targetModule.steps = targetMaterials.length;

        // Atualizar os módulos
        newModules[sourceModuleIndex] = sourceModule;
        newModules[targetModuleIndex] = targetModule;
      }

      return newModules;
    });

    setDraggedItem(null);
  };

  // Funções para reordenação manual (botões de seta)
  const moveMaterialUp = (moduleId: number, materialIndex: number) => {
    if (materialIndex === 0) return; // Já está no topo

    setModules((prevModules) => {
      return prevModules.map((module) => {
        if (module.id === moduleId) {
          const newMaterials = [...module.materials];
          // Trocar posições
          [newMaterials[materialIndex], newMaterials[materialIndex - 1]] = [
            newMaterials[materialIndex - 1],
            newMaterials[materialIndex],
          ];

          return { ...module, materials: newMaterials };
        }
        return module;
      });
    });
  };

  const moveMaterialDown = (moduleId: number, materialIndex: number) => {
    setModules((prevModules) => {
      return prevModules.map((module) => {
        if (module.id === moduleId) {
          if (materialIndex >= module.materials.length - 1) return module; // Já está no final

          const newMaterials = [...module.materials];
          // Trocar posições
          [newMaterials[materialIndex], newMaterials[materialIndex + 1]] = [
            newMaterials[materialIndex + 1],
            newMaterials[materialIndex],
          ];

          return { ...module, materials: newMaterials };
        }
        return module;
      });
    });
  };

  // Função para obter cor do tipo de material
  const getMaterialColor = (type: string): string => {
    const colors: Record<string, string> = {
      video: "#DC2626",
      pdf: "#059669",
      quiz: "#7C3AED",
      reading: "#0891B2",
      link: "#EA580C",
      presentation: "#7C2D12",
    };
    return colors[type] || "#6B7280";
  };

  // Função para obter ícone do tipo de material
  const getMaterialIcon = (type: string): string => {
    const icons: Record<string, string> = {
      video: "🎥",
      pdf: "📄",
      quiz: "✅",
      reading: "📖",
      link: "🔗",
      presentation: "📊",
    };
    return icons[type] || "📋";
  };

  // Carregar dados da trilha se estiver editando
  useEffect(() => {
    if (id) {
      getTrail(parseInt(id)).then((trail) => {
        if (trail) {
          console.log("📖 Carregando trilha para edição:", trail);

          // Extrair dados do changelog se necessário
          let changelogData: any = null;
          if (trail.changelog && typeof trail.changelog === "string") {
            try {
              changelogData = JSON.parse(trail.changelog);
              console.log("📋 Dados do changelog:", changelogData);
            } catch (e) {
              console.warn("⚠️ Erro ao parsear changelog:", e);
            }
          }

          // Normalizar tags: priorizar dados do backend, fallback para changelog
          let normalizedTags: string[] = [];
          if (Array.isArray(trail.tags) && trail.tags.length > 0) {
            normalizedTags = trail.tags
              .map((tag: any) => {
                if (typeof tag === "string") return tag;
                if (typeof tag === "object" && tag !== null) {
                  return tag.nome || tag.name || tag.label || "";
                }
                return "";
              })
              .filter((t: string) => t.length > 0);
          } else if (changelogData?.tags && Array.isArray(changelogData.tags)) {
            normalizedTags = changelogData.tags.filter(
              (t: any) => typeof t === "string" && t.length > 0,
            );
          }

          // Normalizar deadline: usar data_vigencia_fim ou fallback para changelog
          let normalizedDeadline = trail.deadline || "";
          if (!normalizedDeadline && changelogData?.deadline) {
            normalizedDeadline = changelogData.deadline;
          }

          setFormData({
            name: trail.name,
            description: trail.description,
            objectives: trail.objectives || "",
            tags: normalizedTags,
            targetAudience: trail.targetAudience || "",
            deadline: normalizedDeadline,
          });

          // Normalizar modules: usar changelog como fonte principal (tem dados completos de edição)
          let normalizedModules: Module[] = [];

          // Priorizar changelog para edição (contém materiais com detalhes completos)
          if (
            changelogData?.modules &&
            Array.isArray(changelogData.modules) &&
            changelogData.modules.length > 0
          ) {
            normalizedModules = changelogData.modules.map(
              (m: any, idx: number) => {
                const materials = Array.isArray(m.materials)
                  ? m.materials.map((mat: any) => ({
                      id: mat.id || Date.now() + Math.random(),
                      type: mat.type || "",
                      name: mat.name || mat.titulo || "",
                      icon: mat.icon || getMaterialIcon(mat.type || ""),
                      color: mat.color || getMaterialColor(mat.type || ""),
                      url: mat.url || "",
                      duration: mat.duration || mat.duracao || 0,
                      description: mat.description || mat.descricao || "",
                      id_atividade: mat.id_atividade,
                      quizId: mat.quizId || mat.id_quiz,
                      questoes: mat.questoes || [],
                    }))
                  : [];

                return {
                  id: m.id || Date.now() + idx,
                  name: m.name || `Módulo ${idx + 1}`,
                  description: m.description || "",
                  steps: materials.length,
                  materials,
                };
              },
            );
            console.log(
              "✅ Módulos carregados do changelog:",
              normalizedModules,
            );
          } else if (Array.isArray(trail.modules) && trail.modules.length > 0) {
            // Fallback: usar módulos do backend (quando não há changelog)
            normalizedModules = trail.modules.map((m: any, idx: number) => {
              const materials = Array.isArray(m.materials)
                ? m.materials.map((mat: any) => ({
                    id: mat.id || mat.id_material || Date.now() + Math.random(),
                    type: mat.type || (mat.tipo || "").toLowerCase(),
                    name: mat.name || mat.titulo || mat.title || "",
                    icon: getMaterialIcon(
                      mat.type || (mat.tipo || "").toLowerCase(),
                    ),
                    color: getMaterialColor(
                      mat.type || (mat.tipo || "").toLowerCase(),
                    ),
                    url: mat.url || mat.video_source || mat.url_arquivo || "",
                    duration: mat.duration || mat.duracao || 0,
                    description: mat.description || mat.descricao || "",
                    id_atividade: mat.id_atividade,
                    quizId: mat.id_quiz || mat.quizId,
                    questoes: mat.questoes || [],
                  }))
                : [];

              return {
                id: m.id || m.id_modulo || Date.now() + idx,
                name: m.name || m.titulo || `Módulo ${idx + 1}`,
                description: m.description || m.descricao || "",
                steps: materials.length,
                materials,
              };
            });
            console.log("✅ Módulos carregados do backend:", normalizedModules);
          }

          setModules(normalizedModules);
        } else {
          navigate("/admin");
        }
      });
    }
  }, [id, getTrail, navigate]);

  // Gerenciamento de módulos
  const addModule = () => {
    const newModule: Module = {
      id: Date.now(),
      name: `Módulo ${modules.length + 1}`,
      steps: 0,
      materials: [],
    };
    setModules([...modules, newModule]);
    setSelectedModuleId(newModule.id);
  };

  const updateModuleName = (moduleId: number, name: string) => {
    setModules(
      modules.map((module) =>
        module.id === moduleId ? { ...module, name } : module,
      ),
    );
  };

  const deleteModule = async (moduleId: number) => {
    if (
      confirm(
        "Tem certeza que deseja excluir este módulo e todos os seus materiais?",
      )
    ) {
      const updatedModules = modules.filter((module) => module.id !== moduleId);
      setModules(updatedModules);
      if (selectedModuleId === moduleId) {
        setSelectedModuleId(null);
      }

      // Salvar a mudança no backend
      if (isEditing && id) {
        try {
          const trailData = {
            name: formData.name,
            description: formData.description,
            objectives: formData.objectives,
            tags: formData.tags,
            targetAudience: formData.targetAudience,
            deadline: formData.deadline,
            modules: updatedModules,
          };
          await updateTrail(parseInt(id), trailData);
        } catch (error) {
          console.error("Erro ao atualizar trilha após deletar módulo:", error);
          alert(
            "Erro ao atualizar a trilha. A exclusão pode não ter sido salva.",
          );
        }
      }
    }
  };

  // Gerenciamento de materiais
  const addMaterial = (moduleId: number) => {
    setSelectedModuleId(moduleId);
    setEditingMaterial(null);
    setMaterialEditorMode("add");
    setMaterialEditorOpen(true);
  };

  const editMaterial = (moduleId: number, material: Material) => {
    setSelectedModuleId(moduleId);
    setEditingMaterial(material);
    setMaterialEditorMode("edit");
    setMaterialEditorOpen(true);
  };

  const deleteMaterial = async (moduleId: number, materialId: number) => {
    if (confirm("Tem certeza que deseja excluir este material?")) {
      const updatedModules = modules.map((module) => {
        if (module.id === moduleId) {
          const materials = module.materials.filter((m) => m.id !== materialId);
          return { ...module, materials, steps: materials.length };
        }
        return module;
      });

      setModules(updatedModules);

      // Salvar a mudança no backend
      if (isEditing && id) {
        try {
          const modulesForChangelog = updatedModules.map((module) => ({
            id: module.id,
            name: module.name,
            description: module.description,
            steps: module.steps,
            materials: module.materials,
          }));

          const trailData = {
            titulo: formData.name,
            descricao: formData.description,
            objetivos: formData.objectives,
            publico_alvo: formData.targetAudience,
            prazo_recomendado: formData.deadline
              ? parseInt(formData.deadline)
              : null,
            changelog: JSON.stringify({ modules: modulesForChangelog }),
          };
          await updateTrail(parseInt(id), trailData);
        } catch (error) {
          console.error(
            "Erro ao atualizar trilha após deletar material:",
            error,
          );
          alert(
            "Erro ao atualizar a trilha. A exclusão pode não ter sido salva.",
          );
        }
      }
    }
  };

  const toggleSelectMaterial = (materialId: number) => {
    setSelectedMaterials((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(materialId)) {
        newSet.delete(materialId);
      } else {
        newSet.add(materialId);
      }
      return newSet;
    });
  };

  const selectAllMaterials = () => {
    const selectedModule = modules.find((m) => m.id === selectedModuleId);
    if (selectedModule) {
      const allIds = new Set(selectedModule.materials.map((m) => m.id));
      setSelectedMaterials(allIds);
    }
  };

  const deselectAllMaterials = () => {
    setSelectedMaterials(new Set());
  };

  const deleteSelectedMaterials = async () => {
    if (selectedMaterials.size === 0) return;
    if (
      confirm(
        `Tem certeza que deseja excluir ${selectedMaterials.size} material(is)?`,
      )
    ) {
      const updatedModules = modules.map((module) => {
        if (module.id === selectedModuleId) {
          const materials = module.materials.filter(
            (m) => !selectedMaterials.has(m.id),
          );
          return { ...module, materials, steps: materials.length };
        }
        return module;
      });

      setModules(updatedModules);
      setSelectedMaterials(new Set());

      // Salvar a mudança no backend
      if (isEditing && id) {
        try {
          const modulesForChangelog = updatedModules.map((module) => ({
            id: module.id,
            name: module.name,
            description: module.description,
            steps: module.steps,
            materials: module.materials,
          }));

          const trailData = {
            titulo: formData.name,
            descricao: formData.description,
            objetivos: formData.objectives,
            publico_alvo: formData.targetAudience,
            prazo_recomendado: formData.deadline
              ? parseInt(formData.deadline)
              : null,
            changelog: JSON.stringify({ modules: modulesForChangelog }),
          };
          await updateTrail(parseInt(id), trailData);
        } catch (error) {
          console.error(
            "Erro ao atualizar trilha após deletar materiais:",
            error,
          );
          alert(
            "Erro ao atualizar a trilha. A exclusão pode não ter sido salva.",
          );
        }
      }
    }
  };

  const handleMaterialSave = async (materialData: Omit<Material, "id">) => {
    console.log("🔵 handleMaterialSave chamado com:", {
      materialData,
      selectedModuleId,
      materialEditorMode,
      isEditing,
      id,
    });

    if (!selectedModuleId) {
      console.log("❌ Erro: selectedModuleId não definido");
      return;
    }

    // Não criar quiz aqui - será criado quando salvar a trilha
    console.log(
      "📝 Material adicionado localmente. Quiz será criado ao salvar a trilha.",
    );

    setModules(
      modules.map((module) => {
        if (module.id === selectedModuleId) {
          let updatedMaterials: Material[];

          if (materialEditorMode === "add") {
            const newMaterial: Material = {
              ...materialData,
              id: Date.now(),
              icon: getMaterialIcon(materialData.type),
              color: getMaterialColor(materialData.type),
            };
            updatedMaterials = [...module.materials, newMaterial];
          } else {
            updatedMaterials = module.materials.map((material) =>
              material.id === editingMaterial?.id
                ? {
                    ...materialData,
                    id: material.id,
                    icon: getMaterialIcon(materialData.type),
                    color: getMaterialColor(materialData.type),
                  }
                : material,
            );
          }

          return {
            ...module,
            materials: updatedMaterials,
            steps: updatedMaterials.length,
          };
        }
        return module;
      }),
    );

    setMaterialEditorOpen(false);
    setEditingMaterial(null);
  };

  // Gerenciamento de tags
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData({ ...formData, tags: [...formData.tags, trimmedTag] });
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter((tag: string) => tag !== tagToRemove),
    });
  };

  // Funções para gerenciar Quiz
  const openQuizManager = async (material: Material, moduleId: number) => {
    setEditingModuleId(moduleId);
    setEditingQuizMaterialId(material.id);
    setQuizManagerOpen(true);
  };

  const closeQuizManager = () => {
    setQuizManagerOpen(false);
    setEditingModuleId(null);
    setEditingQuizMaterialId(null);
  };

  // Formatar dados da trilha para enviar ao backend
  const formatTrailDataForBackend = (isDraft: boolean = false) => {
    if (!formData.name.trim()) {
      alert("Nome da trilha é obrigatório");
      return null;
    }

    // Estruturar modules no formato esperado pelo changelog
    const modulesForChangelog = modules.map((module) => ({
      id: module.id,
      name: module.name,
      description: module.description,
      steps: module.steps,
      materials: module.materials,
    }));

    const trailData = {
      titulo: formData.name,
      descricao: formData.description,
      objetivos: formData.objectives,
      publico_alvo: formData.targetAudience,
      prazo_recomendado: formData.deadline ? parseInt(formData.deadline) : null,
      versao: "1.0", // Campo obrigatório no backend
      changelog: JSON.stringify({
        modules: modulesForChangelog,
        tags: formData.tags,
        deadline: formData.deadline,
      }),
      status: isDraft ? "Rascunho" : "Publicada",
    };

    return trailData;
  };

  // Salvar trilha (como rascunho)
  const handleSaveDraft = async () => {
    const trailData = formatTrailDataForBackend(true);
    if (!trailData) return;

    try {
      if (isEditing && id) {
        await updateTrail(parseInt(id), trailData);
      } else {
        await createTrail(trailData);
      }

      try {
        localStorage.removeItem(draftKey);
      } catch {
        // ignore
      }

      navigate("/admin");
    } catch (error) {
      console.error("Erro ao salvar rascunho:", error);
      alert("Erro ao salvar rascunho. Verifique o console para mais detalhes.");
    }
  };

  const handlePublish = async () => {
    const draftData = formatTrailDataForBackend(true);
    if (!draftData) return;

    try {
      let trailId: number | undefined;

      if (isEditing && id) {
        trailId = parseInt(id);
        await updateTrail(trailId, draftData);
      } else {
        const created = await createTrail(draftData);
        trailId = created?.id ?? (created as any)?.id_trilha;
      }

      if (!trailId) {
        throw new Error("ID da trilha não encontrado após salvar rascunho");
      }

      try {
        await trailService.publishTrail(trailId);
      } catch (publishError) {
        // Fallback: atualizar status diretamente caso endpoint de publish não exista
        const publishData = formatTrailDataForBackend(false);
        if (publishData) {
          await updateTrail(trailId, publishData);
        } else {
          throw publishError;
        }
      }

      alert("Trilha publicada com sucesso!");
    } catch (error) {
      console.error("Erro ao publicar trilha:", error);
      alert("Erro ao publicar trilha. Verifique o console para mais detalhes.");
    }

    try {
      localStorage.removeItem(draftKey);
    } catch {
      // ignore
    }

    navigate("/admin");
  };

  return (
    <div className={`min-h-screen ${pageClass}`}>
      {/* Header */}
      <div
        className={`border-b px-4 py-6 ${isDark ? "border-gray-800 bg-gray-900" : "border-gray-200 bg-white"}`}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate("/admin")}
              className={`transition-colors ${isDark ? "text-gray-300 hover:text-gray-100" : "text-gray-600 hover:text-gray-900"}`}
            >
              <svg
                className="h-6 w-6"
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
            <div>
              <h1 className="text-2xl font-bold">
                {isEditing ? "Editar Trilha" : "Nova Trilha"}
              </h1>
              <p className={mutedText}>
                {isEditing
                  ? "Modifique os dados e conteúdo da trilha"
                  : "Crie uma nova trilha de aprendizado"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className={`h-9 w-9 rounded-full border text-sm font-semibold transition-all ${isDark ? "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700" : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"}`}
              title="Alternar tema"
            >
              {isDark ? "☾" : "☀"}
            </button>
            <button
              onClick={() => navigate("/admin")}
              className={`rounded-lg px-4 py-2 transition-colors ${isDark ? "border border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700" : "border border-gray-300 text-gray-700 hover:bg-gray-50"}`}
            >
              Cancelar
            </button>
            <button
              onClick={handleSaveDraft}
              className="rounded-lg bg-gray-600 px-6 py-2 text-white transition-colors hover:bg-gray-700"
            >
              {isEditing ? "Salvar Rascunho" : "Salvar Rascunho"}
            </button>
            <button
              onClick={handlePublish}
              className="rounded-lg bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Publicar
            </button>
          </div>
        </div>
      </div>

      {/* Draft banner (user can restore or ignore) */}
      {pendingDraft && (
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div
            className={`flex items-center justify-between rounded-md p-3 ${isDark ? "border-l-4 border-yellow-500 bg-yellow-900/30 text-yellow-100" : "border-l-4 border-yellow-400 bg-yellow-50 text-yellow-800"}`}
          >
            <div className="text-sm">
              Rascunho local encontrado
              {pendingDraft.savedAt
                ? ` — salvo em ${new Date(pendingDraft.savedAt).toLocaleString()}`
                : ""}
              .
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={restoreDraft}
                className="rounded bg-yellow-600 px-3 py-1 text-white transition-colors hover:bg-yellow-700"
              >
                Restaurar rascunho
              </button>
              <button
                onClick={ignoreDraft}
                className={`rounded px-3 py-1 transition-colors ${isDark ? "border border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700" : "border border-gray-300 hover:bg-gray-50"}`}
              >
                Ignorar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4 py-6">
        <div
          className={`mb-8 flex space-x-1 rounded-lg p-1 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
        >
          <button
            onClick={() => setActiveTab(TabId.INFO)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === TabId.INFO
                ? isDark
                  ? "bg-gray-800 text-blue-400 shadow-sm"
                  : "bg-white text-blue-600 shadow-sm"
                : isDark
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📝 Informações Básicas
          </button>
          <button
            onClick={() => setActiveTab(TabId.CONTENT)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === TabId.CONTENT
                ? isDark
                  ? "bg-gray-800 text-blue-400 shadow-sm"
                  : "bg-white text-blue-600 shadow-sm"
                : isDark
                  ? "text-gray-400 hover:text-gray-200"
                  : "text-gray-600 hover:text-gray-900"
            }`}
          >
            📚 Módulos e Conteúdo
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === TabId.INFO ? (
          /* Aba de Informações Básicas */
          <div
            className={`rounded-lg border p-6 shadow-sm ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
          >
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Nome da Trilha */}
              <div className="lg:col-span-2">
                <label className={labelClass}>Nome da Trilha *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={inputClass}
                  placeholder="Ex: Onboarding FAURG"
                />
              </div>

              {/* Descrição */}
              <div className="lg:col-span-2">
                <label className={labelClass}>Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className={inputClass}
                  placeholder="Descreva o objetivo e conteúdo da trilha..."
                />
              </div>

              {/* Objetivos */}
              <div>
                <label className={labelClass}>Objetivos de Aprendizagem</label>
                <textarea
                  value={formData.objectives}
                  onChange={(e) =>
                    setFormData({ ...formData, objectives: e.target.value })
                  }
                  rows={4}
                  className={inputClass}
                  placeholder="Liste os principais objetivos que o aluno deve alcançar..."
                />
              </div>

              {/* Público-alvo */}
              <div>
                <label className={labelClass}>Público-alvo</label>
                <textarea
                  value={formData.targetAudience}
                  onChange={(e) =>
                    setFormData({ ...formData, targetAudience: e.target.value })
                  }
                  rows={4}
                  className={inputClass}
                  placeholder="Descreva para quem esta trilha é direcionada..."
                />
              </div>

              {/* Prazo */}
              <div>
                <label className={labelClass}>Prazo para Conclusão</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) =>
                    setFormData({ ...formData, deadline: e.target.value })
                  }
                  className={inputClass}
                />
              </div>

              {/* Tags */}
              <div>
                <label className={labelClass}>Tags/Categorias</label>
                <div className="space-y-2">
                  <div className="mb-2 flex flex-wrap gap-2">
                    {formData.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-800"
                      >
                        {String(tag)}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    placeholder="Digite uma tag e pressione Enter"
                    className={inputClass}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Aba de Módulos e Conteúdo */
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Sidebar - Lista de Módulos */}
            <div className="lg:col-span-1">
              <div className={cardClass}>
                <div
                  className={`border-b p-4 ${isDark ? "border-gray-700" : "border-gray-200"}`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Módulos</h3>
                    <button
                      onClick={addModule}
                      className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white transition-colors hover:bg-blue-700"
                    >
                      + Módulo
                    </button>
                  </div>
                </div>

                <div
                  className={`max-h-96 divide-y overflow-y-auto ${isDark ? "divide-gray-700" : "divide-gray-200"}`}
                >
                  {modules.map((module) => (
                    <div
                      key={module.id}
                      className={`cursor-pointer p-4 transition-colors ${
                        selectedModuleId === module.id
                          ? isDark
                            ? "border-r-4 border-blue-400 bg-blue-900/30"
                            : "border-r-4 border-blue-600 bg-blue-50"
                          : isDark
                            ? "hover:bg-gray-800"
                            : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedModuleId(module.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={module.name}
                            onChange={(e) =>
                              updateModuleName(module.id, e.target.value)
                            }
                            className={`w-full border-none bg-transparent p-0 font-medium focus:ring-0 focus:outline-none ${isDark ? "text-gray-100" : "text-gray-900"}`}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <p className={`mt-1 text-sm ${mutedText}`}>
                            {module.materials.length}{" "}
                            {module.materials.length === 1 ? "item" : "itens"}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteModule(module.id);
                          }}
                          className={`ml-2 transition-colors ${isDark ? "text-gray-400 hover:text-red-400" : "text-gray-400 hover:text-red-600"}`}
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}

                  {modules.length === 0 && (
                    <div className={`p-8 text-center ${mutedText}`}>
                      <svg
                        className={`mx-auto mb-4 h-12 w-12 ${isDark ? "text-gray-600" : "text-gray-300"}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                        />
                      </svg>
                      <p>Nenhum módulo criado ainda.</p>
                      <p className="text-sm">
                        Clique em "+ Módulo" para começar.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Área Principal - Conteúdo do Módulo */}
            <div className="lg:col-span-2">
              {selectedModuleId ? (
                <div className={cardClass}>
                  {(() => {
                    const selectedModule = modules.find(
                      (m) => m.id === selectedModuleId,
                    );
                    if (!selectedModule) return null;

                    return (
                      <>
                        <div
                          className={`border-b p-6 ${isDark ? "border-gray-700" : "border-gray-200"}`}
                        >
                          <div className="flex items-center justify-between">
                            <h3 className="text-xl font-semibold">
                              {selectedModule.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                              {selectedModule.materials.length > 0 && (
                                <>
                                  {selectedMaterials.size === 0 ? (
                                    <button
                                      onClick={selectAllMaterials}
                                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                    >
                                      ☑️ Selecionar Todos
                                    </button>
                                  ) : selectedMaterials.size ===
                                    selectedModule.materials.length ? (
                                    <button
                                      onClick={deselectAllMaterials}
                                      className="rounded-lg bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
                                    >
                                      ☐ Desselecionar Todos
                                    </button>
                                  ) : (
                                    <button
                                      onClick={selectAllMaterials}
                                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                                    >
                                      ☑️ Selecionar Todos
                                    </button>
                                  )}
                                </>
                              )}
                              {selectedMaterials.size > 0 && (
                                <button
                                  onClick={deleteSelectedMaterials}
                                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
                                >
                                  🗑️ Deletar {selectedMaterials.size}
                                </button>
                              )}
                              <button
                                onClick={() => addMaterial(selectedModuleId)}
                                className="rounded-lg bg-green-600 px-4 py-2 text-white transition-colors hover:bg-green-700"
                              >
                                + Adicionar Material
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          {selectedModule.materials.length === 0 ? (
                            <div className="py-12 text-center">
                              <svg
                                className={`mx-auto mb-4 h-16 w-16 ${isDark ? "text-gray-600" : "text-gray-300"}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                              <h4 className="mb-2 text-lg font-medium">
                                Nenhum material adicionado
                              </h4>
                              <p className={`${mutedText} mb-6`}>
                                Comece adicionando vídeos, PDFs, quizzes ou
                                outros materiais.
                              </p>
                              <button
                                onClick={() => addMaterial(selectedModuleId)}
                                className="rounded-lg bg-green-600 px-6 py-3 text-white transition-colors hover:bg-green-700"
                              >
                                Adicionar Primeiro Material
                              </button>
                            </div>
                          ) : (
                            <>
                              {/* Instruções de reordenação */}
                              <div
                                className={`mb-4 rounded-lg border p-3 ${isDark ? "border-blue-500/50 bg-blue-900/20" : "border-blue-200 bg-blue-50"}`}
                              >
                                <div className="flex items-start space-x-2">
                                  <svg
                                    className={`mt-0.5 h-5 w-5 ${isDark ? "text-blue-200" : "text-blue-600"}`}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                  </svg>
                                  <div
                                    className={`text-sm ${isDark ? "text-blue-100" : "text-blue-800"}`}
                                  >
                                    <p className="mb-1 font-medium">
                                      Reordenação de Materiais
                                    </p>
                                    <p>
                                      Arraste e solte os materiais ou use as
                                      setas ⬆️⬇️ para definir a ordem na trilha.
                                      A numeração (1, 2, 3...) mostra a
                                      sequência que os usuários seguirão.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-1">
                                {selectedModule.materials.map(
                                  (material, index) => (
                                    <React.Fragment key={material.id}>
                                      {/* Zona de drop antes do primeiro item */}
                                      {index === 0 && (
                                        <div
                                          onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = "move";
                                          }}
                                          onDrop={(e) =>
                                            handleDrop(selectedModuleId, 0, e)
                                          }
                                          className={`h-2 transition-all ${
                                            draggedItem &&
                                            (draggedItem.moduleId !==
                                              selectedModuleId ||
                                              draggedItem.materialIndex !== 0)
                                              ? "rounded border-2 border-dashed border-blue-400 bg-blue-200"
                                              : ""
                                          }`}
                                        />
                                      )}

                                      <div
                                        draggable
                                        onDragStart={(e) => {
                                          handleDragStart(
                                            selectedModuleId,
                                            index,
                                          );
                                          e.dataTransfer.effectAllowed = "move";
                                        }}
                                        onDragEnd={handleDragEnd}
                                        className={`flex cursor-move items-center justify-between rounded-lg border-2 bg-gray-50 p-4 transition-all ${
                                          draggedItem?.moduleId ===
                                            selectedModuleId &&
                                          draggedItem?.materialIndex === index
                                            ? "border-blue-300 bg-blue-50 opacity-50"
                                            : selectedMaterials.has(material.id)
                                              ? "border-blue-400 bg-blue-100"
                                              : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                        }`}
                                      >
                                        <div className="flex items-center space-x-3">
                                          {/* Checkbox */}
                                          <input
                                            type="checkbox"
                                            checked={selectedMaterials.has(
                                              material.id,
                                            )}
                                            onChange={() =>
                                              toggleSelectMaterial(material.id)
                                            }
                                            onClick={(e) => e.stopPropagation()}
                                            className="h-5 w-5 cursor-pointer"
                                          />
                                          {/* Indicador de posição */}
                                          <div className="flex flex-col items-center text-xs text-gray-400">
                                            <span className="font-bold">
                                              {index + 1}
                                            </span>
                                            <svg
                                              className="h-4 w-4 cursor-move"
                                              fill="currentColor"
                                              viewBox="0 0 24 24"
                                            >
                                              <path d="M3 15h18v-2H3v2zm0 4h18v-2H3v2zm0-8h18V9H3v2zm0-6v2h18V5H3z" />
                                            </svg>
                                          </div>

                                          <div
                                            className="flex h-10 w-10 items-center justify-center rounded-lg font-semibold text-white"
                                            style={{
                                              backgroundColor: material.color,
                                            }}
                                          >
                                            {material.icon}
                                          </div>
                                          <div>
                                            <h4 className="font-medium text-gray-900">
                                              {material.name}
                                            </h4>
                                            <p
                                              className={`text-sm capitalize ${mutedText}`}
                                            >
                                              {material.type}
                                            </p>
                                          </div>
                                        </div>

                                        <div className="flex items-center space-x-2">
                                          {/* Botões de reordenação manual */}
                                          <div className="flex flex-col space-y-1">
                                            <button
                                              onClick={() =>
                                                moveMaterialUp(
                                                  selectedModuleId,
                                                  index,
                                                )
                                              }
                                              disabled={index === 0}
                                              className="p-1 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                                              title="Mover para cima"
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
                                                  d="M5 15l7-7 7 7"
                                                />
                                              </svg>
                                            </button>
                                            <button
                                              onClick={() =>
                                                moveMaterialDown(
                                                  selectedModuleId,
                                                  index,
                                                )
                                              }
                                              disabled={
                                                index ===
                                                selectedModule.materials
                                                  .length -
                                                  1
                                              }
                                              className="p-1 text-gray-400 transition-colors hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-30"
                                              title="Mover para baixo"
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
                                                  d="M19 9l-7 7-7-7"
                                                />
                                              </svg>
                                            </button>
                                          </div>

                                          {/* Botões de ação */}
                                          <button
                                            onClick={() =>
                                              editMaterial(
                                                selectedModuleId,
                                                material,
                                              )
                                            }
                                            className="p-1 text-blue-600 transition-colors hover:text-blue-800"
                                            title="Editar material"
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
                                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                              />
                                            </svg>
                                          </button>
                                          {material.type === "quiz" && (
                                            <button
                                              onClick={() =>
                                                openQuizManager(
                                                  material,
                                                  selectedModuleId,
                                                )
                                              }
                                              className="p-1 text-purple-600 transition-colors hover:text-purple-800"
                                              title="Configurar perguntas do quiz"
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
                                                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                                />
                                              </svg>
                                            </button>
                                          )}
                                          <button
                                            onClick={() =>
                                              deleteMaterial(
                                                selectedModuleId,
                                                material.id,
                                              )
                                            }
                                            className="p-1 text-red-600 transition-colors hover:text-red-800"
                                            title="Excluir material"
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
                                          </button>
                                        </div>
                                      </div>

                                      {/* Zona de drop após cada item */}
                                      <div
                                        onDragOver={(e) => {
                                          e.preventDefault();
                                          e.dataTransfer.dropEffect = "move";
                                        }}
                                        onDrop={(e) =>
                                          handleDrop(
                                            selectedModuleId,
                                            index + 1,
                                            e,
                                          )
                                        }
                                        className={`h-2 transition-all ${
                                          draggedItem &&
                                          (draggedItem.moduleId !==
                                            selectedModuleId ||
                                            draggedItem.materialIndex !==
                                              index + 1)
                                            ? "rounded border-2 border-dashed border-blue-400 bg-blue-200"
                                            : ""
                                        }`}
                                      />
                                    </React.Fragment>
                                  ),
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm">
                  <svg
                    className="mx-auto mb-4 h-16 w-16 text-gray-300"
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
                  <h3 className="mb-2 text-lg font-medium text-gray-900">
                    Selecione um módulo
                  </h3>
                  <p className="text-gray-600">
                    Escolha um módulo na lista ao lado para visualizar e editar
                    seus materiais.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Material Editor Modal */}
      {materialEditorOpen && (
        <MaterialEditor
          isOpen={materialEditorOpen}
          onClose={() => {
            setMaterialEditorOpen(false);
            setEditingMaterial(null);
          }}
          onSave={handleMaterialSave}
          material={editingMaterial || undefined}
          mode={materialEditorMode}
        />
      )}

      {/* Quiz Manager Modal */}
      {quizManagerOpen &&
        editingModuleId !== null &&
        editingQuizMaterialId !== null &&
        (() => {
          const module = modules.find((m) => m.id === editingModuleId);
          const material = module?.materials.find(
            (mat) => mat.id === editingQuizMaterialId,
          );

          return (
            <QuizManagerAPI
              id_modulo={editingModuleId}
              id_quiz={material?.quizId || undefined}
              questoesLocais={material?.questoes || []}
              onSaveLocal={(questoes) => {
                // Salvar questões localmente no material
                setModules(
                  modules.map((m) => {
                    if (m.id === editingModuleId) {
                      return {
                        ...m,
                        materials: m.materials.map((mat) => {
                          if (mat.id === editingQuizMaterialId) {
                            return { ...mat, questoes };
                          }
                          return mat;
                        }),
                      };
                    }
                    return m;
                  }),
                );
              }}
              onClose={closeQuizManager}
            />
          );
        })()}
    </div>
  );
}
