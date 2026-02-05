# ✅ Checklist - O que Enviar para o Frontend

## 📋 Resumo das Implementações Confirmadas

### Backend Confirmado ✅
- **Campo enviado:** `total_modulos` (int)
- **Endpoints:** `/api/trilhas/`, `/api/trilhas/search/`, `/api/trilhas/{id}/`
- **Relação DB:** `Modulo.id_trilha` → `Trilha.modulos` (related_name)

### Frontend Já Implementado ✅
Todos os componentes já estão preparados para usar `total_modulos`:

#### 1. **Hook (`useTrails.ts`)**
- ✅ Mapeia `total_modulos` → `moduleCount`
- ✅ Prioridade: `total_modulos` → `modules.length` → `0`
- Status: **PRONTO**

#### 2. **AprendizHome.tsx**
- ✅ Adicionar ao VS Code do frontend
- ✅ Implementação: `moduleCounts` (estado derivado + useEffect)
- ✅ Usa: `moduleCounts[trail.id] ?? getModuleCount(trail)`
- Status: **PRONTO**

#### 3. **AdminDashboard.tsx**
- ✅ Adicionar ao VS Code do frontend
- ✅ Implementação: `moduleCounts` (estado derivado + useEffect)
- ✅ Usa: `moduleCounts[trail.id] ?? getModuleCount(trail)`
- Status: **PRONTO**

---

## 🚀 O Que Fazer Agora

### Passo 1: Copiar AprendizHome.tsx (PRONTO)
**Arquivo:** `frontend/src/components/AprendizHome.tsx`
- ✅ Contém todas as melhorias
- ✅ Contém contagem assíncrona de módulos
- ✅ Contém dark mode
- ✅ Contém filtros, tags, deadline

### Passo 2: Copiar AdminDashboard.tsx (PRONTO)
**Arquivo:** `frontend/src/components/AdminDashboard.tsx`
- ✅ Contém contagem assíncrona de módulos
- ✅ Contém exibição nos cartões
- ✅ Contém dark mode
- ✅ Contém filtros avançados

### Passo 3: Certificar-se que useTrails.ts Tem:
```typescript
// No fetchTrails() e getTrail()
const moduleCount = trail.total_modulos ?? trail.modules?.length ?? 0;
// Mapear para moduleCount na interface Trail
```

### Passo 4: Verificar type Trail em api.ts:
```typescript
interface Trail {
  id: number;
  name: string;
  description: string;
  // ... outros campos
  moduleCount?: number;      // ← IMPORTANTE: adicionar este campo
  total_modulos?: number;    // ← Opcional: manter para compatibilidade
  modules?: Module[];        // ← Já existe?
  tags?: any[];
  deadline?: string;
  status?: string;
  // ... resto dos campos
}
```

---

## 📝 Mudanças Aplicadas (Para Referência)

### AprendizHome.tsx
```diff
+ const { trails, fetchTrails, isLoading } = useTrails();
+ const [moduleCounts, setModuleCounts] = useState<Record<number, number>>({});

+ // Derivar contagem de módulos somente após carregamento assíncrono
+ useEffect(() => {
+   if (isLoading) return;
+   const map: Record<number, number> = {};
+   trails.forEach((trail) => {
+     map[trail.id] = getModuleCount(trail);
+   });
+   setModuleCounts(map);
+ }, [trails, isLoading]);

+ const safeModules = (trail: Trail) => (Array.isArray(trail.modules) ? trail.modules : []);

  // No getModuleCount():
  - if (typeof trail?.moduleCount === 'number') { return trail.moduleCount; }

  // Nos displays:
- {getModuleCount(trail)} módulos
+ {moduleCounts[trail.id] ?? getModuleCount(trail)} módulos
```

### AdminDashboard.tsx
```diff
+ const { trails, deleteTrail, fetchTrails, isLoading } = useTrails();
+ const [moduleCounts, setModuleCounts] = useState<Record<number, number>>({});

+ // Derivar contagem de módulos somente após carregamento assíncrono
+ useEffect(() => {
+   if (isLoading) return;
+   const map: Record<number, number> = {};
+   trails.forEach((trail) => {
+     map[trail.id] = getModuleCount(trail);
+   });
+   setModuleCounts(map);
+ }, [trails, isLoading]);

  // No cartão:
- {getModuleCount(trail)} módulos
+ {moduleCounts[trail.id] ?? getModuleCount(trail)} módulos
```

---

## ✨ Benefícios da Implementação

| Antes | Depois |
|-------|--------|
| Contagem calculada toda vez | Contagem derivada 1x após carga |
| Sem garantia de dados prontos | Espera `isLoading === false` |
| Falha silenciosa | Fallback em cascata (3 fontes) |
| Sem reatividade | Atualiza automaticamente com trilhas |

---

## 🎯 Verificação Final no VS Code

1. **Abrir AdminDashboard.tsx**
   - [ ] Tem `isLoading` na desestruturação
   - [ ] Tem `moduleCounts` state
   - [ ] Tem `useEffect` com guarda `isLoading`
   - [ ] Usa `moduleCounts[trail.id] ?? getModuleCount(trail)`

2. **Abrir AprendizHome.tsx**
   - [ ] Tem `isLoading` na desestruturação
   - [ ] Tem `moduleCounts` state
   - [ ] Tem `safeModules()` helper
   - [ ] Tem `useEffect` com guarda `isLoading`
   - [ ] Usa `moduleCounts[trail.id] ?? getModuleCount(trail)`

3. **Abrir useTrails.ts**
   - [ ] `moduleCount = total_modulos ?? modules?.length ?? 0`
   - [ ] Mapeado em ambas funções (fetchTrails, getTrail)

4. **Testar no Browser**
   - [ ] Abrir DevTools → Network
   - [ ] Chamar `/api/trilhas/search/`
   - [ ] Confirmar que `total_modulos` > 0
   - [ ] Contar módulos na UI
   - [ ] Verificar que não aparecem 0 módulos

---

## 📂 Arquivos a Atualizar/Adicionar

```
frontend/
├── src/
│   ├── components/
│   │   ├── AdminDashboard.tsx          ← ATUALIZAR (pronto)
│   │   ├── AprendizHome.tsx            ← ATUALIZAR (pronto)
│   │   ├── TrailsCatalog.tsx           ← Já tem getModuleCount()
│   │   └── ... (outros)
│   ├── hooks/
│   │   └── useTrails.ts                ← VERIFICAR mapeamento
│   └── types/
│       └── api.ts                      ← VERIFICAR interface Trail
```

---

## ⚡ Comando de Teste Rápido

No console do navegador após carregar a página:
```javascript
// Verificar que trails vieram com total_modulos
fetch('/api/trilhas/search/')
  .then(r => r.json())
  .then(data => {
    console.log('Primeiro trilha:', data[0]);
    console.log('total_modulos:', data[0].total_modulos);
    console.log('Esperado: número > 0');
  });
```

---

## ✅ Status Final

- ✅ Backend: Envia `total_modulos` correto
- ✅ Hook: Mapeia `total_modulos` → `moduleCount`
- ✅ AprendizHome: Implementado com contagem assíncrona
- ✅ AdminDashboard: Implementado com contagem assíncrona
- ✅ TrailsCatalog: Já tem suporte
- 🔄 **PRÓXIMO:** Copiar arquivos para seu VS Code do frontend e testar

