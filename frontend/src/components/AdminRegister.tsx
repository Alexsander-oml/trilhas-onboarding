import React, { useEffect, useState } from "react";
import { apiUtils } from "../services/api";

type User = {
  id: number;
  username: string;
  email: string;
  role: string;
};

export default function AdminRegister() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Aprendiz");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      // normalize role to backend choice (model expects 'Autor de conteúdo')
      const apiRole =
        role === "Autor" || role === "Autor de Conteúdo"
          ? "Autor de conteúdo"
          : role;
      // split fullName into first_name / last_name (simple heuristic: first token -> first_name, rest -> last_name)
      const parts = fullName.trim().split(/\s+/).filter(Boolean);
      const first_name = parts.length ? parts[0] : "";
      const last_name = parts.length > 1 ? parts.slice(1).join(" ") : "";
      // compute a safe username: prefer email local-part, fallback to normalized name
      let username = "";
      if (email && email.includes("@")) username = email.split("@")[0];
      else
        username = (
          first_name + (last_name ? "_" + last_name.split(/\s+/).join("_") : "")
        ).toLowerCase();
      username = username.replace(/[^a-z0-9_.-]/gi, "");
      if (!username) username = `user${Date.now()}`;

      const payload = {
        username,
        first_name,
        last_name,
        email,
        password,
        role: apiRole,
      };
      // endpoint /admin/register/ (baseURL já inclui /api)
      // Retry loop in case backend rejects due to username uniqueness.
      const maxAttempts = 5;
      let attempt = 0;
      let created = false;
      const baseUsername = username;
      const isUsernameConflict = (respData: any) => {
        if (!respData) return false;
        if (typeof respData === "string")
          return /username.*unique/i.test(respData);
        if (Array.isArray(respData?.username) && respData.username.length)
          return true;
        if (
          respData?.username &&
          typeof respData.username === "string" &&
          respData.username.length
        )
          return true;
        if (
          respData?.non_field_errors &&
          JSON.stringify(respData.non_field_errors)
            .toLowerCase()
            .includes("username")
        )
          return true;
        return false;
      };

      while (attempt < maxAttempts && !created) {
        try {
          await apiUtils.post("/admin/register/", payload);
          created = true;
          break;
        } catch (err: unknown) {
          const anyErr = err as unknown as {
            response?: { data?: unknown };
            message?: string;
          };
          const resp = anyErr?.response?.data;
          if (isUsernameConflict(resp)) {
            attempt += 1;
            username = `${baseUsername}${attempt}`;
            payload.username = username;
            continue;
          }
          // other validation errors should bubble up
          throw err;
        }
      }
      if (!created) {
        throw new Error(
          "Não foi possível criar o usuário após várias tentativas (conflito de username)",
        );
      }
      setSuccess("Usuário criado com sucesso.");
      // atualizar lista após criação
      await loadUsers();
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("Aprendiz");
    } catch (err: unknown) {
      console.error("AdminRegister error", err);
      const anyErr = err as unknown as {
        response?: { data?: unknown };
        message?: string;
      };
      const msg =
        anyErr?.response?.data || anyErr?.message || "Erro ao criar usuário";
      // se vier um objeto de erros do DRF, transforme em string
      setError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const data = await apiUtils.get<User[]>("/users/admin/users/");
      setUsers(data);
    } catch (err) {
      console.error("Erro ao carregar usuários", err);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  return (
    <div className="mx-auto max-w-lg p-6">
      <h2 className="mb-4 text-xl font-semibold">Registrar usuário (Admin)</h2>

      {success && (
        <div className="mb-4 rounded border border-green-200 bg-green-50 p-3">
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            Nome completo
          </label>
          <input
            className="w-full rounded border px-3 py-2"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            placeholder="ex: João da Silva Souza"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Email</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="ex: joao@exemplo.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Senha</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Senha segura"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Papel</label>
          <select
            className="w-full rounded border px-3 py-2"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="Administrador">Administrador</option>
            <option value="Gestor">Gestor</option>
            <option value="Mentor">Mentor</option>
            <option value="Autor de conteúdo">Autor de Conteúdo</option>
            <option value="Aprendiz">Aprendiz</option>
          </select>
        </div>

        <div>
          <button
            type="submit"
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Criando..." : "Criar usuário"}
          </button>
        </div>
      </form>

      {/* Lista simples de usuários sincronizada com o backend */}
      <div className="mt-8">
        <h3 className="mb-2 text-lg font-medium">Usuários existentes</h3>
        <div className="rounded border bg-white p-3">
          {users.length === 0 && (
            <div className="text-sm text-gray-500">
              Nenhum usuário encontrado.
            </div>
          )}
          {users.length > 0 && (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500">
                  <th className="py-1">ID</th>
                  <th className="py-1">Username</th>
                  <th className="py-1">Email</th>
                  <th className="py-1">Role</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t">
                    <td className="py-2">{u.id}</td>
                    <td className="py-2">{u.username}</td>
                    <td className="py-2">{u.email}</td>
                    <td className="py-2">{u.role}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
