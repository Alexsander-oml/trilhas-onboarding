# Campos Backend Confirmados - Contagem de Módulos

## ✅ Status da Implementação

**Data**: 06/01/2026  
**Objetivo**: Garantir contagem correta de módulos vindos do backend Django

---

## 📦 Campo Principal do Backend

### `total_modulos` (número)

O backend Django envia o campo **`total_modulos`** nas respostas de trilhas:

```json
{
  "id": 1,
  "titulo": "Trilha de React",
  "descricao": "...",
  "total_modulos": 5,
  "modules": [...],
  "changelog": "..."
}
```

---

## 🔄 Mapeamento Frontend

### useTrails.ts - Prioridade de Fallback

```typescript
// Contar módulos: priorizar campos do backend; aceitar números em string; fallback para modules.length
const rawModuleCount = trail.total_modulos ?? trail.total_modules ?? trail.module_count ?? modules.length ?? 0;
const moduleCountParsed = Number(rawModuleCount);
const moduleCount = Number.isFinite(moduleCountParsed)
  ? moduleCountParsed
  : Array.isArray(modules)
    ? modules.length
    : 0;
```

### Ordem de Prioridade:

1. **`trail.total_modulos`** (campo confirmado do backend)
2. **`trail.total_modules`** (variante em inglês, se existir)
3. **`trail.module_count`** (variante alternativa)
4. **`modules.length`** (contagem do array parseado)
5. **`0`** (fallback final)

### Suporte a Strings:

O código converte automaticamente valores numéricos em string:
- `"5"` → `5`
- `5` → `5`
- `null/undefined` → próximo fallback

---

## 🎯 Componentes Atualizados

### ✅ AprendizHome.tsx (Linha 60-91)

```typescript
const [moduleCounts, setModuleCounts] = useState<Record<number, number>>({});

// Derivar contagem de módulos somente após carregamento assíncrono
useEffect(() => {
  if (isLoading) return;
  const map: Record<number, number> = {};
  trails.forEach((trail) => {
    map[trail.id] = getModuleCount(trail);
  });
  setModuleCounts(map);
}, [trails, isLoading]);

const getModuleCount = (trail: Trail): number => {
  // Prioridade 1: Campo moduleCount já calculado pelo backend
  if (typeof trail?.moduleCount === "number") {
    return trail.moduleCount;
  }
  // Prioridade 2-4: Array modules, changelog...
};
```

**Features**:
- ✅ State `moduleCounts` para cache
- ✅ Guard `isLoading` para evitar cálculos prematuros
- ✅ Helper `safeModules()` para arrays
- ✅ Função `getModuleCount()` com fallbacks

---

### ✅ AdminDashboard.tsx (Linha 75-91)

```typescript
const [moduleCounts, setModuleCounts] = useState<Record<number, number>>({});

// Derivar contagem de módulos somente após carregamento assíncrono
useEffect(() => {
  if (isLoading) return;
  const map: Record<number, number> = {};
  trails.forEach((trail) => {
    map[trail.id] = getModuleCount(trail);
  });
  setModuleCounts(map);
}, [trails, isLoading]);

const getModuleCount = (trail: any): number => {
  // Prioridade 1: Campo moduleCount já calculado pelo backend
  if (typeof trail?.moduleCount === "number") {
    return trail.moduleCount;
  }
  // Prioridade 2-4: Array modules, changelog...
};
```

**Uso na UI**:
```tsx
{moduleCounts[trail.id] ?? getModuleCount(trail)} módulos
```

---

### ✅ TrailsCatalog.tsx

```typescript
const getModuleCount = (trail: Trail): number => {
  // Prioridade 1: Campo moduleCount já calculado pelo backend
  if (typeof trail?.moduleCount === "number") {
    return trail.moduleCount;
  }
  // Fallbacks idênticos aos outros componentes
};
```

---

## 📋 Interface TypeScript

### types/api.ts (Linha 65)

```typescript
export interface Trail extends BaseModel {
  name: string;
  description: string;
  // ... outros campos
  modules?: Module[];
  moduleCount?: number; // ← Contador automático de módulos do backend
  // ... mais campos
}
```

---

## 🔍 Exemplos de Response do Backend

### Caso 1: Backend envia `total_modulos`

