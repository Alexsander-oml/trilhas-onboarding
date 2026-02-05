# 📜 Sistema de Certificação - Documentação Completa

## 🎯 Visão Geral

Sistema completo de certificação visual para a plataforma Trilhas-Onboarding que:

- ✅ Gera certificados ao completar 100% de uma trilha
- ✅ Exibe certificado em layout institucional semelhante a diploma
- ✅ Permite impressão e download do certificado
- ✅ Armazena certificados localmente (localStorage) com status "visual"
- ✅ Contém integrações REST comentadas prontas para Django
- ✅ Suporta sincronização com backend quando disponível
- ✅ Completamente encapsulado e reutilizável

---

## 📁 Estrutura de Arquivos

```
frontend/src/
├── types/
│   └── certificate.ts                    # Tipos e interfaces
├── services/
│   └── certificates.service.ts           # Service principal
├── hooks/
│   └── useCertificates.ts                # Hook customizado
├── components/
│   ├── CertificatePreview.tsx            # Exibe certificado
│   ├── CertificateModal.tsx              # Modal do certificado
│   ├── TrailCompletionCertificate.tsx   # Celebração de conclusão
│   └── examples/
│       └── CertificateIntegrationExample.tsx  # Exemplos de uso
```

---

## 🔧 Como Usar

### 1️⃣ Integração Básica - Hook

```typescript
import { useCertificates } from "../hooks/useCertificates";

function MyComponent() {
  const { 
    certificates, 
    issueCertificate, 
    getCertificates,
    syncCertificates,
    isLoading,
    error 
  } = useCertificates();

  // Gerar novo certificado
  const handleCompleteTrial = async () => {
    const certificate = await issueCertificate(
      userId,           // number
      trailId,          // number
      "Trilha XYZ",     // trailName
      "João Silva",     // studentName
      "2024-01-15",     // startDate (YYYY-MM-DD)
      "2024-01-31",     // endDate (YYYY-MM-DD)
      40                // workload (horas)
    );
    
    // Usar certificado...
  };

  // Recuperar certificados do usuário
  useEffect(() => {
    getCertificates(userId);
  }, [userId]);

  return (
    // Seu JSX aqui
  );
}
```

### 2️⃣ Exibir Certificado

```typescript
import CertificatePreview from "../components/CertificatePreview";

<CertificatePreview
  certificate={certificate}
  onClose={() => console.log("Fechado")}
  showPrintButton={true}
/>
```

### 3️⃣ Celebração de Conclusão

```typescript
import TrailCompletionCertificate from "../components/TrailCompletionCertificate";

<TrailCompletionCertificate
  trailName="Trilha de Onboarding"
  studentName="João Silva"
  certificate={certificate}
  onClose={() => console.log("Fechado")}
/>
```

---

## 📊 Estrutura de Dados

### Certificate

```typescript
interface Certificate {
  id?: string;                    // ID único (gerado localmente ou pelo backend)
  userId: number;                 // ID do usuário
  trailId: number;                // ID da trilha
  trailName: string;              // Nome da trilha
  studentName: string;            // Nome do aluno
  startDate: string;              // Data inicial (ISO 8601: YYYY-MM-DD)
  endDate: string;                // Data final (ISO 8601: YYYY-MM-DD)
  workload: number;               // Carga horária
  issuedAt: string;               // Data/hora da emissão (ISO 8601)
  status: "visual" | "issued" | "pending_sync";  // Status
  verificationCode?: string;      // Código para validação (opcional)
}
```

### Status

- **visual**: Certificado salvo apenas localmente (localStorage)
- **issued**: Certificado sincronizado com backend
- **pending_sync**: Aguardando sincronização com backend

---

## 🔌 Service API

### CertificateService

#### `issueCertificate()`

Gera um novo certificado e o salva localmente.

```typescript
const certificate = await certificateService.issueCertificate(
  userId: number,
  trailId: number,
  trailName: string,
  studentName: string,
  startDate: string,
  endDate: string,
  workload: number
): Promise<Certificate>
```

#### `getUserCertificates()`

Recupera todos os certificados de um usuário.

```typescript
const certificates = await certificateService.getUserCertificates(
  userId: number
): Promise<Certificate[]>
```

#### `syncPendingCertificates()`

Sincroniza certificados pendentes com o backend.

```typescript
await certificateService.syncPendingCertificates(userId: number): Promise<void>
```

#### `formatDate()`

Formata data para exibição em português.

```typescript
const formatted = certificateService.formatDate("2024-01-31")
// Resultado: "31 de janeiro de 2024"
```

#### `isTrailComplete()`

Verifica se a trilha foi completada 100%.

```typescript
const isComplete = certificateService.isTrailComplete(completionPercentage: number): boolean
```

---

## 🔄 Fluxo de Funcionamento

### 1. Usuário Completa Trilha (100%)

