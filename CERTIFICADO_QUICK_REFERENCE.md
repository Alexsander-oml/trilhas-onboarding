# ⚡ QUICK REFERENCE - Certificado

## 📍 SUA PERGUNTA
"No caso navegando diretamente na página, como eu crio o certificado?"

## ✅ RESPOSTA RÁPIDA
**Você não cria. O sistema cria automaticamente quando você completa 100% de uma trilha.**

---

## 🎬 PASSO A PASSO (3 MINUTOS)

```
1. Abra a trilha
   └─ http://localhost:5173 → Clique numa trilha

2. Marque materiais como concluído
   └─ Para cada item: Leia/assista → Clique ✓

3. Quando atingir 100%
   └─ 🎊 Certificado aparece automaticamente

4. Clique "Ver Certificado"
   └─ Veja o diploma

5. Imprima ou baixe
   └─ Tenha seu PDF!
```

---

## 🔍 ONDE MONITORAR

| Ação | Onde Ver |
|------|----------|
| Certificado criado | F12 → Console → Procure "Certificado emitido:" |
| Dados salvos | F12 → Application → Local Storage → `certificate_1_42` |
| Progresso real | Barra de progresso na página da trilha |
| Célula do useEffect | `TrailViewer.tsx` linhas 151-175 |

---

## 📚 DOCUMENTAÇÃO COMPLETA

| Arquivo | Para Quem |
|---------|-----------|
| `CERTIFICADO_RESUMO_EXECUTIVO.md` | Visão geral rápida |
| `TESTE_PASSO_A_PASSO.md` | Como testar na prática |
| `CERTIFICADO_MAPA_VISUAL.md` | Entender a arquitetura |
| `CERTIFICADO_INTEGRACAO_PRONTA.md` | Detalhes técnicos |

---

## 🔧 ARQUIVO MODIFICADO

Apenas **1 arquivo alterado:**
- `frontend/src/components/TrailViewer.tsx`

**O quê foi adicionado:**
- 3 imports (linhas 37-39)
- 1 hook (linha 51)
- 2 estados (linhas 56-57)
- 1 useEffect (linhas 151-175)
- 1 componente JSX (linhas 1253-1259)

**Total:** ~30 linhas de código

---

## 🧪 TESTE AGORA

### Opção A: Normal
```
1. Abra uma trilha
2. Complete todos os materiais ✓✓✓
3. Veja certificado aparecer 🎉
```

### Opção B: Rápido
```
URL: http://localhost:5173/test-certificate
Clique: "Criar Certificado de Teste"
Veja: Certificado renderizar instantaneamente
```

---

## 💾 DADOS SALVOS

```json
{
  "key": "certificate_1_42",
  "userId": 1,
  "trailId": 42,
  "studentName": "João Silva",
  "trailName": "JavaScript Avançado",
  "startDate": "2025-12-20T...",
  "endDate": "2026-01-19T...",
  "workload": 40,
  "status": "visual",
  "verificationCode": "CERT_1_42_8F4C2"
}
```

**Localização:** `localStorage['certificate_${userId}_${trailId}']`

---

## 🎨 TELAS QUE VÊ

### Tela 1: Celebração
```
🎊 PARABÉNS! 🎊
Você concluiu com sucesso!
[Ver Certificado]
```

### Tela 2: Diploma
```
═══════════════════════════════════
    CERTIFICADO DE CONCLUSÃO
    
Aluno: João Silva
Trilha: JavaScript Avançado
Período: 20/12/2025 - 19/01/2026
Carga: 40 horas
Código: CERT_1_42_8F4C2

[Imprimir] [Download]
═══════════════════════════════════
```

---

## 🔌 FLUXO TÉCNICO

```
Mark material ✓
    ↓
completedMaterials.size++
    ↓
getProgressPercentage() → 100
    ↓
useEffect detecta
    ↓
issueCertificate() chamado
    ↓
localStorage.setItem('certificate_1_42', {...})
    ↓
setShowCertificate(true)
    ↓
<TrailCompletionCertificate /> renderizado
    ↓
🎉 Certificado visível na tela!
```

---

## ❓ FAQ RÁPIDO

**P: O certificado salva mesmo offline?**  
R: Sim! Usa localStorage, funciona sem internet.

**P: Como sincronizar com backend depois?**  
R: Descomente a API em `certificates.service.ts` linhas 80-120.

**P: Pode imprimir como PDF?**  
R: Sim! Clique "Imprimir" → "Salvar como PDF".

**P: Preciso fazer algo especial?**  
R: Não. Apenas complete a trilha normalmente.

**P: E se não funcionar?**  
R: Abra F12 Console, procure por erros em vermelho, ou limpe localStorage e recarregue.

---

## 🚀 RESUMO FINAL

```
┌─────────────────────────────────────┐
│  INTEGRAÇÃO: ✅ COMPLETA            │
│  FUNCIONAMENTO: ✅ AUTOMÁTICO       │
│  DOCUMENTAÇÃO: ✅ COMPLETA          │
│  TESTES: ✅ PRONTOS                 │
│                                     │
│  🎯 BORA TESTAR AGORA! 🚀          │
└─────────────────────────────────────┘
```

---

**⏱️ Tempo para ver funcionando: 5 minutos**

1. Abra uma trilha (1 min)
2. Complete 5-10 materiais (3-4 min)
3. Veja certificado aparecer (instantâneo)
4. Imprima/baixe (< 1 min)

---

## 🎓 Status Final

| Item | Status |
|------|--------|
| Código | ✅ Pronto |
| Integração | ✅ Completa |
| Testes | ✅ Criados |
| Documentação | ✅ Completa |
| **Você pode usar?** | ✅ **SIM! AGORA!** |

