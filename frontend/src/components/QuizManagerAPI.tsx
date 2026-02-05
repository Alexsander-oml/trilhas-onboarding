/**
 * QUIZ MANAGER - Gerenciador de Quiz integrado com API
 *
 * Funcionalidades:
 * - Criar novo quiz
 * - Adicionar questões existentes do banco
 * - Criar novas questões na hora
 * - Visualizar e remover questões
 * - Gerenciar configurações do quiz
 */

import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";

interface QuizManagerProps {
  id_modulo: number;
  id_quiz?: number;
  onClose: () => void;
  questoesLocais?: (Questao | Record<string, unknown>)[];
  onSaveLocal?: (questoes: (Questao | Record<string, unknown>)[]) => void;
}

interface Questao {
  id_questao: number;
  enunciado: string;
  alternativa_a: string;
  alternativa_b: string;
  alternativa_c: string;
  alternativa_d: string;
  gabarito: string;
  feedback?: string;
}

interface QuizQuestao {
  id_quiz_questao: number;
  id_questao: number;
  questao: Questao;
  ordem: number;
}

export const QuizManagerAPI: React.FC<QuizManagerProps> = ({
  id_modulo,
  id_quiz,
  onClose,
  questoesLocais = [],
  onSaveLocal,
}) => {
  // Detectar se estamos em modo local (módulo não existe no backend ainda)
  const isLocalMode = id_modulo > 1000000000000; // IDs temporários são timestamps
  const LOCAL_BANK_KEY = "quiz_local_bank";

  const readLocalBank = (): Questao[] => {
    try {
      const raw = localStorage.getItem(LOCAL_BANK_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return Array.isArray(arr) ? (arr as Questao[]) : [];
    } catch {
      return [];
    }
  };

  const writeLocalBank = (qs: Questao[]) => {
    try {
      localStorage.setItem(LOCAL_BANK_KEY, JSON.stringify(qs));
    } catch {
      /* noop */
    }
  };

  const [tab, setTab] = useState<"manage" | "add-existing" | "create-new">(
    "manage",
  );
  const [questoesDoQuiz, setQuestoesDoQuiz] = useState<QuizQuestao[]>([]);
  const [questoesDisponiveis, setQuestoesDisponiveis] = useState<Questao[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [localQuizId, setLocalQuizId] = useState<number | null>(null); // Quiz criado localmente
  const [selectedQuestoes, setSelectedQuestoes] = useState<Set<number>>(
    new Set(),
  ); // Para seleção múltipla
  const [editingQuestao, setEditingQuestao] = useState<Questao | null>(null); // Para editar questão

  // Estado para criar nova questão
  const [novaQuestao, setNovaQuestao] = useState({
    enunciado: "",
    alternativa_a: "",
    alternativa_b: "",
    alternativa_c: "",
    alternativa_d: "",
    gabarito: "A" as "A" | "B" | "C" | "D",
    feedback: "",
  });

  // Carregar quiz se existir
  const carregarQuestoes = useCallback(
    async (quizId?: number) => {
      const qId = quizId || id_quiz || localQuizId;
      if (!qId) return;
      try {
        setIsLoading(true);
        const response = await api.get(`/quiz/${qId}/`);
        setQuestoesDoQuiz(response.data.questoes_detalhes || []);
      } catch (error) {
        console.error("Erro ao carregar questões:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [id_quiz, localQuizId],
  );

  const carregarQuestoesDisponiveis = useCallback(async () => {
    // Sempre considerar banco local
    const localItems = readLocalBank();
    if (isLocalMode) {
      setQuestoesDisponiveis(localItems);
      return;
    }
    try {
      const url = searchTerm
        ? `/questoes/search/?search=${encodeURIComponent(searchTerm)}&limit=50`
        : "/questoes/search/?limit=50";

      const response = await api.get(url);
      const data = response.data.results || response.data || [];
      const apiItems: Questao[] = Array.isArray(data) ? data : [];
      // Mesclar banco local com as da API, evitando duplicatas por id
      const merged = [
        ...localItems,
        ...apiItems.filter(
          (apiQ) => !localItems.some((lq) => lq.id_questao === apiQ.id_questao),
        ),
      ];
      setQuestoesDisponiveis(merged);
    } catch (error) {
      console.error("Erro ao carregar questões:", error);
      // Mesmo em erro de rede, mostrar banco local
      setQuestoesDisponiveis(localItems);
    }
  }, [searchTerm, isLocalMode]);

  useEffect(() => {
    // Se estiver em modo local, carregar questões locais
    if (isLocalMode && questoesLocais.length > 0) {
      setQuestoesDoQuiz(
        questoesLocais.map((q, idx) => {
          const questao = q as Questao;
          return {
            id_quiz_questao: idx,
            id_questao: questao.id_questao || 0,
            questao: questao,
            ordem: idx,
          };
        }),
      );
    } else {
      // Modo backend normal
      const currentQuizId = id_quiz || localQuizId;
      if (currentQuizId) {
        carregarQuestoes(currentQuizId);
      }
    }
  }, [id_quiz, localQuizId, carregarQuestoes, isLocalMode, questoesLocais]);

  useEffect(() => {
    carregarQuestoesDisponiveis();
  }, [carregarQuestoesDisponiveis]);

  // Revalidar banco local quando o modo (local/backend) muda
  useEffect(() => {
    const localItems = readLocalBank();
    if (isLocalMode) setQuestoesDisponiveis(localItems);
  }, [isLocalMode]);

  const adicionarQuestao = async (id_questao: number) => {
    try {
      setIsLoading(true);

      // MODO LOCAL: adicionar à lista local do quiz
      if (isLocalMode) {
        const q = questoesDisponiveis.find((x) => x.id_questao === id_questao);
        if (!q) {
          alert("Questão não encontrada no banco local");
          return;
        }
        const novasQuestoes = [
          ...questoesDoQuiz,
          {
            id_quiz_questao: questoesDoQuiz.length,
            id_questao: q.id_questao,
            questao: q,
            ordem: questoesDoQuiz.length,
          },
        ];
        setQuestoesDoQuiz(novasQuestoes);
        if (onSaveLocal) onSaveLocal(novasQuestoes.map((i) => i.questao));
        alert("✅ Questão adicionada!");
        return;
      }

      // Se não existe quiz, criar primeiro
      let quizId = currentQuizId;
      if (!quizId) {
        const quizResponse = await api.post("/quiz/create-with-atividade/", {
          id_modulo,
          titulo_atividade: "Avaliação",
          titulo_quiz: "Quiz",
          descricao_quiz: "Quiz do módulo",
        });
        quizId = quizResponse.data?.quiz?.id_quiz;
        if (quizId) {
          setLocalQuizId(quizId);
        } else {
          throw new Error("Falha ao criar quiz");
        }
      }

      // Se a questão é do banco local, criar no backend primeiro
      const localBank = readLocalBank();
      const localQ = localBank.find((x) => x.id_questao === id_questao);
      let questaoIdToAdd = id_questao;
      if (localQ) {
        const createRes = await api.post("/questoes/create/", {
          enunciado: localQ.enunciado,
          alternativa_a: localQ.alternativa_a,
          alternativa_b: localQ.alternativa_b,
          alternativa_c: localQ.alternativa_c,
          alternativa_d: localQ.alternativa_d,
          gabarito: localQ.gabarito,
          feedback: localQ.feedback,
        });
        questaoIdToAdd = createRes.data.id_questao;
        // Remover do banco local
        const remaining = localBank.filter((x) => x.id_questao !== id_questao);
        writeLocalBank(remaining);
        // Atualizar disponíveis
        await carregarQuestoesDisponiveis();
      }

      await api.post(`/quiz/${quizId}/adicionar-questao/`, {
        questao_id: questaoIdToAdd,
      });
      await carregarQuestoes(quizId);
      alert("Questão adicionada com sucesso!");
    } catch (error: Error | unknown) {
      const axiosError = error as
        | { response?: { data?: { error?: string } } }
        | undefined;
      console.error("Erro ao adicionar questão:", error);
      alert(axiosError?.response?.data?.error || "Erro ao adicionar questão");
    } finally {
      setIsLoading(false);
    }
  };

  const criarNovaQuestao = async () => {
    if (!novaQuestao.enunciado.trim()) {
      alert("Preencha o enunciado da questão");
      return;
    }

    try {
      setIsLoading(true);

      // MODO LOCAL: apenas adicionar à lista local
      if (isLocalMode) {
        const novaQuestaoLocal = {
          id_questao: Date.now(), // ID temporário
          ...novaQuestao,
          _isLocal: true, // Marcador para identificar questões locais
        };

        const novasQuestoes = [
          ...questoesDoQuiz,
          {
            id_quiz_questao: questoesDoQuiz.length,
            id_questao: novaQuestaoLocal.id_questao,
            questao: novaQuestaoLocal,
            ordem: questoesDoQuiz.length,
          },
        ];

        setQuestoesDoQuiz(novasQuestoes);

        // Salvar localmente via callback
        if (onSaveLocal) {
          onSaveLocal(novasQuestoes.map((q) => q.questao));
        }

        // Limpar formulário
        setNovaQuestao({
          enunciado: "",
          alternativa_a: "",
          alternativa_b: "",
          alternativa_c: "",
          alternativa_d: "",
          gabarito: "A",
          feedback: "",
        });

        setTab("manage");
        alert("✅ Questão adicionada! Será salva quando você salvar a trilha.");
        return;
      }

      // MODO BACKEND NORMAL: criar no backend
      let quizId = currentQuizId;
      if (!quizId) {
        const quizResponse = await api.post("/quiz/create-with-atividade/", {
          id_modulo,
          titulo_atividade: "Avaliação",
          titulo_quiz: "Quiz",
          descricao_quiz: "Quiz do módulo",
        });
        quizId = quizResponse.data?.quiz?.id_quiz;
        if (quizId) {
          setLocalQuizId(quizId);
        } else {
          throw new Error("Falha ao criar quiz");
        }
      }

      // Criar questão
      const response = await api.post("/questoes/create/", novaQuestao);
      const novaQuestaoId = response.data.id_questao;

      // Adicionar ao quiz
      await api.post(`/quiz/${quizId}/adicionar-questao/`, {
        questao_id: novaQuestaoId,
      });

      // Limpar formulário
      setNovaQuestao({
        enunciado: "",
        alternativa_a: "",
        alternativa_b: "",
        alternativa_c: "",
        alternativa_d: "",
        gabarito: "A",
        feedback: "",
      });

      await carregarQuestoes(quizId);
      setTab("manage");
      alert("Questão criada e adicionada com sucesso!");
    } catch (error) {
      console.error("Erro ao criar questão:", error);
      alert("Erro ao criar questão");
    } finally {
      setIsLoading(false);
    }
  };

  const criarApenasQuestao = async () => {
    if (!novaQuestao.enunciado.trim()) {
      alert("Preencha o enunciado da questão");
      return;
    }

    try {
      setIsLoading(true);

      // MODO LOCAL: criar somente no banco local
      if (isLocalMode) {
        const novaLocal: Questao = {
          id_questao: Date.now(),
          enunciado: novaQuestao.enunciado,
          alternativa_a: novaQuestao.alternativa_a,
          alternativa_b: novaQuestao.alternativa_b,
          alternativa_c: novaQuestao.alternativa_c,
          alternativa_d: novaQuestao.alternativa_d,
          gabarito: novaQuestao.gabarito,
          feedback: novaQuestao.feedback,
        };
        const novasDisponiveis = [novaLocal, ...questoesDisponiveis];
        setQuestoesDisponiveis(novasDisponiveis);
        try {
          localStorage.setItem(
            LOCAL_BANK_KEY,
            JSON.stringify(novasDisponiveis),
          );
        } catch (e) {
          console.warn(
            "Não foi possível persistir banco local de questões:",
            e,
          );
        }
        // Limpar formulário
        setNovaQuestao({
          enunciado: "",
          alternativa_a: "",
          alternativa_b: "",
          alternativa_c: "",
          alternativa_d: "",
          gabarito: "A",
          feedback: "",
        });
        setTab("add-existing");
        alert(
          "✅ Questão criada localmente! Aparecerá em 'Adicionar Existente'",
        );
        return;
      }

      // MODO BACKEND: criar apenas a questão, não adicionar ao quiz
      await api.post("/questoes/create/", novaQuestao);

      // Limpar formulário
      setNovaQuestao({
        enunciado: "",
        alternativa_a: "",
        alternativa_b: "",
        alternativa_c: "",
        alternativa_d: "",
        gabarito: "A",
        feedback: "",
      });

      // Recarregar questões disponíveis para mostrar a nova questão
      await carregarQuestoesDisponiveis();

      // Mudar para a aba de adicionar existentes
      setTab("add-existing");
      alert(
        "✅ Questão criada com sucesso! Aparecerá em 'Adicionar Existente'",
      );
    } catch (error) {
      console.error("Erro ao criar questão:", error);
      alert("Erro ao criar questão");
    } finally {
      setIsLoading(false);
    }
  };

  const removerVariasQuestoes = async () => {
    if (selectedQuestoes.size === 0) {
      alert("Selecione pelo menos uma questão para remover");
      return;
    }

    if (!confirm(`Deseja remover ${selectedQuestoes.size} questão(ões)?`)) {
      return;
    }

    try {
      setIsLoading(true);

      // MODO LOCAL
      if (isLocalMode) {
        const novasQuestoes = questoesDoQuiz.filter(
          (q) => !selectedQuestoes.has(q.questao.id_questao),
        );
        setQuestoesDoQuiz(novasQuestoes);

        if (onSaveLocal) {
          onSaveLocal(novasQuestoes.map((q) => q.questao));
        }

        setSelectedQuestoes(new Set());
        alert("✅ Questões removidas!");
        return;
      }

      // MODO BACKEND
      if (!currentQuizId) return;

      for (const id_questao of selectedQuestoes) {
        await api.delete(
          `/quiz/${currentQuizId}/remover-questao/${id_questao}/`,
        );
      }

      await carregarQuestoes();
      setSelectedQuestoes(new Set());
      alert("Questões removidas com sucesso!");
    } catch (error) {
      console.error("Erro ao remover questões:", error);
      alert("Erro ao remover questões");
    } finally {
      setIsLoading(false);
    }
  };

  const reordenarQuestoes = (direção: "up" | "down", indice: number) => {
    const novasQuestoes = [...questoesDoQuiz];

    if (direção === "up" && indice > 0) {
      [novasQuestoes[indice], novasQuestoes[indice - 1]] = [
        novasQuestoes[indice - 1],
        novasQuestoes[indice],
      ];
    } else if (direção === "down" && indice < novasQuestoes.length - 1) {
      [novasQuestoes[indice], novasQuestoes[indice + 1]] = [
        novasQuestoes[indice + 1],
        novasQuestoes[indice],
      ];
    }

    // Atualizar ordem
    novasQuestoes.forEach((q, idx) => {
      q.ordem = idx;
    });

    setQuestoesDoQuiz(novasQuestoes);

    if (isLocalMode && onSaveLocal) {
      onSaveLocal(novasQuestoes.map((q) => q.questao));
    }
  };

  const embaralharQuestoes = () => {
    const novasQuestoes = [...questoesDoQuiz].sort(() => Math.random() - 0.5);

    // Atualizar ordem
    novasQuestoes.forEach((q, idx) => {
      q.ordem = idx;
    });

    setQuestoesDoQuiz(novasQuestoes);

    if (isLocalMode && onSaveLocal) {
      onSaveLocal(novasQuestoes.map((q) => q.questao));
    }

    alert("✅ Questões embaralhadas!");
  };

  const abrirEdicao = (questao: Questao) => {
    setEditingQuestao({ ...questao });
  };

  const salvarEdicao = async () => {
    if (!editingQuestao) return;

    try {
      setIsLoading(true);

      // MODO LOCAL
      if (isLocalMode) {
        const novasQuestoes = questoesDoQuiz.map((q) => ({
          ...q,
          questao:
            q.questao.id_questao === editingQuestao.id_questao
              ? editingQuestao
              : q.questao,
        }));
        setQuestoesDoQuiz(novasQuestoes);

        if (onSaveLocal) {
          onSaveLocal(novasQuestoes.map((q) => q.questao));
        }

        setEditingQuestao(null);
        alert("✅ Questão atualizada!");
        return;
      }

      // MODO BACKEND
      await api.put(`/questoes/${editingQuestao.id_questao}/`, editingQuestao);
      await carregarQuestoes();
      setEditingQuestao(null);
      alert("Questão atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar questão:", error);
      alert("Erro ao salvar questão");
    } finally {
      setIsLoading(false);
    }
  };

  const removerQuestao = async (id_questao: number) => {
    if (!confirm("Tem certeza que deseja remover esta questão?")) return;

    try {
      setIsLoading(true);

      // MODO LOCAL: remover da lista local
      if (isLocalMode) {
        const novasQuestoes = questoesDoQuiz.filter(
          (q) => q.questao.id_questao !== id_questao,
        );
        setQuestoesDoQuiz(novasQuestoes);

        // Salvar localmente via callback
        if (onSaveLocal) {
          onSaveLocal(novasQuestoes.map((q) => q.questao));
        }

        alert("✅ Questão removida!");
        return;
      }

      // MODO BACKEND NORMAL
      if (!currentQuizId) return;

      await api.delete(`/quiz/${currentQuizId}/remover-questao/${id_questao}/`);
      await carregarQuestoes();
      alert("Questão removida com sucesso!");
    } catch (error) {
      console.error("Erro ao remover questão:", error);
      alert("Erro ao remover questão");
    } finally {
      setIsLoading(false);
    }
  };

  const currentQuizId = id_quiz || localQuizId;

  const filteredQuestoesDisponiveis = React.useMemo(() => {
    if (!searchTerm) return questoesDisponiveis;
    const term = searchTerm.toLowerCase();
    return questoesDisponiveis.filter((q) =>
      [
        q.enunciado,
        q.alternativa_a,
        q.alternativa_b,
        q.alternativa_c,
        q.alternativa_d,
      ]
        .filter(Boolean)
        .some((t) => (t as string).toLowerCase().includes(term)),
    );
  }, [questoesDisponiveis, searchTerm]);

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <div>
            <h2 className="text-2xl font-bold">📝 Gerenciar Quiz</h2>
            {isLocalMode && (
              <p className="mt-1 text-sm text-amber-600">
                ⚡ Modo Local - As questões serão salvas quando você salvar a
                trilha
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6 pt-4">
          <button
            onClick={() => setTab("manage")}
            className={`border-b-2 px-4 py-2 font-medium transition-all ${
              tab === "manage"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            📋 Questões ({questoesDoQuiz.length})
          </button>
          <button
            onClick={() => setTab("add-existing")}
            className={`border-b-2 px-4 py-2 font-medium transition-all ${
              tab === "add-existing"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            ➕ Adicionar Existente
          </button>
          <button
            onClick={() => setTab("create-new")}
            className={`border-b-2 px-4 py-2 font-medium transition-all ${
              tab === "create-new"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            ✏️ Criar Nova
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Manage Tab */}
          {tab === "manage" && (
            <div className="space-y-4">
              {/* Barra de ações */}
              {questoesDoQuiz.length > 0 && (
                <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <button
                    onClick={embaralharQuestoes}
                    className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white transition-all hover:bg-blue-700 disabled:opacity-50"
                  >
                    🔀 Embaralhar
                  </button>
                  {selectedQuestoes.size > 0 && (
                    <button
                      onClick={removerVariasQuestoes}
                      className="flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm text-white transition-all hover:bg-red-700 disabled:opacity-50"
                    >
                      🗑️ Remover {selectedQuestoes.size} selecionada(s)
                    </button>
                  )}
                  {selectedQuestoes.size > 0 && (
                    <button
                      onClick={() => setSelectedQuestoes(new Set())}
                      className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 transition-all hover:bg-gray-200"
                    >
                      ✕ Limpar seleção
                    </button>
                  )}
                </div>
              )}

              {/* Modal de Edição */}
              {editingQuestao && (
                <div className="space-y-4 rounded-lg border-2 border-blue-500 bg-blue-50 p-4">
                  <h3 className="font-semibold text-blue-900">
                    ✏️ Editando Questão
                  </h3>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-900">
                      Enunciado
                    </label>
                    <textarea
                      value={editingQuestao.enunciado}
                      onChange={(e) =>
                        setEditingQuestao({
                          ...editingQuestao,
                          enunciado: e.target.value,
                        })
                      }
                      className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    {["a", "b", "c", "d"].map((letter) => (
                      <div key={letter}>
                        <label className="mb-1 block text-xs font-medium text-gray-900">
                          Alt. {letter.toUpperCase()}
                        </label>
                        <input
                          type="text"
                          value={
                            editingQuestao[
                              `alternativa_${letter}` as keyof Questao
                            ] as string
                          }
                          onChange={(e) =>
                            setEditingQuestao({
                              ...editingQuestao,
                              [`alternativa_${letter}`]: e.target.value,
                            } as Questao)
                          }
                          className="w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <select
                      value={editingQuestao.gabarito}
                      onChange={(e) =>
                        setEditingQuestao({
                          ...editingQuestao,
                          gabarito: e.target.value,
                        })
                      }
                      className="rounded border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                    >
                      <option value="A">Gabarito: A</option>
                      <option value="B">Gabarito: B</option>
                      <option value="C">Gabarito: C</option>
                      <option value="D">Gabarito: D</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-medium text-gray-900">
                      Feedback
                    </label>
                    <textarea
                      value={editingQuestao.feedback || ""}
                      onChange={(e) =>
                        setEditingQuestao({
                          ...editingQuestao,
                          feedback: e.target.value,
                        })
                      }
                      className="w-full rounded border px-2 py-1 text-sm focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      rows={2}
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={salvarEdicao}
                      disabled={isLoading}
                      className="flex-1 rounded bg-green-600 px-3 py-2 text-sm text-white transition-all hover:bg-green-700 disabled:opacity-50"
                    >
                      💾 Salvar
                    </button>
                    <button
                      onClick={() => setEditingQuestao(null)}
                      className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 transition-all hover:bg-gray-100"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                </div>
              )}

              {questoesDoQuiz.length === 0 ? (
                <div className="py-12 text-center text-gray-600">
                  <p className="mb-2 text-lg font-medium">
                    Nenhuma questão cadastrada
                  </p>
                  <p>Use as abas acima para adicionar questões ao quiz</p>
                </div>
              ) : (
                questoesDoQuiz.map((item, idx) => {
                  const q = item.questao;
                  const isSelected = selectedQuestoes.has(q.id_questao);

                  return (
                    <div
                      key={item.id_quiz_questao}
                      className={`rounded-lg border transition-all ${
                        isSelected
                          ? "border-blue-500 bg-blue-50"
                          : "bg-gray-50 hover:bg-white"
                      }`}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-1 items-start gap-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSelected = new Set(selectedQuestoes);
                                if (e.target.checked) {
                                  newSelected.add(q.id_questao);
                                } else {
                                  newSelected.delete(q.id_questao);
                                }
                                setSelectedQuestoes(newSelected);
                              }}
                              className="mt-1"
                            />
                            <div className="flex-1">
                              <h4 className="mb-3 font-medium text-gray-900">
                                {idx + 1}. {q.enunciado}
                              </h4>
                              <div className="space-y-2 rounded bg-white p-3 text-sm text-gray-600">
                                <p>
                                  <strong>A)</strong> {q.alternativa_a}
                                </p>
                                <p>
                                  <strong>B)</strong> {q.alternativa_b}
                                </p>
                                <p>
                                  <strong>C)</strong> {q.alternativa_c}
                                </p>
                                <p>
                                  <strong>D)</strong> {q.alternativa_d}
                                </p>
                                <div className="border-t pt-2 text-green-700">
                                  <strong>✓ Gabarito: {q.gabarito}</strong>
                                </div>
                                {q.feedback && (
                                  <div className="rounded border-t bg-blue-50 p-2 pt-2">
                                    <p className="text-xs text-blue-700">
                                      <strong>💡 {q.feedback}</strong>
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="ml-4 flex flex-col gap-2">
                            {/* Botões de reordenação */}
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => reordenarQuestoes("up", idx)}
                                disabled={idx === 0}
                                className="rounded bg-gray-300 px-2 py-1 text-xs text-gray-700 transition-all hover:bg-gray-400 disabled:opacity-30"
                                title="Mover para cima"
                              >
                                ▲
                              </button>
                              <button
                                onClick={() => reordenarQuestoes("down", idx)}
                                disabled={idx === questoesDoQuiz.length - 1}
                                className="rounded bg-gray-300 px-2 py-1 text-xs text-gray-700 transition-all hover:bg-gray-400 disabled:opacity-30"
                                title="Mover para baixo"
                              >
                                ▼
                              </button>
                            </div>

                            {/* Botões de ação */}
                            <button
                              onClick={() => abrirEdicao(q)}
                              className="rounded bg-blue-600 px-3 py-2 text-xs text-white transition-all hover:bg-blue-700"
                              title="Editar questão"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => removerQuestao(q.id_questao)}
                              disabled={isLoading}
                              className="rounded bg-red-600 px-3 py-2 text-xs text-white transition-all hover:bg-red-700 disabled:opacity-50"
                              title="Remover questão"
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Add Existing Tab */}
          {tab === "add-existing" && (
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="🔍 Procurar questões..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>

              {isLoading ? (
                <p className="text-center text-gray-600">Carregando...</p>
              ) : filteredQuestoesDisponiveis.length === 0 ? (
                <p className="py-8 text-center text-gray-600">
                  {searchTerm
                    ? "Nenhuma questão encontrada"
                    : "Nenhuma questão disponível"}
                </p>
              ) : (
                filteredQuestoesDisponiveis.map((q) => (
                  <div
                    key={q.id_questao}
                    className="rounded-lg border bg-gray-50 p-4 transition-all hover:bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="mb-2 font-medium text-gray-900">
                          {q.enunciado}
                        </h4>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <strong>A)</strong> {q.alternativa_a}
                          </p>
                          <p>
                            <strong>B)</strong> {q.alternativa_b}
                          </p>
                          <p>
                            <strong>C)</strong> {q.alternativa_c}
                          </p>
                          <p>
                            <strong>D)</strong> {q.alternativa_d}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => adicionarQuestao(q.id_questao)}
                        disabled={
                          isLoading ||
                          questoesDoQuiz.some(
                            (item) => item.questao.id_questao === q.id_questao,
                          )
                        }
                        className="ml-4 rounded bg-green-600 px-3 py-2 text-sm text-white transition-all hover:scale-105 hover:bg-green-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {questoesDoQuiz.some(
                          (item) => item.questao.id_questao === q.id_questao,
                        )
                          ? "✓ Adicionada"
                          : "➕ Adicionar"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Create New Tab */}
          {tab === "create-new" && (
            <div className="max-w-2xl space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Enunciado da Questão *
                </label>
                <textarea
                  value={novaQuestao.enunciado}
                  onChange={(e) =>
                    setNovaQuestao({
                      ...novaQuestao,
                      enunciado: e.target.value,
                    })
                  }
                  className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  rows={3}
                  placeholder="Digite a pergunta aqui..."
                />
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {["a", "b", "c", "d"].map((letter) => (
                  <div key={letter}>
                    <label className="mb-1 block text-sm font-medium text-gray-900">
                      Alternativa {letter.toUpperCase()} *
                    </label>
                    <input
                      type="text"
                      value={
                        novaQuestao[
                          `alternativa_${letter}` as keyof typeof novaQuestao
                        ] as string
                      }
                      onChange={(e) =>
                        setNovaQuestao({
                          ...novaQuestao,
                          [`alternativa_${letter}`]: e.target.value,
                        } as typeof novaQuestao)
                      }
                      className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      placeholder={`Alternativa ${letter.toUpperCase()}`}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-900">
                  Gabarito Correto *
                </label>
                <select
                  value={novaQuestao.gabarito}
                  onChange={(e) =>
                    setNovaQuestao({
                      ...novaQuestao,
                      gabarito: e.target.value as "A" | "B" | "C" | "D",
                    })
                  }
                  className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-900">
                  Feedback/Explicação (Opcional)
                </label>
                <textarea
                  value={novaQuestao.feedback}
                  onChange={(e) =>
                    setNovaQuestao({ ...novaQuestao, feedback: e.target.value })
                  }
                  className="w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  rows={3}
                  placeholder="Explicação da resposta correta..."
                />
              </div>

              <p className="text-xs text-gray-500">* Campos obrigatórios</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-gray-200 p-6">
          <button
            onClick={onClose}
            className="rounded border border-gray-300 px-4 py-2 text-gray-700 transition-all hover:bg-gray-50"
          >
            ← Fechar
          </button>
          {tab === "create-new" && (
            <>
              <button
                onClick={criarApenasQuestao}
                disabled={isLoading || !novaQuestao.enunciado.trim()}
                className="rounded bg-blue-600 px-4 py-2 text-white transition-all hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? "Criando..." : "💾 Apenas Criar"}
              </button>
              <button
                onClick={criarNovaQuestao}
                disabled={isLoading || !novaQuestao.enunciado.trim()}
                className="rounded bg-purple-600 px-4 py-2 text-white transition-all hover:bg-purple-700 disabled:opacity-50"
              >
                {isLoading ? "Criando..." : "✏️ Criar e Adicionar"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizManagerAPI;
