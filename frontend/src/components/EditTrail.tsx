import { useState, useEffect } from "react";
import FAURGLogo from "../assets/FAURG-logo-horizontal-reduzida.png";
import { useNavigate, useParams } from "react-router-dom";
import { useTrails } from "../contexts/TrailsContext";

interface StepData {
  type: string;
  name: string;
  icon: string;
  color: string;
}

export default function EditTrail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { updateTrail, getTrailById } = useTrails();

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

  // Carregar dados da trilha quando o componente montar
  useEffect(() => {
    if (id) {
      const trail = getTrailById(parseInt(id));
      if (trail) {
        setFormData({
          name: trail.name,
          description: trail.description,
          objectives: trail.objectives,
          tags: trail.tags,
          targetAudience: trail.targetAudience,
          deadline: trail.deadline,
        });
        setModules(trail.modules);
      }
    }
  }, [id, getTrailById]);

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
    setEditingStep(null);
    setShowStepModal(true);
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
          const newStep = {
            id: module.materials.length + 1,
            ...stepData,
            color: getStepColor(stepData.type),
          };
          return {
            ...module,
            materials: [...module.materials, newStep],
            steps: module.materials.length + 1,
          };
        }
        return module;
      }),
    );
    setShowStepModal(false);
    setCurrentModuleId(null);
    setEditingStep(null);
  };

  const updateStepInModule = (
    moduleId: number,
    stepIndex: number,
    stepData: StepData,
  ) => {
    setModules((prevModules) =>
      prevModules.map((module) => {
        if (module.id === moduleId) {
          const updatedMaterials = module.materials.map((material, index) => {
            if (index === stepIndex) {
              return {
                ...material,
                ...stepData,
                color: getStepColor(stepData.type),
              };
            }
            return material;
          });
          return {
            ...module,
            materials: updatedMaterials,
          };
        }
        return module;
      }),
    );
    setShowStepModal(false);
    setCurrentModuleId(null);
    setEditingStep(null);
  };

  const getStepColor = (type: string) => {
    const colors: { [key: string]: string } = {
      video: "#DC2626",
      pdf: "#059669",
      quiz: "#7C3AED",
      reading: "#0891B2",
      audio: "#F59E0B",
      link: "#6366F1",
    };
    return colors[type] || "#6B7280";
  };

  const getStepIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      video: "🎥",
      pdf: "📄",
      quiz: "✅",
      reading: "📖",
      audio: "🎵",
      link: "🔗",
    };
    return icons[type] || "📋";
  };

  const handleSaveChanges = () => {
    if (!formData.name.trim()) {
      alert("Por favor, preencha o nome da trilha");
      return;
    }

    if (id) {
      updateTrail(parseInt(id), {
        name: formData.name,
        description: formData.description,
        objectives: formData.objectives,
        tags: formData.tags,
        targetAudience: formData.targetAudience,
        deadline: formData.deadline,
        modules: modules,
      });

      alert("Alterações salvas com sucesso!");
      navigate("/admin");
    }
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

  // Funções para Drag and Drop
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

          // Remove o item da posição original
          newMaterials.splice(dragIndex, 1);

          // Insere o item na nova posição
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
      className="min-h-screen bg-gray-50 font-sans"
      style={{ backgroundColor: "#F9FAFB" }}
    >
      {/* Navbar FAURG - Igual às outras telas */}
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
                {/* Barra de indicação ativa */}
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
              {/* Notificação */}
              <button
                className="relative rounded-full bg-white p-2.5 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
                aria-label="Notificações"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                  style={{ color: "#233E97" }}
                >
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white shadow-md">
                  1
                </div>
              </button>

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
        {/* Semicírculo decorativo */}
        <div
          className="absolute -bottom-24 left-1/2 -translate-x-1/2 transform rounded-full opacity-20"
          style={{
            width: "400px",
            height: "200px",
            backgroundColor: "rgba(255, 255, 255, 0.1)",
          }}
        ></div>

        {/* Conteúdo do header */}
        <div className="relative z-10 px-8 py-12">
          <div className="mx-auto max-w-7xl">
            <h1 className="mb-4 text-4xl font-bold text-white">
              Editar Trilha
            </h1>
            <p className="text-xl text-white/90">
              Modifique e atualize sua trilha de aprendizagem
            </p>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="mx-auto max-w-7xl px-8 py-8">
        {/* Formulário Único */}
        <div className="rounded-xl bg-white p-8 shadow-lg">
          {/* Seção 1: Informações da Trilha */}
          <div className="mb-12">
            <div className="mb-6 flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 font-semibold text-white">
                1
              </div>
              <h2 className="text-2xl font-bold text-gray-800">
                Informações da Trilha
              </h2>
            </div>

            <div className="space-y-6 pl-11">
              {/* Nome da trilha */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nome da trilha *
                </label>
                <input
                  type="text"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                />
              </div>

              {/* Objetivos de aprendizagem */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Objetivos de aprendizagem
                </label>
                <textarea
                  rows={4}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={formData.objectives}
                  onChange={(e) =>
                    handleInputChange("objectives", e.target.value)
                  }
                />
              </div>

              {/* Tags / Área temática */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tags / Área temática
                </label>
                <div className="mb-3 flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
                    >
                      {tag}
                      <button
                        onClick={() => handleTagRemove(tag)}
                        className="ml-2 text-blue-600 hover:text-blue-800"
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
                    className="flex-1 rounded-l-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 placeholder-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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

              {/* Público-alvo */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Público-alvo
                </label>
                <select
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
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

              {/* Prazo final */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Prazo final (opcional)
                </label>
                <input
                  type="date"
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  value={formData.deadline}
                  onChange={(e) =>
                    handleInputChange("deadline", e.target.value)
                  }
                />
              </div>

              {/* Link Visualizar prévia */}
              <div className="text-right">
                <button className="font-medium text-blue-600 transition-all hover:text-blue-800">
                  Visualizar prévia
                </button>
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
                  <h2 className="text-2xl font-bold text-gray-800">
                    Módulos e Etapas
                  </h2>
                  <p className="text-gray-600">
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
                  className="rounded-lg border border-gray-200 p-6"
                  style={{ backgroundColor: "#E0E7FF" }}
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="mr-3 flex h-6 w-6 items-center justify-center rounded bg-gray-400">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M7 2a1 1 0 000 2h6a1 1 0 100-2H7zM4 6a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">
                          {module.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {module.steps} etapas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 transition-all hover:text-blue-600">
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
                        className="p-2 text-gray-400 transition-all hover:text-red-600"
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
                        className={`flex cursor-move items-center rounded-lg bg-white p-3 shadow-sm transition-all duration-200 hover:shadow-md ${
                          draggedItem?.moduleId === module.id &&
                          draggedItem?.materialIndex === index
                            ? "scale-95 opacity-50"
                            : ""
                        } ${
                          dragOverIndex === index
                            ? "ring-opacity-50 bg-blue-50 ring-2 ring-blue-400"
                            : ""
                        }`}
                      >
                        {/* Ícone de arrastar */}
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
                            <p className="font-medium text-gray-800">
                              {material.name}
                            </p>
                            <p className="text-sm text-gray-500 capitalize">
                              {material.type}
                            </p>
                          </div>
                        </div>

                        {/* Botões de ação */}
                        <div className="flex items-center space-x-1">
                          {/* Botão de editar */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              editStep(module.id, index);
                            }}
                            className="p-1 text-gray-400 transition-all hover:text-blue-600"
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

                          {/* Botão de remover material */}
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
                            className="p-1 text-gray-400 transition-all hover:text-red-600"
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

                    {/* Zona de drop no final da lista */}
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
                            ? "border-blue-400 bg-blue-50"
                            : "border-gray-300"
                        }`}
                      >
                        <div className="flex h-full items-center justify-center text-xs text-gray-500">
                          {dragOverIndex === module.materials.length
                            ? "Solte aqui"
                            : "Área de drop"}
                        </div>
                      </div>
                    )}

                    {/* Botão Adicionar Etapa */}
                    <button
                      onClick={() => addNewStep(module.id)}
                      className="flex w-full items-center justify-center rounded-lg border-2 border-dashed border-blue-400 py-3 font-medium text-blue-600 transition-all hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700"
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
                <h2 className="text-2xl font-bold text-gray-800">
                  Revisão e Atualização
                </h2>
                <p className="text-gray-600">
                  Revise todas as informações antes de atualizar a trilha
                </p>
              </div>
            </div>

            <div className="pl-11">
              <div className="rounded-lg border border-orange-200 bg-orange-50 p-6">
                <div className="flex items-start">
                  <svg
                    className="mt-0.5 mr-3 h-6 w-6 text-orange-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <div>
                    <h3 className="mb-2 font-semibold text-orange-900">
                      Alterações na Trilha
                    </h3>
                    <p className="mb-4 text-orange-800">
                      Esta trilha já está ativa. Certifique-se de que:
                    </p>
                    <ul className="space-y-1 text-orange-800">
                      <li>
                        • As alterações não afetarão usuários que já estão
                        fazendo a trilha
                      </li>
                      <li>
                        • Todos os novos materiais estão funcionando
                        corretamente
                      </li>
                      <li>• As informações atualizadas estão corretas</li>
                      <li>• Os prazos foram ajustados adequadamente</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <p className="text-sm text-gray-500">
              Dica: As alterações são salvas automaticamente
            </p>

            <div className="flex space-x-4">
              <button
                onClick={handleCancel}
                className="rounded-lg border-2 border-gray-300 bg-gray-200 px-6 py-3 font-medium text-gray-700 transition-all hover:border-gray-400 hover:bg-gray-300"
              >
                Cancelar
              </button>

              <button
                onClick={handleSaveChanges}
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
                Salvar alterações
              </button>

              <button
                onClick={handleSaveChanges}
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
                Atualizar Trilha
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Adicionar/Editar Etapa */}
      {showStepModal && (
        <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="w-96 max-w-lg rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-semibold">
              {editingStep ? "Editar Etapa" : "Adicionar Nova Etapa"}
            </h3>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Tipo de Material
                </label>
                <select
                  id="stepType"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Nome da Etapa
                </label>
                <input
                  type="text"
                  id="stepName"
                  placeholder="Digite o nome da etapa"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  defaultValue={
                    editingStep
                      ? modules.find((m) => m.id === editingStep.moduleId)
                          ?.materials[editingStep.stepIndex]?.name || ""
                      : ""
                  }
                />
              </div>

              {/* Campo adicional para URL (se for link) */}
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
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  URL do Link
                </label>
                <input
                  type="url"
                  id="stepUrl"
                  placeholder="https://exemplo.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Campo adicional para arquivo */}
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
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Arquivo
                </label>
                <input
                  type="file"
                  id="stepFile"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  accept=".pdf,.mp4,.mp3,.doc,.docx"
                />
              </div>

              {/* Campo para descrição/instruções */}
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  Descrição/Instruções (opcional)
                </label>
                <textarea
                  id="stepDescription"
                  placeholder="Adicione instruções ou descrição para esta etapa"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
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
                className="rounded-md border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-50"
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
