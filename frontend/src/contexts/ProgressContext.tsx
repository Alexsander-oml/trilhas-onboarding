import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface MaterialProgress {
  materialId: number;
  completed: boolean;
  score?: number;
  timeSpent?: number;
  lastAccessed?: Date;
  progress?: number; // Para vídeos, PDFs, etc (0-100%)
  attempts?: number;
}

interface ModuleProgress {
  moduleId: number;
  completed: boolean;
  averageScore?: number;
  timeSpent?: number;
  materialsProgress: MaterialProgress[];
  unlocked: boolean;
}

interface TrailProgress {
  trailId: number;
  userId: number;
  startedAt: Date;
  completedAt?: Date;
  completed: boolean;
  overallProgress: number;
  modulesProgress: ModuleProgress[];
  currentModule?: number;
  currentMaterial?: number;
}

interface ProgressContextType {
  userProgress: TrailProgress[];
  getUserProgress: (userId: number, trailId: number) => TrailProgress | undefined;
  updateMaterialProgress: (userId: number, trailId: number, moduleId: number, materialId: number, progress: Partial<MaterialProgress>) => void;
  canAccessModule: (userId: number, trailId: number, moduleId: number) => boolean;
  canAccessMaterial: (userId: number, trailId: number, moduleId: number, materialId: number) => boolean;
  initializeTrailProgress: (userId: number, trailId: number) => void;
  saveProgress: (userId: number, trailId: number, moduleId: number, materialId: number, progress: number) => void;
  resumeProgress: (userId: number, trailId: number) => { moduleId: number; materialId: number } | null;
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

interface ProgressProviderProps {
  children: ReactNode;
}

export const ProgressProvider: React.FC<ProgressProviderProps> = ({ children }) => {
  const [userProgress, setUserProgress] = useState<TrailProgress[]>([]);

  const getUserProgress = (userId: number, trailId: number): TrailProgress | undefined => {
    return userProgress.find(p => p.userId === userId && p.trailId === trailId);
  };

  const initializeTrailProgress = (userId: number, trailId: number) => {
    const existingProgress = getUserProgress(userId, trailId);
    if (existingProgress) return;

    const newProgress: TrailProgress = {
      trailId,
      userId,
      startedAt: new Date(),
      completed: false,
      overallProgress: 0,
      modulesProgress: [],
      currentModule: 0,
      currentMaterial: 0
    };

    setUserProgress(prev => [...prev, newProgress]);
  };

  const updateMaterialProgress = (
    userId: number,
    trailId: number,
    moduleId: number,
    materialId: number,
    progress: Partial<MaterialProgress>
  ) => {
    setUserProgress(prev => prev.map(userProg => {
      if (userProg.userId !== userId || userProg.trailId !== trailId) {
        return userProg;
      }

      const updatedModulesProgress = userProg.modulesProgress.map(moduleProg => {
        if (moduleProg.moduleId !== moduleId) {
          return moduleProg;
        }

        const updatedMaterialsProgress = moduleProg.materialsProgress.map(matProg => {
          if (matProg.materialId === materialId) {
            return { ...matProg, ...progress, lastAccessed: new Date() };
          }
          return matProg;
        });

        // Se não existe o progresso do material, criar
        if (!updatedMaterialsProgress.find(mp => mp.materialId === materialId)) {
          updatedMaterialsProgress.push({
            materialId,
            completed: progress.completed || false,
            score: progress.score,
            timeSpent: progress.timeSpent || 0,
            lastAccessed: new Date(),
            progress: progress.progress || 0,
            attempts: progress.attempts || 1
          });
        }

        // Calcular se o módulo foi completado
        const moduleCompleted = updatedMaterialsProgress.every(mp => mp.completed);

        return {
          ...moduleProg,
          materialsProgress: updatedMaterialsProgress,
          completed: moduleCompleted
        };
      });

      // Se não existe o progresso do módulo, criar
      if (!updatedModulesProgress.find(mp => mp.moduleId === moduleId)) {
        updatedModulesProgress.push({
          moduleId,
          completed: progress.completed || false,
          materialsProgress: [{
            materialId,
            completed: progress.completed || false,
            score: progress.score,
            timeSpent: progress.timeSpent || 0,
            lastAccessed: new Date(),
            progress: progress.progress || 0,
            attempts: progress.attempts || 1
          }],
          unlocked: true
        });
      }

      // Calcular progresso geral
      const totalMaterials = updatedModulesProgress.reduce((acc, mod) => acc + mod.materialsProgress.length, 0);
      const completedMaterials = updatedModulesProgress.reduce((acc, mod) => 
        acc + mod.materialsProgress.filter(mat => mat.completed).length, 0
      );
      const overallProgress = totalMaterials > 0 ? (completedMaterials / totalMaterials) * 100 : 0;

      return {
        ...userProg,
        modulesProgress: updatedModulesProgress,
        overallProgress,
        completed: overallProgress === 100,
        completedAt: overallProgress === 100 ? new Date() : undefined
      };
    }));
  };

  const canAccessModule = (userId: number, trailId: number, moduleId: number): boolean => {
    const progress = getUserProgress(userId, trailId);
    if (!progress) return moduleId === 0; // Primeiro módulo sempre acessível

    // Se não há pré-requisitos definidos, permite acesso
    const moduleProgress = progress.modulesProgress.find(mp => mp.moduleId === moduleId);
    if (!moduleProgress) {
      // Verificar se módulos anteriores foram completados (ordem sequencial)
      const previousModules = progress.modulesProgress.filter(mp => mp.moduleId < moduleId);
      return previousModules.length === 0 || previousModules.every(mp => mp.completed);
    }

    return moduleProgress.unlocked;
  };

  const canAccessMaterial = (userId: number, trailId: number, moduleId: number, materialId: number): boolean => {
    // Primeiro verifica se pode acessar o módulo
    if (!canAccessModule(userId, trailId, moduleId)) {
      return false;
    }

    const progress = getUserProgress(userId, trailId);
    if (!progress) return true;

    const moduleProgress = progress.modulesProgress.find(mp => mp.moduleId === moduleId);
    if (!moduleProgress) return true;

    // Verificar se materiais anteriores no módulo foram completados
    const previousMaterials = moduleProgress.materialsProgress.filter(mp => mp.materialId < materialId);
    return previousMaterials.length === 0 || previousMaterials.every(mp => mp.completed);
  };

  const saveProgress = (userId: number, trailId: number, moduleId: number, materialId: number, progress: number) => {
    // Salvar no localStorage para persistência
    const key = `progress_${userId}_${trailId}_${moduleId}_${materialId}`;
    const progressData = {
      progress,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(key, JSON.stringify(progressData));

    // Atualizar contexto
    updateMaterialProgress(userId, trailId, moduleId, materialId, { progress });
  };

  const resumeProgress = (userId: number, trailId: number): { moduleId: number; materialId: number } | null => {
    const progress = getUserProgress(userId, trailId);
    if (!progress) return null;

    // Encontrar o último material acessado
    let lastModuleId = 0;
    let lastMaterialId = 0;
    let lastAccessTime = new Date(0);

    progress.modulesProgress.forEach(module => {
      module.materialsProgress.forEach(material => {
        if (material.lastAccessed && material.lastAccessed > lastAccessTime && !material.completed) {
          lastAccessTime = material.lastAccessed;
          lastModuleId = module.moduleId;
          lastMaterialId = material.materialId;
        }
      });
    });

    return { moduleId: lastModuleId, materialId: lastMaterialId };
  };

  return (
    <ProgressContext.Provider value={{
      userProgress,
      getUserProgress,
      updateMaterialProgress,
      canAccessModule,
      canAccessMaterial,
      initializeTrailProgress,
      saveProgress,
      resumeProgress
    }}>
      {children}
    </ProgressContext.Provider>
  );
};