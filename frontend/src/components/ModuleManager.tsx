import { useState } from 'react';
import MaterialEditor from './MaterialEditor';

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

interface Module {
  id: number;
  name: string;
  steps: number;
  materials: Material[];
}

interface ModuleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (modules: Module[]) => void;
  modules: Module[];
  trailName: string;
}

export default function ModuleManager({ isOpen, onClose, onSave, modules, trailName }: ModuleManagerProps) {
  const [localModules, setLocalModules] = useState<Module[]>(modules);
  const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
  const [materialEditorOpen, setMaterialEditorOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [materialEditorMode, setMaterialEditorMode] = useState<'add' | 'edit'>('add');

  const addModule = () => {
    const newModule: Module = {
      id: Date.now(),
      name: `Módulo ${localModules.length + 1}`,
      steps: 0,
      materials: []
    };
    setLocalModules([...localModules, newModule]);
    setSelectedModuleId(newModule.id);
  };

  const updateModuleName = (moduleId: number, name: string) => {
    setLocalModules(localModules.map(module =>
      module.id === moduleId ? { ...module, name } : module
    ));
  };

  const deleteModule = (moduleId: number) => {
    if (confirm('Tem certeza que deseja excluir este módulo?')) {
      setLocalModules(localModules.filter(module => module.id !== moduleId));
      if (selectedModuleId === moduleId) {
        setSelectedModuleId(null);
      }
    }
  };

  const addMaterial = (moduleId: number) => {
    setSelectedModuleId(moduleId);
    setEditingMaterial(null);
    setMaterialEditorMode('add');
    setMaterialEditorOpen(true);
  };

  const editMaterial = (moduleId: number, material: Material) => {
    setSelectedModuleId(moduleId);
    setEditingMaterial(material);
    setMaterialEditorMode('edit');
    setMaterialEditorOpen(true);
  };

  const deleteMaterial = (moduleId: number, materialId: number) => {
    if (confirm('Tem certeza que deseja excluir este material?')) {
      setLocalModules(localModules.map(module =>
        module.id === moduleId
          ? {
              ...module,
              materials: module.materials.filter(material => material.id !== materialId),
              steps: module.materials.filter(material => material.id !== materialId).length
            }
          : module
      ));
    }
  };

  const handleMaterialSave = (materialData: Omit<Material, 'id'>) => {
    if (!selectedModuleId) return;

    setLocalModules(localModules.map(module => {
      if (module.id !== selectedModuleId) return module;

      let updatedMaterials;
      
      if (materialEditorMode === 'add') {
        const newMaterial: Material = {
          ...materialData,
          id: Date.now()
        };
        updatedMaterials = [...module.materials, newMaterial];
      } else {
        updatedMaterials = module.materials.map(material =>
          material.id === editingMaterial?.id
            ? { ...materialData, id: material.id }
            : material
        );
      }

      return {
        ...module,
        materials: updatedMaterials,
        steps: updatedMaterials.length
      };
    }));
  };

  const handleSave = () => {
    onSave(localModules);
    onClose();
  };

  const handleCancel = () => {
    setLocalModules(modules);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40 p-2 lg:p-4">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl h-[90vh] lg:h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between p-4 lg:p-6 border-b border-gray-200 gap-2 lg:gap-0">
            <div className="min-w-0 flex-1">
              <h2 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
                Gerenciar Módulos
              </h2>
              <p className="text-gray-600 mt-1 text-sm lg:text-base truncate">{trailName}</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors self-end lg:self-auto"
            >
              <svg className="w-5 h-5 lg:w-6 lg:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
            {/* Sidebar - Lista de Módulos */}
            <div className="w-full lg:w-1/3 bg-gray-50 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col max-h-48 lg:max-h-none">
              <div className="p-3 lg:p-4 border-b border-gray-200">
                <button
                  onClick={addModule}
                  className="w-full flex items-center justify-center px-3 lg:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm lg:text-base"
                >
                  <svg className="w-4 h-4 lg:w-5 lg:h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">Adicionar Módulo</span>
                  <span className="sm:hidden">+ Módulo</span>
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto">
                {localModules.map((module) => (
                  <div
                    key={module.id}
                    className={`p-2 lg:p-4 border-b border-gray-200 cursor-pointer transition-colors ${
                      selectedModuleId === module.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedModuleId(module.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{module.name}</h3>
                        <p className="text-sm text-gray-600">
                          {module.materials.length} materiais
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteModule(module.id);
                        }}
                        className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                        title="Excluir módulo"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Content - Detalhes do Módulo */}
            <div className="flex-1 flex flex-col">
              {selectedModuleId ? (
                (() => {
                  const selectedModule = localModules.find(m => m.id === selectedModuleId);
                  if (!selectedModule) return null;

                  return (
                    <>
                      {/* Module Header */}
                      <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={selectedModule.name}
                              onChange={(e) => updateModuleName(selectedModule.id, e.target.value)}
                              className="text-xl font-semibold text-gray-900 bg-transparent border-none outline-none focus:bg-gray-50 rounded p-2 -ml-2 w-full"
                              placeholder="Nome do módulo"
                            />
                            <p className="text-gray-600 mt-1 ml-2">
                              {selectedModule.materials.length} materiais
                            </p>
                          </div>
                          <button
                            onClick={() => addMaterial(selectedModule.id)}
                            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                          >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Adicionar Material
                          </button>
                        </div>
                      </div>

                      {/* Materials List */}
                      <div className="flex-1 overflow-y-auto p-6">
                        {selectedModule.materials.length === 0 ? (
                          <div className="text-center py-12 text-gray-500">
                            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p>Nenhum material adicionado</p>
                            <p className="text-sm mt-1">Clique em "Adicionar Material" para começar</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {selectedModule.materials.map((material) => (
                              <div key={material.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center flex-1">
                                    <span className="text-2xl mr-3" style={{ color: material.color }}>
                                      {material.icon}
                                    </span>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">{material.name}</h4>
                                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                                        <span className="capitalize">{material.type}</span>
                                        {material.duration && (
                                          <span>{Math.floor(material.duration / 60)}m {material.duration % 60}s</span>
                                        )}
                                        {material.url && (
                                          <span className="text-blue-600">🔗 URL configurada</span>
                                        )}
                                      </div>
                                      {material.description && (
                                        <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <button
                                      onClick={() => editMaterial(selectedModule.id, material)}
                                      className="p-2 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                                      title="Editar material"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                      </svg>
                                    </button>
                                    <button
                                      onClick={() => deleteMaterial(selectedModule.id, material.id)}
                                      className="p-2 text-red-600 hover:bg-red-100 rounded transition-colors"
                                      title="Excluir material"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                      </svg>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  );
                })()
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <p>Selecione um módulo para visualizar os materiais</p>
                    <p className="text-sm mt-1">ou adicione um novo módulo para começar</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3 p-4 lg:p-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm lg:text-base"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors text-sm lg:text-base"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>

      {/* Material Editor Modal */}
      <MaterialEditor
        isOpen={materialEditorOpen}
        onClose={() => setMaterialEditorOpen(false)}
        onSave={handleMaterialSave}
        material={editingMaterial || undefined}
        mode={materialEditorMode}
      />
    </>
  );
}