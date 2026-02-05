# 🎯 Guia Passo a Passo - Testar Certificado na Página

## 📍 Resumo: O que foi integrado?

O certificado agora **aparece automaticamente** quando você completa 100% de uma trilha. Não precisa fazer nada especial!

---

## 🚶 Passo a Passo para Testar

### **Passo 1: Abra a Aplicação**
```
URL: http://localhost:5173
Ou: http://localhost:3000 (depende da sua configuração)
```

### **Passo 2: Faça Login**
- Use suas credenciais de Aprendiz
- Vá para a página "Minhas Trilhas"

### **Passo 3: Abra uma Trilha**
- Clique em qualquer trilha
- Você entrará no visualizador de trilha

### **Passo 4: Complete os Materiais**
Para cada material:
1. Leia/assista o conteúdo
2. Clique no botão **"✓ Marcar como Concluído"** (ou clique no checkbox)
3. Avance para o próximo material

**Exemplo visual:**
```
Módulo 1
  ✓ Material 1 (Leitura)
  ✓ Material 2 (Vídeo)  
  ✓ Material 3 (Quiz)   ← Marque este também!

Módulo 2
  ✓ Material 4 (PDF)
  ✓ Material 5 (Atividade)
  
... continue para todos os materiais
```

### **Passo 5: Quando Atingir 100%**
Automaticamente:
- 🎊 A tela de **celebração com confete** vai aparecer
- Você verá uma mensagem de parabéns
- Um botão **"Ver Certificado"** aparecerá

### **Passo 6: Visualize o Certificado**
Clique em **"Ver Certificado"** e você verá:
- ✏️ Seu nome completo
- 📚 Nome da trilha
- 📅 Datas de início e conclusão
- ⏱️ Carga horária
- 🔐 Código único de verificação

### **Passo 7: Imprima ou Baixe**
- **Botão "Imprimir"**: Abre diálogo de impressão (salve como PDF)
- **Botão "Download"**: Salva como arquivo HTML
- **Botão "Fechar"**: Volta para a trilha

---

## 🧪 Teste Rápido (Se Tiver Pressa)

Se não quiser completar toda a trilha, use o **TestCertificatePage**:

```
URL: http://localhost:5173/test-certificate
```

Nesta página:
1. Clique em **"✨ Criar Certificado de Teste"**
2. Veja a tela de celebração aparecer instantaneamente
3. Teste a visualização do certificado

---

## 📊 O que Acontece nos Bastidores

```
┌─────────────────────────────────────────┐
│  Você marca material como concluído ✓   │
└────────────────────┬────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────┐
│ Função markAsCompleted() é chamada      │
│ completedMaterials.size aumenta         │
└────────────────────┬────────────────────┘
                     │
                     ↓
┌─────────────────────────────────────────┐
│ getProgressPercentage() recalcula       │
│ (completedMaterials / totalMaterials)   │
└────────────────────┬────────────────────┘
                     │
                     ↓
       ┌─────────────┴─────────────┐
       │                           │
       ↓                           ↓
    [99%]                       [100%]
     Nada                      useEffect
     acontece                   dispara!
                                   │
                                   ↓
                    ┌──────────────────────┐
                    │ issueCertificate()   │
                    │ é chamado            │
                    └──────────────────┬───┘
                                       │
                                       ↓
                    ┌──────────────────────┐
                    │ localStorage.setItem │
                    │ ("certificate_...")  │
                    └──────────────────┬───┘
                                       │
                                       ↓
                    ┌──────────────────────┐
                    │ setShowCertificate   │
                    │ (true)               │
                    └──────────────────┬───┘
                                       │
                                       ↓
                    ┌──────────────────────┐
                    │ <TrailCompletion...> │
                    │ renderiza na tela    │
                    │ 🎉 CERTIFICADO!      │
                    └──────────────────────┘
```

---

## 🔍 Onde Verificar o Certificado

### **1. No localStorage (DevTools)**
Abra: **F12 → Application → Local Storage**

Procure por chaves tipo:
```
certificate_1_42
certificate_1_50
certificate_2_15
```

Clique e veja o JSON completo com todos os dados.

### **2. No Console**
Abra: **F12 → Console**

Execute:
```javascript
// Ver todos os certificados do usuário 1
const certs = Object.entries(localStorage)
  .filter(([key]) => key.startsWith('certificate_1_'))
  .map(([key, value]) => JSON.parse(value));
console.log('Certificados:', certs);
```

---

## ⚙️ Configuração Automática

Tudo já está configurado automaticamente:

- ✅ Imports adicionados ao TrailViewer.tsx
- ✅ Hook useCertificates integrado
- ✅ Estados criados (showCertificate, issuedCertificate)
- ✅ useEffect monitorando progresso
- ✅ Componente renderizando no DOM

**Você não precisa fazer NADA a mais. Apenas navegar normalmente!**

---

## 🆘 Se Não Funcionar

### **Problema 1: Certificado não aparece ao atingir 100%**

**Solução:**
1. Verifique no Console (F12) se vê a mensagem "Certificado emitido:"
2. Confirme que `getProgressPercentage()` retorna exatamente 100
3. Verifique se todos os materiais têm o checkbox marcado

### **Problema 2: Página está em branco**

**Solução:**
1. Recarregue: F5
2. Abra o Console (F12) e procure por erros em vermelho
3. Verifique se os imports estão corretos

### **Problema 3: Botão "Marcar como Concluído" não funciona**

**Solução:**
1. Certifique-se de que está dentro de uma trilha (não fora)
2. Verifique se o material carregou completamente
3. Tente fechar e abrir a trilha novamente

---

## ✨ Exemplo de Fluxo Completo

```
Você clica em "Minhas Trilhas"
        ↓
Seleciona "JavaScript Avançado"
        ↓
Vê: 5 módulos, 25 materiais (0% concluído)
        ↓
Lê Material 1 → Marca ✓ (4% concluído)
        ↓
Assiste Material 2 → Marca ✓ (8% concluído)
        ↓
... continua completando ...
        ↓
Completa Material 25 → Marca ✓ (100% concluído)
        ↓
🎊 BOOM! Certificado aparece automaticamente!
        ↓
Clica "Ver Certificado"
        ↓
Vê o diploma bonito
        ↓
Imprime como PDF
        ↓
Compartilha com os amigos 🚀
```

---

## 🎯 Resumo Final

| O que | Onde | Como |
|------|------|------|
| **Testar** | Em qualquer trilha | Complete 100% dos materiais |
| **Teste Rápido** | http://localhost:5173/test-certificate | Use o botão "Criar Certificado" |
| **Ver Dados** | DevTools → Local Storage | Procure por `certificate_` |
| **Debug** | F12 Console | Procure por "Certificado emitido:" |
| **Imprimir** | No certificado visual | Clique em "Imprimir" |

---

**🚀 Pronto! Vá testar agora mesmo!**

