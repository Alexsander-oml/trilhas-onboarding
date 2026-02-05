## 🚀 QUICK START - Sistema de Certificação

**Tempo de setup: 5 minutos**

---

## 1️⃣ Copiar a Estrutura

Os arquivos já estão criados em:

```
frontend/src/
├── types/certificate.ts
├── services/certificates.service.ts
├── hooks/useCertificates.ts
├── components/
│   ├── CertificatePreview.tsx
│   ├── CertificateModal.tsx
│   ├── TrailCompletionCertificate.tsx
│   └── index.ts
```

✅ **Nada a copiar manualmente!**

---

## 2️⃣ Usar em Seu Componente (30 segundos)

### Opção A: Import simples

```typescript
import { useCertificates } from "../hooks/useCertificates";
import TrailCompletionCertificate from "../components/TrailCompletionCertificate";

export function TrailDetail() {
  const { issueCertificate } = useCertificates();
  const [certificate, setCertificate] = useState(null);
  const [showCertificate, setShowCertificate] = useState(false);

  return (
    <>
      {/* Seu código aqui */}
      {showCertificate && certificate && (
        <TrailCompletionCertificate
          trailName="Trilha XYZ"
          studentName="João Silva"
          certificate={certificate}
          onClose={() => setShowCertificate(false)}
        />
      )}
    </>
  );
}
```

### Opção B: Import do index

```typescript
import {
  useCertificates,
  TrailCompletionCertificate,
} from "../components/index";
```

---

## 3️⃣ Detectar 100% e Gerar Certificado

```typescript
useEffect(() => {
  if (completionPercentage === 100 && !certificate) {
    const generateCert = async () => {
      const cert = await issueCertificate(
        user.id,
        trailId,
        "Trilha de Onboarding",
        user.nome_completo,
        "2024-01-15",  // Data de início
        new Date().toISOString().split('T')[0],  // Hoje
        40  // Horas
      );
      setCertificate(cert);
      setShowCertificate(true);
    };
    generateCert();
  }
}, [completionPercentage, certificate, issueCertificate]);
```

---

## 4️⃣ Pronto! 🎉

**Que tal testar?**

1. Abra browser
2. Navegue para sua trilha
3. Complete 100% dos módulos
4. Veja a celebração com confete
5. Clique "Ver Certificado"
6. Imprima ou baixe

---

## 📚 Documentação Completa

Se precisar de mais informações:

- **Overview**: [CERTIFICATE_SYSTEM.md](./CERTIFICATE_SYSTEM.md)
- **Integração**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Testes**: [CERTIFICATE_TESTING.md](./CERTIFICATE_TESTING.md)
- **Exemplo Visual**: [CERTIFICATE_VISUAL_EXAMPLE.md](./CERTIFICATE_VISUAL_EXAMPLE.md)
- **Resumo**: [CERTIFICATE_SYSTEM_SUMMARY.md](../CERTIFICATE_SYSTEM_SUMMARY.md)

---

## 🔧 Dicas Rápidas

### Obter Certificados do Usuário

```typescript
const { certificates, getCertificates } = useCertificates();

useEffect(() => {
  getCertificates(userId);
}, [userId]);

console.log(certificates);  // Array de certificados
```

### Sincronizar com Backend (Futuro)

```typescript
const { syncCertificates } = useCertificates();

// Quando usuário fizer login
syncCertificates(userId);
```

### Verificar localStorage

```javascript
// No console do navegador
JSON.parse(localStorage.getItem('certificates'))
```

---

## ⚡ Erros Comuns

### ❌ "Certificate is undefined"
```typescript
// Errado
<CertificatePreview certificate={null} />

// Certo
{certificate && <CertificatePreview certificate={certificate} />}
```

### ❌ "completionPercentage is not 100"
```typescript
// Verificar como você calcula a conclusão
const percentage = (completed / total) * 100;
```

### ❌ "localStorage.getItem returns null"
```typescript
// Gerar certificado primeiro
await issueCertificate(...);
// Depois recuperar
const certs = await getCertificates(userId);
```

---

## 🎯 Próximas Etapas

### Curto Prazo (Hoje)
- [x] Importar componentes
- [x] Integrar em TrailDetail
- [x] Testar localmente

### Médio Prazo (Esta semana)
- [ ] Criar página "Meus Certificados"
- [ ] Adicionar menu "Certificados"
- [ ] Testar impressão

### Longo Prazo (Próximo mês)
- [ ] Setup Django
- [ ] Descomentar REST API
- [ ] Sincronizar com backend

---

## 💬 Suporte

Dúvidas frequentes:

**P: Funciona sem backend?**
A: Sim! Usa localStorage. Backend é opcional.

**P: Posso customizar o layout?**
A: Sim! Edite CertificatePreview.tsx

**P: Como adiciono mais trilhas?**
A: Chame issueCertificate para cada uma.

**P: Quando sincroniza com backend?**
A: Quando você descomentar o código e Django estiver pronto.

---

## ✅ Checklist

- [ ] Arquivos criados (vide estrutura acima)
- [ ] Import do hook feito
- [ ] useEffect adicionado
- [ ] Componente exibido
- [ ] Teste local (100% → certificado)
- [ ] Imprimiu/baixou

**Se tudo checked: Sistema funciona! 🎉**

---

## 📞 Precisa de Ajuda?

1. Leia a documentação correspondente
2. Verifique os exemplos em `CertificateIntegrationExample.tsx`
3. Consulte o console para erros
4. Limpe localStorage se tiver dúvidas: `localStorage.removeItem('certificates')`

---

**Sistema pronto para uso em produção! ✨**

Criado em Janeiro 2026 | v1.0.0
