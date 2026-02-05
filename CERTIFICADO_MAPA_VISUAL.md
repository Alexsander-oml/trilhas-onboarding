# 🎯 MAPA VISUAL - Como o Certificado Funciona

## 1️⃣ ARQUITETURA DO SISTEMA

```
┌─────────────────────────────────────────────────────────────────┐
│                    APLICAÇÃO REACT (Frontend)                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │
        ┌─────────────────────┴──────────────────────┐
        │                                            │
        ↓                                            ↓
   TrailViewer                              ProgressContext
   └─ Exibe trilha                          └─ Rastreia progresso
   └─ Marca materiais                       └─ Calcula percentual
   └─ Detecta 100%                          └─ Salva no localStorage
        │
        │ Quando 100%
        ↓
   useCertificates (Hook)
   └─ issueCertificate()
   └─ Gera dados do certificado
   └─ Salva no localStorage
        │
        ↓
   localStorage
   └─ certificate_1_42
   └─ certificate_1_50
   └─ Etc...
        │
        ↓
   TrailCompletionCertificate
   └─ Tela de celebração
   └─ Modal visual
   └─ Botões de ação
```

---

## 2️⃣ FLUXO DE DADOS

```
┌──────────────────┐
│ Usuário marcando │
│  material como   │
│     concluído    │
└────────┬─────────┘
         │
         │ Click em ✓
         ↓
┌──────────────────────────────────────┐
│  markAsCompleted() é chamado em      │
│  TrailViewer                         │
│                                      │
│  Resultado:                          │
│  - completedMaterials.add(key)       │
│  - updateMaterialProgress() chamado  │
└────────┬──────────────────────────────┘
         │
         ↓ (Rerender)
┌──────────────────────────────────────┐
│  getProgressPercentage() recalcula   │
│  Math.round((completed/total)*100)   │
│                                      │
│  Resultado:                          │
│  - 50%, 75%, 99%, ou ...             │
└────────┬──────────────────────────────┘
         │
         │ Se === 100%
         ↓
┌──────────────────────────────────────┐
│  useEffect dispara automaticamente   │
│  (Linhas 151-175 de TrailViewer)     │
│                                      │
│  Condicional:                        │
│  if (trail && 100% && !showCert)     │
└────────┬──────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  issueCertificate() é executado      │
│                                      │
│  Parâmetros:                         │
│  - userId: 1                         │
│  - trailId: 42                       │
│  - trailName: "Javascript..."        │
│  - studentName: "João Silva"         │
│  - startDate: "2025-12-20..."        │
│  - endDate: "2026-01-19..."          │
│  - workload: 40                      │
└────────┬──────────────────────────────┘
         │
         ↓ (Retorna objeto Certificate)
┌──────────────────────────────────────┐
│  certificateService salva no         │
│  localStorage                        │
│                                      │
│  Key: "certificate_1_42"             │
│  Value: { ... todo objeto ... }      │
└────────┬──────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  setIssuedCertificate(cert)          │
│  setShowCertificate(true)            │
│                                      │
│  Estados atualizados em TrailViewer  │
└────────┬──────────────────────────────┘
         │
         ↓ (Rerender React)
┌──────────────────────────────────────┐
│  <TrailCompletionCertificate />      │
│  renderiza no DOM                    │
│                                      │
│  Resultado:                          │
│  🎊 CELEBRAÇÃO NA TELA!              │
└──────────────────────────────────────┘
```

---

## 3️⃣ ESTRUTURA DE PASTAS