```json
{
  "id": 1,
  "titulo": "Trilha React",
  "total_modulos": 3,
  "modules": null,
  "changelog": "{\"modules\":[...]}"
}
```

**Resultado**: `moduleCount = 3` (prioridade 1)

---

### Caso 2: Backend envia array `modules`

```json
{
  "id": 2,
  "titulo": "Trilha Python",
  "total_modulos": null,
  "modules": [
    {"id": 1, "name": "Módulo 1"},
    {"id": 2, "name": "Módulo 2"}
  ],
  "changelog": null
}
```

**Resultado**: `moduleCount = 2` (contagem do array, prioridade 4)

---

### Caso 3: Backend envia só `changelog`

```json
{
  "id": 3,
  "titulo": "Trilha Java",
  "total_modulos": null,
  "modules": null,
  "changelog": "{\"modules\":[{},{},{},{}]}"
}
```

**Resultado**: `moduleCount = 4` (parse do changelog, prioridade 4)

---

### Caso 4: Todas as fontes vazias

```json
{
  "id": 4,
  "titulo": "Trilha Vazia",
  "total_modulos": null,
  "modules": [],
  "changelog": null
}
```

**Resultado**: `moduleCount = 0` (fallback final)

---

## 🚀 Fluxo de Dados Completo

```
Backend Django
    ↓
    total_modulos: 5
    modules: [...]
    changelog: "..."
    ↓
useTrails.fetchTrails()
    ↓
    Mapeia total_modulos → moduleCount
    Fallback para modules.length
    Parse changelog se necessário
    ↓
Trail {
  moduleCount: 5,
  modules: [...],
  changelog: "..."
}
    ↓
Componentes (AprendizHome, AdminDashboard, TrailsCatalog)
    ↓
    if (isLoading) return;
    moduleCounts[trail.id] = getModuleCount(trail);
    ↓
    Renderiza: {moduleCounts[trail.id] ?? getModuleCount(trail)} módulos
```

---

## ⚠️ Problemas Resolvidos

### Antes:
- ❌ Contagem mostrava 0 quando `trail.modules` estava vazio
- ❌ Não lia `total_modulos` do backend
- ❌ Parsing do changelog ignorava `trail.modules` quando disponível
- ❌ Não aceitava números em string

### Depois:
- ✅ Lê `trail.modules` do backend ANTES do changelog
- ✅ Mapeia `total_modulos → moduleCount` corretamente
- ✅ Aceita variantes: `total_modules`, `module_count`
- ✅ Converte strings numéricas automaticamente
- ✅ Fallback inteligente para 4 fontes diferentes

---

## 🧪 Como Testar

1. **Abrir DevTools Console** no navegador
2. **Buscar trilhas** no AdminDashboard ou AprendizHome
3. **Verificar logs**:
   ```
   📥 Resposta da API: { trilhas: [...] }
   ✅ Trilhas mapeadas: [{ moduleCount: 5, ... }]
   ```
4. **Confirmar contagem visual** nos cards das trilhas

---

## 📝 Checklist Final

- ✅ useTrails.ts mapeia `total_modulos → moduleCount`
- ✅ useTrails.ts prioriza `trail.modules` do backend
- ✅ useTrails.ts aceita números em string
- ✅ types/api.ts tem `moduleCount?: number`
- ✅ AprendizHome.tsx usa `isLoading` guard
- ✅ AprendizHome.tsx tem state `moduleCounts`
- ✅ AdminDashboard.tsx usa `isLoading` guard
- ✅ AdminDashboard.tsx tem state `moduleCounts`
- ✅ TrailsCatalog.tsx tem função `getModuleCount`
- ✅ Todos componentes usam fallback `moduleCounts[id] ?? getModuleCount()`

---

## 🔗 Arquivos Relacionados

- `src/hooks/useTrails.ts` (linhas 52-114, 154-177)
- `src/types/api.ts` (linha 65)
- `src/components/AprendizHome.tsx` (linhas 60-91, 265-290)
- `src/components/AdminDashboard.tsx` (linhas 75-160)
- `src/components/TrailsCatalog.tsx` (linhas 197-230)

---

**Implementado por**: GitHub Copilot  
**Status**: ✅ Produção  
**Versão**: 1.0.0
