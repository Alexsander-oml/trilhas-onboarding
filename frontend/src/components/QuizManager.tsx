import React, { useState } from "react";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface QuizManagerProps {
  onSaveQuiz: (questions: QuizQuestion[], passingScore: number) => void;
  onCancel: () => void;
  initialQuestions?: QuizQuestion[];
  initialPassingScore?: number;
}

const QuizManager: React.FC<QuizManagerProps> = ({
  onSaveQuiz,
  onCancel,
  initialQuestions = [],
  initialPassingScore = 70,
}) => {
  function createEmptyQuestion(id: number): QuizQuestion {
    return {
      id,
      question: "",
      options: ["", "", "", ""],
      correctAnswer: 0,
      explanation: "",
    };
  }

  // Validar e normalizar questões iniciais
  const normalizeQuestions = (questions: QuizQuestion[]): QuizQuestion[] => {
    if (!questions || questions.length === 0) {
      return [createEmptyQuestion(1)];
    }
    return questions.map((q, idx) => ({
      id: q.id || idx + 1,
      question: q.question || "",
      options:
        Array.isArray(q.options) && q.options.length === 4
          ? q.options
          : ["", "", "", ""],
      correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0,
      explanation: q.explanation || "",
    }));
  };

  const [questions, setQuestions] = useState<QuizQuestion[]>(
    normalizeQuestions(initialQuestions),
  );
  const [passingScore, setPassingScore] = useState(initialPassingScore);

  const addQuestion = () => {
    const newId = Math.max(...questions.map((q) => q.id), 0) + 1;
    setQuestions([...questions, createEmptyQuestion(newId)]);
  };

  const removeQuestion = (id: number) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const updateQuestion = (
    id: number,
    field: keyof QuizQuestion,
    value: any,
  ) => {
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)),
    );
  };

  const updateOption = (
    questionId: number,
    optionIndex: number,
    value: string,
  ) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              options: q.options.map((opt, idx) =>
                idx === optionIndex ? value : opt,
              ),
            }
          : q,
      ),
    );
  };

  const handleSave = () => {
    // Validar se todas as perguntas estão preenchidas
    const isValid = questions.every(
      (q) =>
        q.question.trim() !== "" &&
        q.options.every((opt) => opt.trim() !== "") &&
        q.correctAnswer >= 0 &&
        q.correctAnswer < 4,
    );

    if (!isValid) {
      alert(
        "Por favor, preencha todas as perguntas, opções e selecione a resposta correta.",
      );
      return;
    }

    onSaveQuiz(questions, passingScore);
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black p-4">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-lg bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900">Gerenciar Quiz</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 transition-colors hover:text-gray-600"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Passing Score */}
          <div className="mb-6">
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nota Mínima para Aprovação (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={passingScore}
              onChange={(e) => setPassingScore(Number(e.target.value))}
              className="w-32 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {questions &&
              Array.isArray(questions) &&
              questions.map((question, questionIndex) => (
                <div
                  key={question.id}
                  className="rounded-lg border border-gray-200 p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">
                      Pergunta {questionIndex + 1}
                    </h3>
                    {questions.length > 1 && (
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="text-red-600 transition-colors hover:text-red-800"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    )}
                  </div>

                  {/* Question Text */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Pergunta
                    </label>
                    <textarea
                      value={question.question}
                      onChange={(e) =>
                        updateQuestion(question.id, "question", e.target.value)
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      rows={3}
                      placeholder="Digite a pergunta..."
                    />
                  </div>

                  {/* Options */}
                  <div className="mb-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Opções de Resposta
                    </label>
                    <div className="space-y-2">
                      {question.options &&
                        Array.isArray(question.options) &&
                        question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className="flex items-center space-x-3"
                          >
                            <input
                              type="radio"
                              name={`correct-answer-${question.id}`}
                              checked={question.correctAnswer === optionIndex}
                              onChange={() =>
                                updateQuestion(
                                  question.id,
                                  "correctAnswer",
                                  optionIndex,
                                )
                              }
                              className="h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) =>
                                updateOption(
                                  question.id,
                                  optionIndex,
                                  e.target.value,
                                )
                              }
                              className="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                              placeholder={`Opção ${optionIndex + 1}...`}
                            />
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Explanation */}
                  <div>
                    <label className="mb-2 block text-sm font-medium text-gray-700">
                      Explicação (opcional)
                    </label>
                    <textarea
                      value={question.explanation || ""}
                      onChange={(e) =>
                        updateQuestion(
                          question.id,
                          "explanation",
                          e.target.value,
                        )
                      }
                      className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
                      rows={2}
                      placeholder="Explicação da resposta correta..."
                    />
                  </div>
                </div>
              ))}
          </div>

          {/* Add Question Button */}
          <button
            onClick={addQuestion}
            className="mt-6 flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Adicionar Pergunta
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 border-t border-gray-200 p-6">
          <button
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
          >
            Salvar Quiz
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizManager;