```
frontend/src/
│
├── types/
│   └── certificate.ts                    ← Interfaces TypeScript
│
├── services/
│   └── certificates.service.ts           ← Lógica de certificados
│
├── hooks/
│   └── useCertificates.ts                ← Hook React customizado
│
├── components/
│   ├── TrailViewer.tsx                   ← MODIFICADO - Integração
│   ├── TrailCompletionCertificate.tsx    ← Tela celebração
│   ├── CertificatePreview.tsx            ← Visual do diploma
│   ├── CertificateModal.tsx              ← Wrapper modal
│   └── examples/
│       └── CertificateIntegrationExample.tsx  ← Exemplos
│
├── pages/
│   └── TestCertificatePage.tsx           ← Página de testes
│
├── __tests__/
│   └── certificate.test.ts               ← Testes unitários
│
└── Documentação
    ├── CERTIFICADO_INTEGRACAO_PRONTA.md
    ├── TESTE_PASSO_A_PASSO.md
    └── (outras docs)
```

---

## 4️⃣ COMPONENTES E SEUS PAPÉIS

### **TrailViewer.tsx** (Principal)
```
Responsabilidades:
  ✅ Renderizar a trilha
  ✅ Marcar materiais como concluídos
  ✅ Calcular progresso geral
  ✅ Monitorar quando === 100%
  ✅ Chamar issueCertificate()
  ✅ Exibir <TrailCompletionCertificate />
```

### **useCertificates (Hook)**
```
Responsabilidades:
  ✅ Retornar função issueCertificate()
  ✅ Gerenciar estado de certificados
  ✅ Fornecer métodos auxiliares
  ✅ Integração com certificateService
```

### **certificateService**
```
Responsabilidades:
  ✅ Gerar dados do certificado
  ✅ Criar verificationCode único
  ✅ Salvar no localStorage
  ✅ Recuperar certificados salvos
  ✅ Formatar datas
  ✅ Validar completação (100%)
```

### **TrailCompletionCertificate**
```
Responsabilidades:
  ✅ Exibir tela de celebração (confete)
  ✅ Mostrar botão "Ver Certificado"
  ✅ Renderizar <CertificatePreview />
  ✅ Aceitar callback onClose
```

### **CertificatePreview**
```
Responsabilidades:
  ✅ Exibir layout tipo diploma
  ✅ Mostrar dados do certificado
  ✅ Fornecer botões Imprimir/Download
  ✅ Aplicar CSS print-friendly
  ✅ Gerar HTML para download
```

---

## 5️⃣ ESTADOS E PROPS

### **TrailViewer.tsx**
```javascript
// Estados novos:
const [showCertificate, setShowCertificate] = useState(false);
const [issuedCertificate, setIssuedCertificate] = useState(null);

// Hook:
const { issueCertificate } = useCertificates();

// UseEffect:
useEffect(() => {
  if (trail && getProgressPercentage() === 100 && !showCertificate) {
    const cert = issueCertificate(/*...params...*/);
    setIssuedCertificate(cert);
    setShowCertificate(true);
  }
}, [trail, getProgressPercentage(), ...]);
```

### **TrailCompletionCertificate**
```javascript
// Props:
interface Props {
  certificate: Certificate;
  onClose: () => void;
}

// Renderização:
{showCertificate && issuedCertificate && (
  <TrailCompletionCertificate
    certificate={issuedCertificate}
    onClose={() => setShowCertificate(false)}
  />
)}
```

---

## 6️⃣ FLUXO DE DADOS - LOCALSTORAGE

```
┌─────────────────────────────────────┐
│     certificateService.js           │
│                                     │
│  issueCertificate(...)              │
│     ↓                               │
│  const cert = {                     │
│    userId, trailId, ...,            │
│    status: 'visual',                │
│    verificationCode: 'CERT_...'     │
│  }                                  │
│     ↓                               │
│  localStorage.setItem(              │
│    'certificate_1_42',              │
│    JSON.stringify(cert)             │
│  )                                  │
└─────────────┬───────────────────────┘
              │
              ↓
┌─────────────────────────────────────┐
│        Browser LocalStorage         │
│                                     │
│  certificate_1_42: {                │
│    userId: 1,                       │
│    trailId: 42,                     │
│    trailName: "...",                │
│    studentName: "...",              │
│    startDate: "...",                │
│    endDate: "...",                  │
│    workload: 40,                    │
│    status: "visual",                │
│    issuedAt: "...",                 │
│    verificationCode: "CERT_1_..."   │
│  }                                  │
│                                     │
│  certificate_1_50: {                │
│    ... outro certificado ...        │
│  }                                  │
│                                     │
│  (... mais certificados ...)        │
└─────────────────────────────────────┘
```