```
┌─────────────────┐
│  Trilha 100%    │
└────────┬────────┘
         │
         ↓
┌──────────────────────────┐
│  issueCertificate()      │
│  (service)               │
└────────┬─────────────────┘
         │
         ├─→ Gera ID único
         ├─→ Define status "visual"
         ├─→ Salva em localStorage
         │
         ↓
┌──────────────────────────┐
│  TrailCompletionCert...  │
│  (celebração)            │
└────────┬─────────────────┘
         │
         ├─→ Mostra confete
         ├─→ Oferece ver certificado
         │
         ↓
┌──────────────────────────┐
│  CertificatePreview      │
│  (exibição)              │
└────────┬─────────────────┘
         │
         ├─→ Layout institucional
         ├─→ Botão imprimir
         ├─→ Botão baixar
         │
         ↓
┌──────────────────────────┐
│  Certificado Salvo       │
│  (localStorage)          │
└──────────────────────────┘
```

### 2. Sincronização com Backend (Futuro)

```
┌──────────────────────────┐
│  syncPendingCertificates │
│  (quando backend online) │
└────────┬─────────────────┘
         │
         ├─→ POST /api/certificates/
         ├─→ Recebe resposta com ID
         ├─→ Atualiza status "issued"
         ├─→ Armazena verificationCode
         │
         ↓
┌──────────────────────────┐
│  Certificado no Backend  │
│  (persistido)            │
└──────────────────────────┘
```

---

## 💾 localStorage

Os certificados são salvos com a seguinte estrutura:

```json
{
  "certificates": {
    "123": [
      {
        "id": "cert_1234567890_abc123def456",
        "userId": 123,
        "trailId": 42,
        "trailName": "Trilha de Onboarding",
        "studentName": "João Silva",
        "startDate": "2024-01-15",
        "endDate": "2024-01-31",
        "workload": 40,
        "issuedAt": "2024-02-01T10:30:00Z",
        "status": "visual"
      }
    ]
  }
}
```

---

## 🔗 Integração com Backend (Django)

### Endpoints Comentados

Os seguintes endpoints estão comentados no service e prontos para descomente:

#### 1. Criar Certificado

```typescript
POST /api/certificates/

Body:
{
  "userId": 123,
  "trailId": 42,
  "trailName": "Trilha XYZ",
  "studentName": "João Silva",
  "startDate": "2024-01-15",
  "endDate": "2024-01-31",
  "workload": 40,
  "status": "issued"
}

Response:
{
  "id": "uuid-here",
  "userId": 123,
  "trailId": 42,
  "trailName": "Trilha XYZ",
  "studentName": "João Silva",
  "startDate": "2024-01-15",
  "endDate": "2024-01-31",
  "workload": 40,
  "issuedAt": "2024-02-01T10:30:00Z",
  "verificationCode": "CERT-XXXXX-XXXXX",
  "createdAt": "2024-02-01T10:30:00Z",
  "updatedAt": "2024-02-01T10:30:00Z"
}
```

#### 2. Obter Certificados do Usuário

```typescript
GET /api/certificates/me/

Response: Certificate[]
```

### Como Descomente para Usar Django

1. Abra `services/certificates.service.ts`
2. Procure pelos comentários `// TODO: INTEGRAÇÃO COM BACKEND`
3. Remova os comentários `/* */` envolvendo o código
4. O service automaticamente usará os endpoints REST

---

## 📋 Exemplo Completo de Integração

Veja o arquivo `CertificateIntegrationExample.tsx` para exemplos de:

- ✅ Gerar certificado ao completar trilha
- ✅ Exibir lista de meus certificados
- ✅ Badge de certificados disponíveis
- ✅ Preview/impressão

---

## 🎨 Personalização

### Customizar Layout do Certificado

Edite o arquivo `CertificatePreview.tsx`:

```typescript
// Alterar cores
border-4 border-amber-900  // Bordas
bg-amber-50               // Fundo institucional

// Alterar fonte
fontFamily: "Georgia, serif"  // Padrão: Georgia

// Alterar textos
"CERTIFICADO DE CONCLUSÃO"  // Título
"Certificamos que..."       // Parágrafo
```

### Adicionar Logo da Instituição

No `CertificatePreview.tsx`, adicione após o header:

```typescript
<img 
  src="/path/to/logo.png" 
  alt="Logo" 
  className="h-16 w-16 mx-auto" 
/>
```

---

## ✅ Checklist de Implementação

- [x] Tipos e interfaces criados
- [x] Service de certificados implementado
- [x] Hook customizado criado
- [x] Componente de preview criado
- [x] Componente de celebração criado
- [x] Exemplos de integração fornecidos
- [x] localStorage implementado
- [x] Integrações REST comentadas e prontas
- [x] Documentação completa

---

## 🚀 Próximos Passos

1. **Integração com Django**: Descomentar o código de sincronização
2. **Validação de Certificados**: Implementar verificação via código
3. **Dashboard de Certificados**: Criar página de meus certificados
4. **Notificações**: Enviar email com certificado ao concluir
5. **Analytics**: Rastrear uso de certificados

---

## 📞 Suporte

Para dúvidas sobre o sistema de certificados:

1. Verifique a documentação acima
2. Consulte os exemplos em `CertificateIntegrationExample.tsx`
3. Verifique os comentários no código
4. Abra uma issue no repositório

---

**Última atualização**: Janeiro 2026
**Versão**: 1.0.0
**Status**: Production Ready ✅
