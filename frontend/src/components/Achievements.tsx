import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import ProfileMenu from "./ProfileMenu";
import NotificationPanel from "./NotificationPanel";
import FAURGLogo from "../assets/FAURG-logo-horizontal-reduzida.png";
import { authService } from "../services/authService";
import { apiUtils } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import certificateService from "../services/certificates.service";
import type { Certificate } from "../types/certificate";
import CertificatePreview from "./CertificatePreview";

export default function Achievements() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isDark, toggleTheme } = useTheme();
  const { pathname } = location;
  const [items, setItems] = useState<
    Array<{
      title: string;
      issuedAt: string;
      image?: string;
      linkPdf?: string;
      trailId?: number;
    }>
  >([]);
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [localCertsByTrail, setLocalCertsByTrail] = useState<
    Record<number, Certificate>
  >({});
  const [previewCertificate, setPreviewCertificate] =
    useState<Certificate | null>(null);

  type NavLink = {
    key: string;
    label: string;
    path: string;
    ariaLabel: string;
    match: (value: string) => boolean;
  };

  const navLinks: NavLink[] = useMemo(
    () => [
      {
        key: "home",
        label: "Página Inicial",
        path: "/aprendiz",
        ariaLabel: "Ir para página inicial",
        match: (value: string) => value.startsWith("/aprendiz"),
      },
      {
        key: "trails",
        label: "Trilhas",
        path: "/trails",
        ariaLabel: "Ir para trilhas",
        match: (value: string) =>
          value.startsWith("/trails") || value.startsWith("/trail"),
      },
      {
        key: "certificados",
        label: "Certificados",
        path: "/certificados",
        ariaLabel: "Ver certificados",
        match: (value: string) => value.startsWith("/certificados"),
      },
    ],
    [],
  );

  const navContainerRef = useRef<HTMLDivElement | null>(null);
  const navRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicatorStyle, setIndicatorStyle] = useState({
    width: 0,
    left: 0,
    opacity: 0,
  });

  useEffect(() => {
    const updateIndicator = () => {
      const activeLink = navLinks.find((link) => link.match(pathname));
      const container = navContainerRef.current;
      const buttonRef = activeLink ? navRefs.current[activeLink.key] : null;

      if (container && buttonRef) {
        const containerRect = container.getBoundingClientRect();
        const buttonRect = buttonRef.getBoundingClientRect();

        setIndicatorStyle({
          width: buttonRect.width,
          left: buttonRect.left - containerRect.left,
          opacity: 1,
        });
      } else {
        setIndicatorStyle((prev) => ({ ...prev, opacity: 0 }));
      }
    };

    updateIndicator();
    window.addEventListener("resize", updateIndicator);
    return () => window.removeEventListener("resize", updateIndicator);
  }, [pathname, navLinks]);

  useEffect(() => {
    // Carregar certificados da API
    const loadCertificates = async () => {
      try {
        const data = await apiUtils.get<{ certificados: any[] }>(
          "/certificados/",
        );
        console.log("📜 Certificados carregados:", data);

        const stored = authService.getStoredUser() as any;
        const userId = stored?.id ?? stored?.user_id ?? null;
        if (userId) {
          const local = await certificateService.getUserCertificates(userId);
          const map = local.reduce(
            (acc, cert) => {
              acc[cert.trailId] = cert;
              return acc;
            },
            {} as Record<number, Certificate>,
          );
          setLocalCertsByTrail(map);
        } else {
          setLocalCertsByTrail({});
        }

        // Mapear dados da API para o formato do componente
        const certificadosFormatados = data.certificados.map((cert: any) => {
          // Gerar imagem ilustrativa baseada no título da trilha
          const getIllustrativeImage = (titulo: string): string => {
            const tituloLower = titulo.toLowerCase();

            // Mapear palavras-chave para temas de imagens
            if (
              tituloLower.includes("cloud") ||
              tituloLower.includes("aws") ||
              tituloLower.includes("nuvem")
            ) {
              return "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=400&h=300&fit=crop";
            }
            if (
              tituloLower.includes("python") ||
              tituloLower.includes("programação") ||
              tituloLower.includes("codigo")
            ) {
              return "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=400&h=300&fit=crop";
            }
            if (
              tituloLower.includes("dados") ||
              tituloLower.includes("data") ||
              tituloLower.includes("analise")
            ) {
              return "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=300&fit=crop";
            }
            if (
              tituloLower.includes("web") ||
              tituloLower.includes("frontend") ||
              tituloLower.includes("desenvolvimento")
            ) {
              return "https://images.unsplash.com/photo-1593720213428-28a5b9e94613?w=400&h=300&fit=crop";
            }
            if (
              tituloLower.includes("segurança") ||
              tituloLower.includes("security") ||
              tituloLower.includes("cyber")
            ) {
              return "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=400&h=300&fit=crop";
            }
            if (
              tituloLower.includes("ia") ||
              tituloLower.includes("inteligencia") ||
              tituloLower.includes("artificial") ||
              tituloLower.includes("machine")
            ) {
              return "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=300&fit=crop";
            }
            if (tituloLower.includes("mobile") || tituloLower.includes("app")) {
              return "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop";
            }
            if (
              tituloLower.includes("design") ||
              tituloLower.includes("ux") ||
              tituloLower.includes("ui")
            ) {
              return "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=300&fit=crop";
            }
            if (
              tituloLower.includes("devops") ||
              tituloLower.includes("docker") ||
              tituloLower.includes("kubernetes")
            ) {
              return "https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=400&h=300&fit=crop";
            }
            if (
              tituloLower.includes("blockchain") ||
              tituloLower.includes("cripto")
            ) {
              return "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=300&fit=crop";
            }
            if (
              tituloLower.includes("aprendiz") ||
              tituloLower.includes("iniciante") ||
              tituloLower.includes("onboard")
            ) {
              return "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=300&fit=crop";
            }

            // Imagem padrão para certificados genéricos
            return "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400&h=300&fit=crop";
          };

          return {
            title: `Certificado - ${cert.trilha.titulo}`,
            issuedAt: cert.data_emissao,
            image:
              cert.trilha.imagem || getIllustrativeImage(cert.trilha.titulo),
            codigo: cert.codigo_verificacao,
            linkPdf: cert.link_pdf,
            trailId: cert.trilha.id,
          };
        });

        setItems(certificadosFormatados);
      } catch (error) {
        console.error("❌ Erro ao carregar certificados:", error);
        // Fallback para lista vazia em caso de erro
        setItems([]);
      }
    };

    loadCertificates();
  }, []);

  useEffect(() => {
    // trigger simple mount animation
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  const storedUser = authService.getStoredUser();
  const displayName = storedUser?.username || "Usuário";

  const resolvePdfUrl = (linkPdf: string) => {
    const apiBase =
      import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";
    const mediaBase = apiBase.replace(/\/api\/?$/, "");
    if (/^https?:\/\//i.test(linkPdf)) return linkPdf;
    if (linkPdf.startsWith("/")) return `${mediaBase}${linkPdf}`;
    return `${mediaBase}/${linkPdf}`;
  };

  const handleOpenPreview = async (item: {
    title: string;
    linkPdf?: string;
    trailId?: number;
  }) => {
    if (!item.linkPdf) {
      const localCert = item.trailId ? localCertsByTrail[item.trailId] : null;
      if (localCert) {
        setPreviewCertificate(localCert);
        return;
      }

      const stored = authService.getStoredUser() as any;
      const userId =
        stored?.id ??
        stored?.user_id ??
        stored?.user?.id ??
        stored?.id_usuario ??
        null;
      if (!userId || !item.trailId) {
        alert("Certificado indisponível para download.");
        return;
      }

      try {
        const payload = { id_trilha: item.trailId, id_usuario: userId };
        const data = await apiUtils.post<{
          codigo_verificacao: string;
          data_emissao: string;
          nome_aluno: string;
          nome_trilha: string;
          carga_horaria: number;
          link_pdf?: string | null;
        }>("/certificado/gerar/", payload);

        const previewCert: Certificate = {
          id: `api_${item.trailId}_${Date.now()}`,
          userId,
          trailId: item.trailId,
          trailName: data.nome_trilha,
          studentName: data.nome_aluno,
          startDate: data.data_emissao,
          endDate: data.data_emissao,
          workload: data.carga_horaria,
          issuedAt: data.data_emissao,
          status: "issued",
          verificationCode: data.codigo_verificacao,
        };

        setPreviewCertificate(previewCert);
        return;
      } catch (error) {
        console.error("❌ Erro ao gerar certificado:", error);
        alert("Certificado indisponível para download.");
        return;
      }
    }

    const localCert = item.trailId ? localCertsByTrail[item.trailId] : null;
    if (localCert) {
      setPreviewCertificate(localCert);
      return;
    }

    const stored = authService.getStoredUser() as any;
    const userId =
      stored?.id ??
      stored?.user_id ??
      stored?.user?.id ??
      stored?.id_usuario ??
      null;
    if (!userId || !item.trailId) {
      alert("Certificado indisponível para download.");
      return;
    }

    try {
      const payload = { id_trilha: item.trailId, id_usuario: userId };
      const data = await apiUtils.post<{
        codigo_verificacao: string;
        data_emissao: string;
        nome_aluno: string;
        nome_trilha: string;
        carga_horaria: number;
        link_pdf?: string | null;
      }>("/certificado/gerar/", payload);

      const previewCert: Certificate = {
        id: `api_${item.trailId}_${Date.now()}`,
        userId,
        trailId: item.trailId,
        trailName: data.nome_trilha,
        studentName: data.nome_aluno,
        startDate: data.data_emissao,
        endDate: data.data_emissao,
        workload: data.carga_horaria,
        issuedAt: data.data_emissao,
        status: "issued",
        verificationCode: data.codigo_verificacao,
      };

      setPreviewCertificate(previewCert);
    } catch (error) {
      console.error("❌ Erro ao gerar certificado:", error);
      alert("Certificado indisponível para download.");
    }
  };

  return (
    <div
      className={`min-h-screen font-sans transition-colors duration-300 ${isDark ? "bg-gray-900" : "bg-gray-50"}`}
    >
      <header
        className="relative z-40 font-semibold shadow-md"
        style={{ backgroundColor: "#233E97", height: "64px" }}
      >
        <div className="w-full px-8">
          <div className="flex h-full items-end justify-between pb-2">
            <div className="mt-2 ml-6 flex items-center" />

            <nav
              ref={navContainerRef}
              className="relative hidden flex-1 justify-center space-x-8 md:ml-6 md:flex"
            >
              {navLinks.map((link) => {
                const isActive = link.match(pathname);

                return (
                  <div key={link.key} className="relative">
                    <button
                      ref={(el) => (navRefs.current[link.key] = el)}
                      onClick={() => navigate(link.path)}
                      className={`flex cursor-pointer items-center rounded-md px-4 py-4 text-sm font-semibold transition-all duration-300 ease-out hover:scale-105 hover:brightness-125 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-900 focus:outline-none md:text-base ${isActive ? "opacity-100" : "opacity-85"}`}
                      style={{
                        color: isActive
                          ? "rgb(255, 255, 255)"
                          : "rgba(255, 255, 255, 0.84)",
                        backgroundColor: isActive
                          ? "rgba(255, 255, 255, 0.12)"
                          : "transparent",
                        transition:
                          "color 200ms ease, background-color 200ms ease, opacity 200ms ease",
                      }}
                      aria-label={link.ariaLabel}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {link.label}
                    </button>
                  </div>
                );
              })}

              <div
                className="pointer-events-none absolute h-1.5 rounded-full bg-white"
                style={{
                  bottom: -9,
                  left: 0,
                  width:
                    indicatorStyle.width > 0
                      ? `${indicatorStyle.width}px`
                      : "0px",
                  transform: `translateX(${indicatorStyle.left}px)`,
                  opacity: indicatorStyle.opacity,
                  boxShadow:
                    indicatorStyle.opacity > 0
                      ? "0 0 8px 1px rgba(255, 255, 255, 0.8)"
                      : "none",
                  transition:
                    "transform 280ms ease, width 220ms ease, opacity 180ms ease, box-shadow 180ms ease",
                  willChange: "transform, width",
                }}
              ></div>
            </nav>

            <div className="mt-2 flex items-center space-x-4">
              {/* Dark mode toggle */}
              <button
                onClick={toggleTheme}
                className={`rounded-full p-2.5 shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl ${isDark ? "bg-gray-800" : "bg-white"}`}
                aria-label={isDark ? "Modo claro" : "Modo escuro"}
              >
                {isDark ? (
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: "#e5e7eb" }}
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                    style={{ color: "#233E97" }}
                  >
                    <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                  </svg>
                )}
              </button>

              <NotificationPanel />

              <ProfileMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Hero like the Trails page */}
      <div
        className="relative w-full overflow-hidden shadow-md"
        style={{ backgroundColor: "#233E97", height: "280px" }}
      >
        <div className="absolute inset-0 flex items-center">
          {/* Semicírculo branco à esquerda */}
          <div
            className="absolute top-0 left-0 flex h-full items-center rounded-r-full bg-white"
            style={{
              width: "30%",
              boxShadow:
                "8px 12px 25px 0px rgba(0,0,0,0.15), inset 0px 4px 25px 0px rgba(0,0,0,0.15)",
              justifyContent: "flex-start",
              paddingLeft: "24px",
            }}
          >
            <img
              src={FAURGLogo}
              alt="FAURG Logo"
              className="object-contain"
              style={{ height: "70%", maxWidth: "70%" }}
            />
          </div>

          {/* Texto CERTIFICADOS à direita */}
          <div
            className="absolute top-0 right-0 flex h-full items-center justify-end pr-12"
            style={{ width: "60%" }}
          >
            <div className="text-right">
              <h1 className="text-3xl leading-tight font-bold text-white md:text-4xl lg:text-5xl">
                CERTIFICADOS
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 pt-16 pb-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10">
            <h2
              className={`mb-4 text-4xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
            >
              Seus certificados
            </h2>
            <p
              className={`text-lg ${isDark ? "text-gray-400" : "text-gray-600"}`}
            >
              Lista dos certificados obtidos. Você pode visualizar ou baixar
              cada um.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it, idx) => (
              <div
                key={idx}
                className={`flex transform flex-col overflow-hidden rounded-xl shadow-lg transition-all duration-400 ease-out ${isDark ? "bg-gray-800" : "bg-white"} ${mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} hover:-translate-y-2 hover:shadow-2xl`}
              >
                <div className="relative h-48 w-full overflow-hidden bg-gray-200">
                  <img
                    src={it.image}
                    alt={it.title}
                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-110"
                    onError={(e: any) => {
                      e.target.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="grad" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23e0e7ff;stop-opacity:1" /%3E%3Cstop offset="100%25" style="stop-color:%23f0f4ff;stop-opacity:1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="url(%23grad)" width="400" height="300"/%3E%3Ccircle cx="200" cy="80" r="35" fill="%234f46e5" opacity="0.8"/%3E%3Crect x="120" y="140" width="160" height="100" rx="8" fill="%23818cf8" opacity="0.6"/%3E%3Ctext x="200" y="160" font-family="Arial" font-size="18" font-weight="bold" fill="%23ffffff" text-anchor="middle"%3ECERTIFICADO%3C/text%3E%3Ctext x="200" y="185" font-family="Arial" font-size="12" fill="%23ffffff" text-anchor="middle"%3EConclusão de Trilha%3C/text%3E%3Cpath d="M 150 220 Q 200 250 250 220" stroke="%234f46e5" stroke-width="2" fill="none" opacity="0.6"/%3E%3C/svg%3E';
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div
                    className={`line-clamp-2 text-lg font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                  >
                    {it.title}
                  </div>
                  <div
                    className={`mt-2 text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-500"}`}
                  >
                    Emitido em:{" "}
                    {new Date(it.issuedAt).toLocaleDateString("pt-BR")}
                  </div>
                  <div className="mt-auto flex flex-col gap-3 pt-5">
                    <button
                      onClick={() => handleOpenPreview(it)}
                      className="w-full rounded-lg px-4 py-2.5 font-semibold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: "#233E97" }}
                    >
                      Baixar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Modal preview */}
          {selected !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setSelected(null)}
              />
              <div
                className={`relative w-full max-w-4xl overflow-hidden rounded-xl shadow-2xl ${isDark ? "bg-gray-800" : "bg-white"}`}
              >
                <div className="aspect-video w-full overflow-hidden bg-gray-200">
                  <img
                    src={items[selected].image}
                    alt={items[selected].title}
                    className="h-full w-full object-cover"
                    onError={(e: any) => {
                      e.target.src =
                        'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"%3E%3Crect fill="%23e5e7eb" width="800" height="600"/%3E%3Ctext x="50%25" y="50%25" font-family="Arial" font-size="40" fill="%239ca3af" text-anchor="middle" dominant-baseline="middle"%3ECertificado%3C/text%3E%3C/svg%3E';
                    }}
                  />
                </div>
                <div className="p-8">
                  <h3
                    className={`mb-3 text-3xl font-bold ${isDark ? "text-gray-100" : "text-gray-900"}`}
                  >
                    {items[selected].title}
                  </h3>
                  <p
                    className={`mb-6 text-sm font-medium ${isDark ? "text-gray-400" : "text-gray-600"}`}
                  >
                    Emitido em:{" "}
                    {new Date(items[selected].issuedAt).toLocaleDateString(
                      "pt-BR",
                    )}
                  </p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setSelected(null)}
                      className={`rounded-lg border-2 px-6 py-3 font-semibold transition-all ${isDark ? "border-gray-600 text-gray-100 hover:bg-gray-700" : "border-gray-300 text-gray-800 hover:bg-gray-50"}`}
                    >
                      Fechar
                    </button>
                    <button
                      onClick={() => handleOpenPreview(items[selected])}
                      className="rounded-lg px-6 py-3 font-semibold text-white transition-all hover:opacity-90"
                      style={{ backgroundColor: "#233E97" }}
                    >
                      Baixar Certificado
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {previewCertificate && (
            <CertificatePreview
              certificate={previewCertificate}
              onClose={() => setPreviewCertificate(null)}
              showPrintButton={true}
            />
          )}
        </div>
      </div>
    </div>
  );
}
