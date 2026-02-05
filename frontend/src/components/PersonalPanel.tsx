import React, { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation, NavLink } from "react-router-dom";
import { authService } from "../services/authService";
import api from "../services/api";
import { useTheme } from "../contexts/ThemeContext";

export default function PersonalPanel() {
  const stored = authService.getStoredUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const labelClass = `block text-sm font-medium ${isDark ? "text-gray-200" : "text-gray-700"}`;
  const inputClass = `w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400" : "border-gray-300 bg-white text-gray-900 placeholder-gray-500"}`;
  const cardClass = `rounded-xl border p-6 shadow ${isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100"}`;
  const [firstName, setFirstName] = useState(
    (stored as any)?.firstName ||
      (stored as any)?.first_name ||
      stored?.username ||
      "",
  );
  const [lastName, setLastName] = useState(
    (stored as any)?.lastName || (stored as any)?.last_name || "",
  );
  const [email, setEmail] = useState(stored?.email || "");
  const [phone, setPhone] = useState("");
  const [position, setPosition] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [street, setStreet] = useState("");
  const [number, setNumber] = useState("");
  const [complement, setComplement] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cep, setCep] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"info" | "success" | "error">(
    "info",
  );
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [avatarRemoved, setAvatarRemoved] = useState<boolean>(false);
  const objectUrlRef = useRef<string | null>(null);

  // Initialize avatar preview once on mount from stored user (do not override
  // temporary previews created by file selection). Reading stored user here
  // ensures this runs only on mount and not on every render (avoids flashy
  // overwrite when user selects a new image).
  useEffect(() => {
    try {
      const s = authService.getStoredUser();
      const av = (s as any)?.avatar || (s as any)?.avatar_url || null;
      if (av) setAvatarPreview(av);
    } catch (err) {
      console.warn("Could not read stored avatar", err);
    }
  }, []);

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const f = e.target.files?.[0];
    if (!f) return;
    const allowed = ["image/png", "image/jpeg", "image/jpg"];
    if (!allowed.includes(f.type)) {
      setAvatarError("Formato inválido. Use PNG ou JPG.");
      return;
    }
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (f.size > maxSize) {
      setAvatarError("Arquivo muito grande. Máx 2MB.");
      return;
    }
    setAvatarFile(f);
    setAvatarRemoved(false);
    // create data URL preview (more compatible than object URLs)
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarPreview(result);
    };
    reader.onerror = () => {
      setAvatarError("Não foi possível gerar pré-visualização da imagem.");
    };
    reader.readAsDataURL(f);
    objectUrlRef.current = null;
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(null);
    setAvatarRemoved(true);
    setAvatarError(null);
  };

  // revoke any created object URL when component unmounts
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        try {
          URL.revokeObjectURL(objectUrlRef.current);
        } catch {}
      }
    };
  }, []);

  const handleSave = async () => {
    setMessage(null);
    if (password && password !== confirmPassword) {
      setMessageType("error");
      setMessage("Senha e confirmação não coincidem.");
      return;
    }
    // basic email validation
    if (email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setMessageType("error");
      setMessage("Informe um e-mail válido.");
      return;
    }
    const user = authService.getStoredUser();
    if (!user?.id) {
      setMessage("Usuário não autenticado.");
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        position,
        birth_date: birthDate,
        address: {
          street,
          number,
          complement,
          neighborhood,
          city,
          state,
          cep,
        },
        notes,
      };
      // If the user selected an avatar file, upload it using authService.uploadAvatar
      if (avatarFile) {
        try {
          const uploadResp = await authService.uploadAvatar(
            user.id,
            avatarFile,
          );
          // If backend returns avatar URL (may be relative), build absolute URL for preview
          const rawAvatar =
            (uploadResp as any)?.avatar ||
            (uploadResp as any)?.avatar_url ||
            null;
          if (rawAvatar) {
            let newAvatar = rawAvatar as string;
            if (typeof newAvatar === "string" && newAvatar.startsWith("/")) {
              // derive API base (prefer VITE_API_BASE_URL, then axios baseURL, then window.origin)
              let apiBase = "";
              if (import.meta.env.VITE_API_BASE_URL) {
                apiBase = String(import.meta.env.VITE_API_BASE_URL);
              } else if ((api as any)?.defaults?.baseURL) {
                apiBase = String((api as any).defaults.baseURL);
              }
              apiBase = apiBase.replace(/\/api\/?$/, "").replace(/\/$/, "");
              if (!apiBase) apiBase = window.location.origin;
              newAvatar = `${apiBase}${newAvatar}`;
            }
            setAvatarPreview(newAvatar);
            // revoke any object URL we created earlier since we now reference server URL
            try {
              if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current);
                objectUrlRef.current = null;
              }
            } catch {}
          }
        } catch (e) {
          console.warn("Failed to upload avatar file", e);
          setMessageType("error");
          setMessage("Falha ao enviar imagem de perfil.");
          setSaving(false);
          return;
        }
      }
      // If user removed avatar explicitly, inform backend
      if (avatarRemoved && !avatarFile) {
        payload.avatar_removed = true;
      }
      if (password) payload.password = password;
      await authService.updateProfile(user.id, payload);
      // After saving profile, fetch current user from backend to get canonical avatar URL
      try {
        const refreshed = await authService.getCurrentUser();
        // prefer avatar or avatar_url fields
        const returnedAvatar =
          (refreshed as any)?.avatar || (refreshed as any)?.avatar_url || null;
        let finalAvatar = null;
        if (returnedAvatar) {
          finalAvatar = returnedAvatar as string;
          if (finalAvatar.startsWith("/")) {
            let apiBase = "";
            if (import.meta.env.VITE_API_BASE_URL) {
              apiBase = String(import.meta.env.VITE_API_BASE_URL);
            } else if ((api as any)?.defaults?.baseURL) {
              apiBase = String((api as any).defaults.baseURL);
            }
            apiBase = apiBase.replace(/\/api\/?$/, "").replace(/\/$/, "");
            if (!apiBase) apiBase = window.location.origin;
            finalAvatar = `${apiBase}${finalAvatar}`;
          }
          setAvatarPreview(finalAvatar);
        }
        // persist refreshed user to localStorage for other parts of the app
        try {
          localStorage.setItem("user", JSON.stringify(refreshed));
        } catch {}
      } catch (e) {
        console.warn("Could not refresh user after profile save", e);
      }
      setMessageType("success");
      setMessage("Perfil salvo com sucesso.");
      // Update stored user display name/email locally
      try {
        const updated: any = {
          ...(user as unknown as Record<string, any>),
          first_name: firstName,
          last_name: lastName,
          email,
        };
        // update local avatar immediately if we have a preview
        if (avatarPreview) {
          updated.avatar = avatarPreview;
        }
        localStorage.setItem("user", JSON.stringify(updated));
      } catch (e) {
        console.warn("Could not update local user", e);
      }
    } catch (e) {
      console.error("Erro ao salvar perfil", e);
      setMessageType("error");
      setMessage("Falha ao salvar perfil. Verifique os dados.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? "bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"}`}>
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column - profile card (harmonized with Aprendiz panel) */}
        <div className={cardClass}>
          <div className="mb-6 h-36 overflow-hidden rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="-mt-14 mb-4 flex flex-col items-center">
            <div className="relative">
              <label
                htmlFor="avatar-input"
                className={`flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 text-3xl font-bold text-white shadow-lg ring-4 ${isDark ? "ring-gray-800" : "ring-white"}`}
              >
                {avatarPreview ? (
                  // show image preview if available
                  // eslint-disable-next-line jsx-a11y/img-redundant-alt
                  <img
                    src={avatarPreview}
                    alt="Avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-white">
                    {(stored?.username || "U").slice(0, 2).toUpperCase()}
                  </div>
                )}
              </label>
              <input
                id="avatar-input"
                type="file"
                accept="image/png,image/jpeg"
                onChange={handleAvatarSelect}
                className="hidden"
              />
              {/* Edit overlay */}
              <div className="absolute -right-1 -bottom-1 cursor-pointer rounded-full border bg-white p-1 shadow">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 text-gray-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M17.414 2.586a2 2 0 010 2.828l-9.9 9.9a1 1 0 01-.465.263l-4 1a1 1 0 01-1.213-1.213l1-4a1 1 0 01.263-.465l9.9-9.9a2 2 0 012.828 0z" />
                </svg>
              </div>
            </div>
            <h3 className={`mt-4 text-xl font-semibold ${isDark ? "text-gray-100" : "text-gray-900"}`}>
              {(firstName + " " + lastName).trim() || stored?.username}
            </h3>
            <div className={`mt-1 text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>{email}</div>
          </div>

          <div className={`mt-6 border-t pt-4 ${isDark ? "border-gray-700" : ""}`}>
            <nav className="space-y-2 text-sm profile-nav">
              {/* highlight active nav item based on current pathname */}
              {(() => {
                const p = location.pathname;
                const isActive = (to: string) => {
                  // exact match or subpath (e.g. /painel or /painel/editar)
                  if (p === to) return true;
                  return p.startsWith(`${to}/`);
                };
                return (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        // navigate to role-appropriate panel (Aprendiz has a separate panel)
                        const role = (stored as any)?.role || null
                        if (role === 'Aprendiz') navigate('/painel-aprendiz')
                        else navigate('/painel')
                      }}
                      className={`block w-full rounded px-2 py-2 text-left ${isDark ? "text-gray-200 hover:bg-gray-800" : "text-gray-800 hover:bg-gray-50"}`}
                    >
                      Meu painel
                    </button>

                    <NavLink
                      to="/painel"
                      className={(props: { isActive: boolean }) => `block w-full rounded px-2 py-2 text-left ${isDark ? "text-gray-200 hover:bg-gray-800" : "text-gray-800 hover:bg-gray-50"} ${props.isActive || isActive('/painel') ? isDark ? 'bg-blue-900/30 font-semibold border-l-4 border-blue-400 text-blue-100' : 'bg-blue-50 font-semibold border-l-4 border-blue-600' : ''}`}
                    >
                      Meu perfil
                    </NavLink>

                    <NavLink
                      to="/certificados"
                      className={(props: { isActive: boolean }) => `block w-full rounded px-2 py-2 text-left ${isDark ? "text-gray-200 hover:bg-gray-800" : "text-gray-800 hover:bg-gray-50"} ${props.isActive || isActive('/certificados') ? isDark ? 'bg-blue-900/30 font-semibold border-l-4 border-blue-400 text-blue-100' : 'bg-blue-50 font-semibold border-l-4 border-blue-600' : ''}`}
                    >
                      Certificados
                    </NavLink>

                    <NavLink
                      to="/meu-aprendizado"
                      className={(props: { isActive: boolean }) => `block w-full rounded px-2 py-2 text-left ${isDark ? "text-gray-200 hover:bg-gray-800" : "text-gray-800 hover:bg-gray-50"} ${props.isActive || isActive('/meu-aprendizado') ? isDark ? 'bg-blue-900/30 font-semibold border-l-4 border-blue-400 text-blue-100' : 'bg-blue-50 font-semibold border-l-4 border-blue-600' : ''}`}
                    >
                      Meu histórico de aprendizado
                    </NavLink>

                    <button
                      onClick={() => {
                        authService.logout();
                        navigate('/login');
                      }}
                      className={`w-full rounded px-2 py-2 text-left ${isDark ? "text-red-400 hover:bg-gray-800" : "text-red-600 hover:bg-gray-50"}`}
                    >
                      Sair
                    </button>
                  </>
                );
              })()}
            </nav>
          </div>
        </div>

        {/* Right column - form spans two columns on large screens */}
        <div className={`${cardClass} lg:col-span-2`}>
            <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Informações pessoais</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className={`h-9 w-9 rounded-full border text-sm font-semibold transition-all ${isDark ? "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700" : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"}`}
                title="Alternar tema"
              >
                {isDark ? "☾" : "☀"}
              </button>
              <button
                onClick={() => {
                  const user = authService.getStoredUser();
                  const role = (user as any)?.role || null;
                  if (role === 'Administrador') navigate('/admin');
                  else if (role === 'Aprendiz') navigate('/aprendiz');
                  else navigate('/dashboard');
                }}
                className={`rounded-md px-3 py-1 text-sm ${isDark ? "border border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700" : "border border-gray-200 bg-white text-gray-800 hover:bg-gray-50"}`}
              >
                Ir para Home
              </button>
            </div>
          </div>
          {message && (
            <div
              className={`mb-4 rounded p-3 text-sm ${messageType === "success" ? isDark ? "border border-green-700 bg-green-900/40 text-green-100" : "border border-green-100 bg-green-50 text-green-800" : messageType === "error" ? isDark ? "border border-red-700 bg-red-900/40 text-red-100" : "border border-red-100 bg-red-50 text-red-800" : isDark ? "border border-yellow-700 bg-yellow-900/30 text-yellow-100" : "border border-yellow-100 bg-yellow-50 text-yellow-800"}`}
            >
              {message}
            </div>
          )}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className={labelClass}>
                Foto de perfil
              </label>
              <div className="mt-2 flex items-center gap-4">
                <div className={`h-20 w-20 overflow-hidden rounded-full border ${isDark ? "border-gray-700 bg-gray-800" : "bg-gray-100"}`}>
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-blue-600 text-xl font-bold text-white">
                      {(stored?.username || "U").slice(0, 2).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <label
                      htmlFor="avatar-input"
                      className={`inline-flex cursor-pointer items-center rounded border px-3 py-2 text-sm shadow-sm ${isDark ? "border-gray-600 bg-gray-800 text-gray-100 hover:bg-gray-700" : "border bg-white text-gray-800 hover:bg-gray-50"}`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className={`mr-2 h-4 w-4 ${isDark ? "text-gray-300" : "text-gray-600"}`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V7.414A2 2 0 0016.586 6L13 2.414A2 2 0 0011.586 2H4z" />
                      </svg>
                      Escolher arquivo
                    </label>
                    <input
                      id="avatar-input"
                      type="file"
                      accept="image/png,image/jpeg"
                      onChange={handleAvatarSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      className={`rounded px-3 py-2 text-sm ${isDark ? "border border-red-700 bg-red-900/40 text-red-100 hover:bg-red-900/60" : "border bg-red-50 text-red-700 hover:bg-red-100"}`}
                    >
                      Remover
                    </button>
                  </div>
                  <div className={`mt-2 text-xs ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                    PNG ou JPG — até 2MB
                  </div>
                  {avatarError && (
                    <div className="mt-1 text-xs text-red-500">
                      {avatarError}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div>
              <label className={labelClass}>
                Nome completo
              </label>
              <input
                className={inputClass}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Nome"
              />
            </div>
            <div>
              <label className={labelClass}>Sobrenome</label>
              <input
                className={inputClass}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Sobrenome"
              />
            </div>
            <div>
              <label className={labelClass}>
                Data de nascimento
              </label>
              <input
                type="date"
                className={inputClass}
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input
                className={inputClass}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(99) 9 9999-9999"
              />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Cargo</label>
              <input
                className={inputClass}
                value={position}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="Ex: RH, Compliance, Vendas"
              />
            </div>

            <div className="md:col-span-2">
              <h3 className={`mt-2 font-medium ${isDark ? "text-gray-100" : "text-gray-800"}`}>Endereço</h3>
            </div>
            <div>
              <label className={labelClass}>Rua</label>
              <input
                className={inputClass}
                value={street}
                onChange={(e) => setStreet(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Número</label>
              <input
                className={inputClass}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Complemento</label>
              <input
                className={inputClass}
                value={complement}
                onChange={(e) => setComplement(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Bairro</label>
              <input
                className={inputClass}
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Cidade</label>
              <input
                className={inputClass}
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <input
                className={inputClass}
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>CEP</label>
              <input
                className={inputClass}
                value={cep}
                onChange={(e) => setCep(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <h3 className={`mt-2 font-medium ${isDark ? "text-gray-100" : "text-gray-800"}`}>Conta</h3>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>E-mail</label>
              <input
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>
                Senha (deixe em branco para manter)
              </label>
              <input
                type="password"
                className={inputClass}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>
                Repetir senha
              </label>
              <input
                type="password"
                className={inputClass}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <div className="md:col-span-2">
              <label className={labelClass}>Observações</label>
              <textarea
                className={`h-24 w-full rounded border px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none ${isDark ? "border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400" : "border-gray-300 bg-white text-gray-900"}`}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className={`rounded px-4 py-2 text-white shadow ${saving ? "cursor-wait bg-blue-400" : "bg-blue-600 hover:bg-blue-700"}`}
            >
              {saving ? (
                <span className="inline-flex items-center gap-2">
                  <svg
                    className="h-4 w-4 animate-spin text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                    ></path>
                  </svg>
                  Salvando...
                </span>
              ) : (
                "Salvar alterações"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
