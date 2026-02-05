import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { VideoUpload, PDFUpload } from "./FileUpload";

interface Material {
  id: number;
  type: string;
  name: string;
  icon: string;
  color: string;
  url?: string;
  duration?: number;
  description?: string;
}

interface MaterialEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: Omit<Material, "id">) => void;
  material?: Material;
  mode: "add" | "edit";
}

const MATERIAL_TYPES = [
  { value: "video", label: "Vídeo", icon: "🎥", color: "#DC2626" },
  { value: "pdf", label: "PDF", icon: "📄", color: "#059669" },
  { value: "reading", label: "Leitura", icon: "📖", color: "#0891B2" },
  { value: "quiz", label: "Quiz", icon: "✅", color: "#7C3AED" },
  { value: "exercise", label: "Exercício", icon: "✏️", color: "#F59E0B" },
  {
    value: "presentation",
    label: "Apresentação",
    icon: "📊",
    color: "#8B5CF6",
  },
];

export default function MaterialEditor({
  isOpen,
  onClose,
  onSave,
  material,
  mode,
}: MaterialEditorProps) {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    name: material?.name || "",
    type: material?.type || "video",
    url: material?.url || "",
    duration: material?.duration || 0,
    description: material?.description || "",
  });

  const [uploadMode, setUploadMode] = useState<"url" | "upload">("url");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    console.log(
      "🟢 MaterialEditor.handleSubmit chamado com formData:",
      formData,
    );

    if (!formData.name.trim()) {
      console.log("❌ Validação falhou: nome vazio");
      alert("Por favor, insira um nome para o material");
      return;
    }

    // Só valida URL se for vídeo ou PDF (Quiz não precisa)
    if (
      (formData.type === "video" || formData.type === "pdf") &&
      !formData.url.trim()
    ) {
      console.log("❌ Validação falhou: URL vazia para tipo", formData.type);
      alert(
        `Por favor, insira uma URL válida para ${formData.type === "video" ? "o vídeo" : "o PDF"}`,
      );
      return;
    }

    console.log("✅ Todas as validações passaram!");

    const selectedType = MATERIAL_TYPES.find((t) => t.value === formData.type);

    console.log("✅ Validações passaram. Chamando onSave com:", {
      name: formData.name.trim(),
      type: formData.type,
      selectedType,
    });

    onSave({
      name: formData.name.trim(),
      type: formData.type,
      url: formData.url.trim() || undefined,
      duration: formData.duration || undefined,
      description: formData.description.trim() || undefined,
      icon: selectedType?.icon || "📄",
      color: selectedType?.color || "#6B7280",
    });

    // Reset form
    setFormData({
      name: "",
      type: "video",
      url: "",
      duration: 0,
      description: "",
    });

    onClose();
  };

  const handleCancel = () => {
    setFormData({
      name: material?.name || "",
      type: material?.type || "video",
      url: material?.url || "",
      duration: material?.duration || 0,
      description: material?.description || "",
    });
    onClose();
  };

  if (!isOpen) return null;

  const selectedType = MATERIAL_TYPES.find((t) => t.value === formData.type);

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-2 lg:p-4">
      <div
        className={`mx-auto flex max-h-[95vh] w-full max-w-lg flex-col rounded-lg shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}
      >
        {/* Header */}
        <div
          className={`flex flex-shrink-0 items-center justify-between p-4 lg:p-6 ${isDark ? "border-b border-gray-700" : "border-b border-gray-200"}`}
        >
          <h2
            className={`text-lg font-semibold lg:text-xl ${isDark ? "text-gray-100" : "text-gray-900"}`}
          >
            {mode === "add" ? "Adicionar Material" : "Editar Material"}
          </h2>
          <button
            onClick={handleCancel}
            className={`transition-colors ${isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"}`}
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
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col overflow-hidden"
        >
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-4 p-4 lg:space-y-6 lg:p-6">
              {/* Nome do Material */}
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Nome do Material *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                  placeholder="Ex: Introdução ao React"
                  required
                />
              </div>

              {/* Tipo de Material */}
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Tipo de Material *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {MATERIAL_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, type: type.value })
                      }
                      className={`flex items-center rounded-lg border p-3 transition-all ${
                        formData.type === type.value
                          ? isDark
                            ? "border-blue-500 bg-blue-900/30 text-blue-400"
                            : "border-blue-500 bg-blue-50 text-blue-700"
                          : isDark
                            ? "border-gray-600 hover:border-gray-500 hover:bg-gray-700"
                            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <span className="mr-2 text-lg">{type.icon}</span>
                      <span className="text-sm font-medium">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* URL ou Upload (para vídeo e PDF) */}
              {(formData.type === "video" || formData.type === "pdf") && (
                <div>
                  <label
                    className={`mb-3 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    {formData.type === "video" ? "Vídeo" : "PDF"} *
                  </label>

                  {/* Tabs */}
                  <div
                    className={`mb-4 flex rounded-lg p-1 ${isDark ? "bg-gray-700" : "bg-gray-100"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setUploadMode("url")}
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        uploadMode === "url"
                          ? isDark
                            ? "bg-gray-800 text-gray-100 shadow-sm"
                            : "bg-white text-gray-900 shadow-sm"
                          : isDark
                            ? "text-gray-400 hover:text-gray-200"
                            : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      🔗 URL Externa
                    </button>
                    <button
                      type="button"
                      onClick={() => setUploadMode("upload")}
                      className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        uploadMode === "upload"
                          ? isDark
                            ? "bg-gray-800 text-gray-100 shadow-sm"
                            : "bg-white text-gray-900 shadow-sm"
                          : isDark
                            ? "text-gray-400 hover:text-gray-200"
                            : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      📤 Fazer Upload
                    </button>
                  </div>

                  {/* Content based on mode */}
                  {uploadMode === "url" ? (
                    <input
                      type="url"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData({ ...formData, url: e.target.value })
                      }
                      className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                      placeholder={
                        formData.type === "video"
                          ? "https://exemplo.com/video.mp4"
                          : "https://exemplo.com/documento.pdf"
                      }
                      required
                    />
                  ) : (
                    <div>
                      {formData.type === "video" ? (
                        <VideoUpload
                          onUpload={(url) => setFormData({ ...formData, url })}
                        />
                      ) : (
                        <PDFUpload
                          onUpload={(url) => setFormData({ ...formData, url })}
                        />
                      )}
                      {formData.url && (
                        <div
                          className={`mt-3 rounded-lg border p-3 ${isDark ? "border-green-700 bg-green-900/30" : "border-green-200 bg-green-50"}`}
                        >
                          <p
                            className={`flex items-center text-sm ${isDark ? "text-green-400" : "text-green-700"}`}
                          >
                            <svg
                              className="mr-2 h-4 w-4"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Arquivo enviado com sucesso!
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Duração (para vídeo) */}
              {formData.type === "video" && (
                <div>
                  <label
                    className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Duração (segundos)
                  </label>
                  <input
                    type="number"
                    value={formData.duration}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        duration: parseInt(e.target.value) || 0,
                      })
                    }
                    className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                    placeholder="120"
                    min="0"
                  />
                </div>
              )}

              {/* Descrição */}
              <div>
                <label
                  className={`mb-2 block text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                >
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className={`w-full rounded-lg border px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500 ${isDark ? "border-gray-600 bg-gray-700 text-gray-100" : "border-gray-300 bg-white text-gray-900"}`}
                  placeholder="Breve descrição do material..."
                  rows={3}
                />
              </div>

              {/* Preview */}
              {selectedType && (
                <div
                  className={`rounded-lg p-4 ${isDark ? "bg-gray-700" : "bg-gray-50"}`}
                >
                  <p
                    className={`mb-2 text-sm font-medium ${isDark ? "text-gray-300" : "text-gray-700"}`}
                  >
                    Preview:
                  </p>
                  <div
                    className={`flex items-center rounded border p-2 ${isDark ? "border-gray-600 bg-gray-800" : "border-gray-200 bg-white"}`}
                  >
                    <span
                      className="mr-3 text-lg"
                      style={{ color: selectedType.color }}
                    >
                      {selectedType.icon}
                    </span>
                    <div className="flex-1">
                      <p
                        className={`font-medium ${isDark ? "text-gray-100" : "text-gray-900"}`}
                      >
                        {formData.name || "Nome do material"}
                      </p>
                      {formData.description && (
                        <p
                          className={`text-sm ${isDark ? "text-gray-400" : "text-gray-600"}`}
                        >
                          {formData.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            className={`flex flex-shrink-0 flex-col-reverse justify-end gap-2 p-4 sm:flex-row sm:gap-3 lg:p-6 ${isDark ? "border-t border-gray-700" : "border-t border-gray-200"}`}
          >
            <button
              type="button"
              onClick={handleCancel}
              className={`rounded-lg px-4 py-2 text-sm transition-colors lg:text-base ${isDark ? "bg-gray-700 text-gray-200 hover:bg-gray-600" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 lg:text-base"
            >
              {mode === "add" ? "Adicionar" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
