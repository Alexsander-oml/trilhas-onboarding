import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTrails } from "../contexts/TrailsContext";
import { useTheme } from "../contexts/ThemeContext";
import ProfileMenu from "./ProfileMenu";
import NotificationPanel from "./NotificationPanel";
import FAURGLogo from "../assets/FAURG-logo-horizontal-reduzida.png";

interface StepData {
  id: number;
  type: string;
  name: string;
  icon: string;
  color: string;
}

export default function CreateTrail() {
  const navigate = useNavigate();
  const { addTrail } = useTrails();
  const { isDark, toggleTheme } = useTheme();

  const inputClass = `w-full rounded-lg border px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"}`;
  const tagInputClass = `flex-1 rounded-l-lg border px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"}`;
  const smallInputClass = `w-full rounded-md border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-700 text-gray-100 placeholder-gray-400" : "border-gray-300 bg-white text-gray-900"}`;
  const labelClass = `mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`;
  const sectionTitleClass = `text-2xl font-bold ${isDark ? "text-gray-100" : "text-gray-800"}`;
  const mutedTextClass = `${isDark ? "text-gray-400" : "text-gray-600"}`;
  const cardClass = `rounded-xl p-8 shadow-lg ${isDark ? "bg-gray-800 border border-gray-700 text-gray-100" : "bg-white text-gray-900"}`;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    objectives: "",
    tags: [] as string[],
    targetAudience: "",
    deadline: "",
  });

  const [modules, setModules] = useState([
    {
      id: 1,
      name: "Módulo 1 - Introdução",
      steps: 5,
      materials: [
        {
          id: 1,
          type: "video",
          name: "Boas-vindas à FAURG",
          icon: "🎥",
          color: "#DC2626",
        },
        {
          id: 2,
          type: "pdf",
          name: "Manual do Colaborador",
          icon: "📄",
          color: "#059669",
        },
        {
          id: 3,
          type: "quiz",
          name: "Avaliação Inicial",
          icon: "✅",
          color: "#7C3AED",
        },
        {
          id: 4,
          type: "reading",
          name: "Confirmação de leitura",
          icon: "📖",
          color: "#0891B2",
        },
        {
          id: 5,
          type: "video",
          name: "Tour pela empresa",
          icon: "🎥",
          color: "#DC2626",
        },
      ],
    },
  ]);

  const [showStepModal, setShowStepModal] = useState(false);
  const [currentModuleId, setCurrentModuleId] = useState<number | null>(null);
  const [editingStep, setEditingStep] = useState<{
    moduleId: number;
    stepIndex: number;
  } | null>(null);
  const [draggedItem, setDraggedItem] = useState<{
    moduleId: number;
    materialIndex: number;
  } | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagAdd = (tagText: string) => {
    if (tagText.trim() && !formData.tags.includes(tagText.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tagText.trim()],
      }));
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const addNewModule = () => {
    const newModule = {
      id: modules.length + 1,
      name: `Módulo ${modules.length + 1} - Novo Módulo`,
      steps: 0,
      materials: [],
    };
    setModules([...modules, newModule]);
  };

  const removeModule = (moduleId: number) => {
    setModules(modules.filter((module) => module.id !== moduleId));
  };

  const addNewStep = (moduleId: number) => {
    setCurrentModuleId(moduleId);
    setShowStepModal(true);
    setEditingStep(null);
  };

  const editStep = (moduleId: number, stepIndex: number) => {
    setCurrentModuleId(moduleId);
    setEditingStep({ moduleId, stepIndex });
    setShowStepModal(true);
  };

  const addStepToModule = (moduleId: number, stepData: StepData) => {
    setModules((prevModules) =>
      prevModules.map((module) => {
        if (module.id === moduleId) {
          return {
            ...module,
            materials: [...module.materials, stepData],
            steps: module.materials.length + 1,
          };
        }
        return module;
      }),
    );
    setShowStepModal(false);
    setCurrentModuleId(null);
  };

  const updateStepInModule = (
    moduleId: number,
    stepIndex: number,
    stepData: StepData,
  ) => {
    setModules((prevModules) =>
      prevModules.map((module) => {
        if (module.id === moduleId) {
          const newMaterials = [...module.materials];
          newMaterials[stepIndex] = stepData;
          return { ...module, materials: newMaterials };
        }
        return module;
      }),
    );
    setShowStepModal(false);
    setEditingStep(null);
    setCurrentModuleId(null);
  };

  const getStepIcon = (type: string): string => {
    const icons: { [key: string]: string } = {
      video: "🎥",
      pdf: "📄",
      quiz: "✅",
      reading: "📖",
      audio: "🎧",
      link: "🔗",
    };
    return icons[type] || "📌";
  };

  const getStepColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      video: "#DC2626",
      pdf: "#059669",
      quiz: "#7C3AED",
      reading: "#0891B2",
      audio: "#F59E0B",
      link: "#3B82F6",
    };
    return colors[type] || "#6B7280";
  };

  const handleSaveDraft = () => {
    console.log("Rascunho salvo:", {
      name: formData.name,
      description: formData.description,
      objectives: formData.objectives,
      tags: formData.tags,
      targetAudience: formData.targetAudience,
      deadline: formData.deadline,
      modules: modules,
    });

    alert("Rascunho salvo com sucesso!");
  };

  const handlePublishTrail = () => {
    if (!formData.name.trim()) {
      alert("Por favor, preencha o nome da trilha");
      return;
    }
    if (modules.length === 0) {
      alert("Adicione pelo menos um módulo à trilha");
      return;
    }

    addTrail({
      name: formData.name,
      description: formData.description,
      objectives: formData.objectives,
      tags: formData.tags,
      targetAudience: formData.targetAudience,
      deadline: formData.deadline,
      modules: modules,
    });

    alert("Trilha publicada com sucesso!");
    navigate("/admin");
  };

  const handleCancel = () => {
    if (
      confirm(
        "Tem certeza que deseja cancelar? Todas as alterações serão perdidas.",
      )
    ) {
      navigate("/admin");
    }
  };

  const handleDragStart = (
    e: React.DragEvent,
    moduleId: number,
    materialIndex: number,
  ) => {
    setDraggedItem({ moduleId, materialIndex });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (
    e: React.DragEvent,
    moduleId: number,
    dropIndex: number,
  ) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.moduleId !== moduleId) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    const dragIndex = draggedItem.materialIndex;

    if (dragIndex === dropIndex) {
      setDraggedItem(null);
      setDragOverIndex(null);
      return;
    }

    setModules((prevModules) =>
      prevModules.map((module) => {
        if (module.id === moduleId) {
          const newMaterials = [...module.materials];
          const draggedMaterial = newMaterials[dragIndex];

          newMaterials.splice(dragIndex, 1);

          const insertIndex = dragIndex < dropIndex ? dropIndex - 1 : dropIndex;
          newMaterials.splice(insertIndex, 0, draggedMaterial);

          return { ...module, materials: newMaterials };
        }
        return module;
      }),
    );

    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}
    >
      {/* Navbar FAURG */}
      <header
        className="relative z-40 font-semibold shadow-md"
        style={{ backgroundColor: "#233E97", height: "64px" }}
      >
        <div className="w-full px-8">
          <div className="flex h-full items-end justify-between pb-2">
            {/* Logo FAURG */}
            <div className="ml-6 flex items-center">
              <img
                src={FAURGLogo}
                alt="FAURG Logo"
                className="h-8 object-contain"
              />
            </div>

            {/* Menu de navegação centralizado */}
            <nav className="hidden flex-1 justify-center space-x-8 md:flex">
              <div className="relative">
                <button
                  onClick={() => navigate("/admin")}
                  className="flex cursor-pointer items-center px-4 py-4 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:brightness-125 md:text-base"
                  style={{ color: "rgba(255, 255, 255, 0.84)" }}
                >
                  Página Inicial
                </button>
                <div
                  className="absolute right-0 left-0 h-[4px] rounded-full bg-white transition-all duration-300"
                  style={{ bottom: -9 }}
                ></div>
              </div>
              <div className="relative">
                <button
                  onClick={() => navigate("/trails")}
                  className="flex cursor-pointer items-center px-4 py-4 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:brightness-125 md:text-base"
                  style={{ color: "rgba(255, 255, 255, 0.84)" }}
                >
                  Trilhas
                </button>
              </div>
              <div className="relative">
                <button
                  onClick={() => navigate("/admin/register")}
                  className="flex cursor-pointer items-center px-4 py-4 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:brightness-125 md:text-base"
                  style={{ color: "rgba(255, 255, 255, 0.84)" }}
                >
                  Usuários
                </button>
              </div>
              <div className="relative">
                <button
                  onClick={() => navigate("/admin/reports")}
                  className="flex cursor-pointer items-center px-4 py-4 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:brightness-125 md:text-base"
                  style={{ color: "rgba(255, 255, 255, 0.84)" }}
                >
                  Relatórios
                </button>
              </div>
              <div className="relative">
                <button
                  onClick={() => navigate("/admin/certificados")}
                  className="flex cursor-pointer items-center px-4 py-4 text-sm font-semibold transition-all duration-300 hover:scale-105 hover:brightness-125 md:text-base"
                  style={{ color: "rgba(255, 255, 255, 0.84)" }}
                >
                  Certificados
                </button>
              </div>
            </nav>

            {/* Ícones do lado direito */}
            <div className="mr-6 flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className={`rounded-full p-2.5 shadow-lg transition-all duration-200 hover:shadow-xl hover:scale-105 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
                aria-label={isDark ? "Modo claro" : "Modo escuro"}
              >
                {isDark ? (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: "#e5e7eb" }}>
                    <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" style={{ color: "#233E97" }}>
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

      {/* Header Semicircular */}
      <div
        className="relative w-full overflow-hidden shadow-md"
        style={{ backgroundColor: "#233E97", height: "220px" }}
      >
        <div
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 transform rounded-full opacity-20"
          style={{
            width: "400px",
            height: "200px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        ></div>

        <div className="relative z-10 px-8 py-12">
          <div className="mx-auto max-w-7xl">
            <h1 className="mb-4 text-4xl font-bold text-white">
              Criar Nova Trilha
            </h1>
            <p className="text-xl text-white/90">
              Configure uma nova trilha de aprendizagem para seus colaboradores
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="mx-auto max-w-7xl px-8 py-8">
        {/* Formulário Único */}
        <div className={cardClass}>
          {/* Seção 1: Informações da Trilha */}
          <div className="mb-12">
            <div className="mb-6 flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                1
              </div>
              <h2 className={sectionTitleClass}>
                Informações da Trilha
              </h2>
            </div>

            <div className="space-y-6 pl-11">
              <div>
                <label className={labelClass}>
                  Nome da trilha *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Onboarding - FAURG"
                  className={inputClass}
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Descrição
                </label>
                <textarea
                  placeholder="Descreva brevemente o conteúdo desta trilha..."
                  rows={4}
                  className={inputClass}
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Objetivos de aprendizagem
                </label>
                <textarea
                  placeholder="Quais são os objetivos de aprendizagem desta trilha?"
                  rows={4}
                  className={inputClass}
                  value={formData.objectives}
                  onChange={(e) =>
                    handleInputChange("objectives", e.target.value)
                  }
                />
              </div>

              <div>
                <label className={labelClass}>
                  Tags / Área temática
                </label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-medium ${isDark ? "bg-blue-900/30 text-blue-300" : "bg-blue-100 text-blue-800"}`}
                    >
                      {tag}
                      <button
                        onClick={() => handleTagRemove(tag)}
                        className={isDark ? "ml-2 text-blue-300 hover:text-blue-200" : "ml-2 text-blue-600 hover:text-blue-800"}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex">
                  <input
                    type="text"
                    placeholder="Adicionar nova tag"
                    className={tagInputClass}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        handleTagAdd(e.currentTarget.value);
                        e.currentTarget.value = "";
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.currentTarget
                        .previousElementSibling as HTMLInputElement;
                      handleTagAdd(input.value);
                      input.value = "";
                    }}
                    className="rounded-r-lg bg-blue-600 px-4 py-2 text-white transition-all hover:bg-blue-700"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Público-alvo
                </label>
                <select
                  className={inputClass}
                  value={formData.targetAudience}
                  onChange={(e) =>
                    handleInputChange("targetAudience", e.target.value)
                  }
                >
                  <option>Selecione o público-alvo</option>
                  <option>Todos os colaboradores</option>
                  <option>Novos colaboradores</option>
                  <option>Gestores</option>
                  <option>Área comercial</option>
                  <option>Área técnica</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Prazo final (opcional)
                </label>
                <input
                  type="date"
                  className={inputClass}
                  value={formData.deadline}
                  onChange={(e) =>
                    handleInputChange("deadline", e.target.value)
                  }
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Módulos e Etapas */}
          <div className="mb-12">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                  2
                </div>
                <div>
                  <h2 className={sectionTitleClass}>
                    Módulos e Etapas
                  </h2>
                  <p className={mutedTextClass}>
                    Organize o conteúdo em módulos e adicione diferentes tipos
                    de materiais
                  </p>
                </div>
              </div>
              <button
                onClick={addNewModule}
                className="flex items-center rounded-lg border-2 border-blue-600 bg-blue-600 px-4 py-2 font-medium text-white shadow-md transition-all hover:border-blue-700 hover:bg-blue-700 hover:shadow-lg"
              >
                <svg
                  className="mr-2 h-5 w-5"
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
                Novo Módulo
              </button>
            </div>

            {/* Lista de Módulos */}
            <div className="space-y-6 pl-11">
              {modules.map((module) => (
                <div
                  key={module.id}
                  className={`rounded-lg border p-6 ${isDark ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-white"}`}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`mr-3 flex h-6 w-6 items-center justify-center rounded ${isDark ? "bg-gray-600" : "bg-gray-400"}`}>
                        <svg
                          className="h-4 w-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM4 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className={`text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                          {module.name}
                        </h3>
                        <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {module.steps} etapas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className={`p-2 transition-all ${isDark ? "text-gray-400 hover:text-blue-300" : "text-gray-400 hover:text-blue-600"}`}>
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
                      <button
                        onClick={() => removeModule(module.id)}
                        className={`p-2 transition-all ${isDark ? "text-gray-400 hover:text-red-400" : "text-gray-400 hover:text-red-600"}`}
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

                  {/* Materiais do módulo */}
                  <div className="space-y-3">
                    {module.materials.map((material, index) => (
                      <div
                        key={index}
                        draggable
                        onDragStart={(e) =>
                          handleDragStart(e, module.id, index)
                        }
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, module.id, index)}
                        onDragEnd={handleDragEnd}
                        className={`flex cursor-move items-center rounded-lg p-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                          isDark ? "bg-gray-700 border border-gray-600 text-gray-100" : "bg-white"
                        } ${
                          draggedItem?.moduleId === module.id &&
                          draggedItem?.materialIndex === index
                            ? "scale-95 opacity-50"
                            : ""
                        } ${
                          dragOverIndex === index
                            ? isDark
                              ? "ring-2 ring-blue-500 ring-opacity-50 bg-blue-900/30"
                              : "ring-opacity-50 bg-blue-50 ring-2 ring-blue-400"
                            : ""
                        }`}
                      >
                        <div className="mr-3 cursor-grab text-gray-400 hover:text-gray-600 active:cursor-grabbing">
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
                              d="M4 8h16M4 16h16"
                            />
                          </svg>
                        </div>

                        <div className="flex flex-1 items-center">
                          <div
                            className="mr-3 flex h-8 w-8 items-center justify-center rounded"
                            style={{
                              backgroundColor: material.color,
                              color: "white",
                            }}
                          >
                            <span className="text-sm">{material.icon}</span>
                          </div>
                          <div>
                            <p className={`font-medium ${isDark ? "text-gray-100" : "text-gray-800"}`}>
                              {material.name}
                            </p>
                            <p className={`text-sm capitalize ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                              {material.type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editStep(module.id, index);
                            }}
                            className={`p-1 transition-all ${isDark ? "text-gray-400 hover:text-blue-300" : "text-gray-400 hover:text-blue-600"}`}
                            title="Editar etapa"
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
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setModules((prevModules) =>
                                prevModules.map((mod) => {
                                  if (mod.id === module.id) {
                                    const newMaterials = mod.materials.filter(
                                      (_, i) => i !== index,
                                    );
                                    return {
                                      ...mod,
                                      materials: newMaterials,
                                      steps: newMaterials.length,
                                    };
                                  }
                                  return mod;
                                }),
                              );
                            }}
                            className={`p-1 transition-all ${isDark ? "text-gray-400 hover:text-red-400" : "text-gray-400 hover:text-red-600"}`}
                            title="Remover etapa"
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
                        </div>
                      </div>
                    ))}

                    {draggedItem?.moduleId === module.id && (
                      <div
                        onDragOver={(e) =>
                          handleDragOver(e, module.materials.length)
                        }
                        onDrop={(e) =>
                          handleDrop(e, module.id, module.materials.length)
                        }
                        className={`h-8 rounded-lg border-2 border-dashed transition-all ${
                          dragOverIndex === module.materials.length
                            ? isDark
                              ? "border-blue-500 bg-blue-900/30"
                              : "border-blue-400 bg-blue-50"
                            : isDark
                              ? "border-gray-600"
                              : "border-gray-300"
                        }`}
                      >
                        <div className={`flex h-full items-center justify-center text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                          {dragOverIndex === module.materials.length
                            ? "Solte aqui"
                            : "Área de drop"}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => addNewStep(module.id)}
                      className={`flex w-full items-center justify-center rounded-lg border-2 border-dashed py-3 font-medium transition-all ${isDark ? "border-blue-500 text-blue-300 hover:border-blue-400 hover:bg-blue-900/30 hover:text-blue-200" : "border-blue-400 text-blue-600 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"}`}
                    >
                      <svg
                        className="mr-2 h-5 w-5"
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
                      Adicionar Etapa
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção 3: Revisão e Publicação */}
          <div className="mb-8">
            <div className="mb-6 flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                3
              </div>
              <div>
                <h2 className={sectionTitleClass}>
                  Revisão e Publicação
                </h2>
                <p className={mutedTextClass}>
                  Revise todas as informações antes de publicar a trilha
                </p>
              </div>
            </div>

            <div className="pl-11">
              <div className={`rounded-lg border p-6 ${isDark ? "border-blue-500/40 bg-blue-900/20" : "border-blue-200 bg-blue-50"}`}>
                <div className="flex items-start">
                  <svg
                    className={`mt-0.5 mr-3 h-6 w-6 ${isDark ? "text-blue-300" : "text-blue-600"}`}
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
                  <div>
                    <h3 className={`mb-2 font-semibold ${isDark ? "text-blue-200" : "text-blue-900"}`}>
                      Pré-visualização da Trilha
                    </h3>
                    <p className={`mb-4 ${isDark ? "text-blue-100" : "text-blue-800"}`}>
                      Antes de publicar, certifique-se de que:
                    </p>
                    <ul className={`space-y-1 ${isDark ? "text-blue-100" : "text-blue-800"}`}>
                      <li>• Todas as informações básicas estão preenchidas</li>
                      <li>• Os módulos estão organizados na ordem correta</li>
                      <li>• Todos os materiais foram adicionados</li>
                      <li>• O público-alvo está definido</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className={`flex items-center justify-between border-t pt-6 ${isDark ? "border-gray-700" : "border-gray-200"}`}>
            <p className={`text-sm ${mutedTextClass}`}>
              Dica: As alterações são salvas automaticamente
            </p>

            <div className="flex space-x-4">
              <button
                onClick={handleCancel}
                className={`rounded-lg border-2 px-6 py-3 font-medium transition-all ${isDark ? "border-gray-600 bg-gray-700 text-gray-200 hover:border-gray-500 hover:bg-gray-600" : "border-gray-300 bg-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-300"}`}
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveDraft}
                className="rounded-lg px-6 py-3 font-medium text-white shadow-md transition-all hover:shadow-lg"
                style={{ backgroundColor: "#4F46E5", borderColor: "#4F46E5" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#4338CA";
                  e.currentTarget.style.borderColor = "#4338CA";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#4F46E5";
                  e.currentTarget.style.borderColor = "#4F46E5";
                }}
              >
                Salvar Rascunho
              </button>

              <button
                onClick={handlePublishTrail}
                className="rounded-lg px-6 py-3 font-medium text-white shadow-md transition-all hover:shadow-lg"
                style={{ backgroundColor: "#F97316", borderColor: "#F97316" }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#EA580C";
                  e.currentTarget.style.borderColor = "#EA580C";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#F97316";
                  e.currentTarget.style.borderColor = "#F97316";
                }}
              >
                Publicar Trilha
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Adicionar/Editar Etapa */}
      {showStepModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className={`w-96 max-w-lg rounded-lg p-6 ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
            <h3 className={`mb-4 text-lg font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}>
              {editingStep ? "Editar Etapa" : "Adicionar Nova Etapa"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className={labelClass}>
                  Tipo de Material
                </label>
                <select
                  id="stepType"
                  className={smallInputClass}
                  defaultValue={
                    editingStep
                      ? modules.find((m) => m.id === editingStep.moduleId)
                          ?.materials[editingStep.stepIndex]?.type || "video"
                      : "video"
                  }
                  onChange={(e) => {
                    const urlField = document.getElementById("urlField");
                    const fileField = document.getElementById("fileField");

                    if (urlField && fileField) {
                      if (e.target.value === "link") {
                        urlField.style.display = "block";
                        fileField.style.display = "none";
                      } else if (
                        ["pdf", "video", "audio"].includes(e.target.value)
                      ) {
                        fileField.style.display = "block";
                        urlField.style.display = "none";
                      } else {
                        urlField.style.display = "none";
                        fileField.style.display = "none";
                      }
                    }
                  }}
                >
                  <option value="video">Vídeo</option>
                  <option value="pdf">PDF</option>
                  <option value="quiz">Quiz</option>
                  <option value="reading">Leitura</option>
                  <option value="audio">Áudio</option>
                  <option value="link">Link Externo</option>
                </select>
              </div>

              <div>
                <label className={labelClass}>
                  Nome da Etapa
                </label>
                <input
                  type="text"
                  id="stepName"
                  placeholder="Digite o nome da etapa"
                  className={smallInputClass}
                  defaultValue={
                    editingStep
                      ? modules.find((m) => m.id === editingStep.moduleId)
                          ?.materials[editingStep.stepIndex]?.name || ""
                      : ""
                  }
                />
              </div>

              <div
                id="urlField"
                style={{
                  display:
                    editingStep &&
                    modules.find((m) => m.id === editingStep.moduleId)
                      ?.materials[editingStep.stepIndex]?.type === "link"
                      ? "block"
                      : "none",
                }}
              >
                <label className={labelClass}>
                  URL do Link
                </label>
                <input
                  type="url"
                  id="stepUrl"
                  placeholder="https://exemplo.com"
                  className={smallInputClass}
                />
              </div>

              <div
                id="fileField"
                style={{
                  display:
                    editingStep &&
                    ["pdf", "video", "audio"].includes(
                      modules.find((m) => m.id === editingStep.moduleId)
                        ?.materials[editingStep.stepIndex]?.type || "",
                    )
                      ? "block"
                      : "none",
                }}
              >
                <label className={labelClass}>
                  Arquivo
                </label>
                <input
                  type="file"
                  id="stepFile"
                  className={smallInputClass}
                  accept=".pdf,.mp4,.mp3,.doc,.docx"
                />
              </div>

              <div>
                <label className={labelClass}>
                  Descrição/Instruções (opcional)
                </label>
                <textarea
                  id="stepDescription"
                  placeholder="Adicione instruções ou descrição para esta etapa"
                  className={smallInputClass}
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowStepModal(false);
                  setEditingStep(null);
                  setCurrentModuleId(null);
                }}
                className={`rounded-md border px-4 py-2 transition-all ${isDark ? "border-gray-600 bg-gray-700 text-gray-200 hover:border-gray-500 hover:bg-gray-600" : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50"}`}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  const typeSelect = document.getElementById(
                    "stepType",
                  ) as HTMLSelectElement;
                  const nameInput = document.getElementById(
                    "stepName",
                  ) as HTMLInputElement;

                  if (nameInput.value.trim() && currentModuleId) {
                    const stepData: StepData = {
                      id: Date.now(),
                      type: typeSelect.value,
                      name: nameInput.value.trim(),
                      icon: getStepIcon(typeSelect.value),
                      color: getStepColor(typeSelect.value),
                    };

                    if (editingStep) {
                      updateStepInModule(
                        editingStep.moduleId,
                        editingStep.stepIndex,
                        stepData,
                      );
                    } else {
                      addStepToModule(currentModuleId, stepData);
                    }
                  }
                }}
                className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                {editingStep ? "Salvar Alterações" : "Adicionar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