---

## 7️⃣ EVENTOS E CICLO DE VIDA

```
Evento 1: Usuário clica em ✓
  └─ Chamado: toggleCompleted() ou markAsCompleted()
  └─ Efeito: completedMaterials atualizado

Evento 2: Estado atualizado
  └─ React rerender detectado
  └─ getProgressPercentage() recalculado

Evento 3: Progresso atinge 100%
  └─ useEffect detecta mudança
  └─ Condicional: if (100% && !showCert)
  └─ issueCertificate() chamado

Evento 4: Certificado gerado
  └─ Salvo em localStorage
  └─ setShowCertificate(true)
  └─ setIssuedCertificate(cert)

Evento 5: Rerender
  └─ <TrailCompletionCertificate /> renderizado
  └─ Confete anima
  └─ Botões interativos

Evento 6: Usuário clica "Ver Certificado"
  └─ <CertificatePreview /> exibido
  └─ Layout diploma visível

Evento 7: Usuário clica "Imprimir"
  └─ window.print() chamado
  └─ CSS media print ativado
  └─ Dialogo de impressão abre

Evento 8: Usuário clica "Fechar"
  └─ setShowCertificate(false)
  └─ Modal desaparece
```

---

## 8️⃣ DADOS DO CERTIFICADO (Estrutura)

```typescript
interface Certificate {
  userId: number;           // ID do usuário
  trailId: number;          // ID da trilha
  trailName: string;        // Nome da trilha
  studentName: string;      // Nome completo do aluno
  startDate: string;        // ISO string de início
  endDate: string;          // ISO string de conclusão
  workload: number;         // Horas de carga horária
  status: 'visual' | 'pending_sync' | 'issued';  // Status
  issuedAt: string;         // Quando foi emitido
  verificationCode: string; // Código único para validação
}
```

---

## 9️⃣ RESUMO EM CÓDIGO

```tsx
// 1. TrailViewer.tsx
useEffect(() => {
  // 2. Monitorar quando 100%
  if (getProgressPercentage() === 100) {
    // 3. Chamar issueCertificate()
    const cert = issueCertificate(userId, trailId, ...);
    
    // 4. Salvar estado
    setIssuedCertificate(cert);
    setShowCertificate(true);
  }
}, [getProgressPercentage()]);

// 5. Renderizar quando showCertificate === true
{showCertificate && issuedCertificate && (
  <TrailCompletionCertificate 
    certificate={issuedCertificate}
    onClose={() => setShowCertificate(false)}
  />
)}
```

---

## 🔟 CHECKLIST VISUAL

```
┌─ INTEGRAÇÃO
│  ├─ [X] Imports adicionados
│  ├─ [X] Hook importado
│  ├─ [X] Estados criados
│  └─ [X] JSX renderizado
│
├─ LÓGICA
│  ├─ [X] markAsCompleted() funciona
│  ├─ [X] getProgressPercentage() calcula
│  ├─ [X] useEffect monitora 100%
│  └─ [X] issueCertificate() emite
│
├─ ARMAZENAMENTO
│  ├─ [X] localStorage.setItem() salva
│  ├─ [X] Dados persistem
│  └─ [X] Pode recuperar
│
├─ INTERFACE
│  ├─ [X] Celebração renderiza
│  ├─ [X] Confete anima
│  ├─ [X] Modal exibe
│  ├─ [X] Diploma mostra dados
│  ├─ [X] Botão Imprimir funciona
│  └─ [X] Botão Download funciona
│
└─ TESTES
   ├─ [X] Teste automático em TrailViewer
   ├─ [X] Teste manual em TestCertificatePage
   └─ [X] Testes unitários criados
```

---

**🎉 Tudo interconectado e funcionando!**

