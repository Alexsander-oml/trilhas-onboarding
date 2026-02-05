import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/authService";
import { useTheme } from "../contexts/ThemeContext";

export default function ProfileMenu() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const user = authService.getStoredUser();
  const { isDark } = useTheme();

  useEffect(() => {
    function onDocumentClick(e: MouseEvent) {
      if (!ref.current) return;
      if (e.target && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocumentClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocumentClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const initials = (
    user?.firstName
      ? user.firstName.charAt(0)
      : user?.username
        ? user.username.charAt(0)
        : "U"
  ).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Perfil"
        aria-haspopup
        className={`flex h-9 w-9 items-center justify-center rounded-full font-semibold ${isDark ? "bg-gray-800 text-gray-100" : "bg-white text-blue-800"}`}
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.12)" }}
      >
        <span className="text-sm">{initials}</span>
      </button>

      {open && (
        <div className={`absolute right-0 z-50 mt-2 w-48 rounded shadow-lg ${isDark ? "bg-gray-800 border border-gray-700" : "bg-white"}`}>
          <button
            onClick={() => {
              setOpen(false);
              // If the user is an Aprendiz, send them to the aprendiz-specific panel
              if ((user as any)?.role === "Aprendiz") {
                navigate("/painel-aprendiz");
              } else {
                navigate("/painel");
              }
            }}
            className={`w-full px-4 py-2 text-left text-sm ${isDark ? "text-gray-100 hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            Painel Pessoal
          </button>
          <button
            onClick={() => {
              setOpen(false);
              navigate("/meu-aprendizado");
            }}
            className={`w-full px-4 py-2 text-left text-sm ${isDark ? "text-gray-100 hover:bg-gray-700" : "hover:bg-gray-100"}`}
          >
            Meu Aprendizado
          </button>
          <div className={`border-t ${isDark ? "border-gray-700" : "border-gray-200"}`} />
          <button
            onClick={() => {
              setOpen(false);
              authService.logout();
              navigate("/login");
            }}
            className={`w-full px-4 py-2 text-left text-sm ${isDark ? "text-red-300 hover:bg-gray-700" : "text-red-600 hover:bg-gray-100"}`}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
