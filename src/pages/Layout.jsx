import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Newspaper, Globe, Send, Calculator, FileText, CreditCard, Gavel, RefreshCw, TrendingUp, Stethoscope } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import appLogo from "@/assets/logo.svg";

const navigationItems = [
  {
    title: "Feed Principal",
    url: createPageUrl("Feed"),
    icon: Newspaper,
  },
  {
    title: "Gerenciar Fontes",
    url: createPageUrl("Sources"),
    icon: Globe,
  },
  {
    title: "Canais de Distribuicao", // Changed from "Telegram"
    url: createPageUrl("ChannelSettings"), // Changed from "TelegramSettings"
    icon: Send,
  },
  {
    title: "Diagnostico IA",
    url: createPageUrl("CodeDoctor"),
    icon: Stethoscope,
  },
];

const categoryItems = [
  {
    title: "Contabil",
    category: "contabil",
    icon: Calculator,
  },
  {
    title: "Fiscal",
    category: "fiscal",
    icon: FileText,
  },
  {
    title: "Folha de Pagamento",
    category: "folha_pagamento",
    icon: CreditCard,
  },
  {
    title: "Tributaria",
    category: "tributaria",
    icon: Gavel,
  },
  {
    title: "Reforma Tributaria",
    category: "reforma_tributaria",
    icon: RefreshCw,
  },
  {
    title: "IFRS",
    category: "ifrs",
    icon: TrendingUp,
  },
  {
    title: "US GAAP",
    category: "usgaap",
    icon: TrendingUp,
  }
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <SidebarProvider>
      <style>{`
        :root {
          --brand-navy: #002855;
          --brand-blue: #0066B3;
          --brand-coral: #E94D3D;
          --brand-gray: #58595B;
          --brand-light-gray: #F5F5F5;
        }

        body {
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }

        /* Forcar contraste no sidebar */
        [data-sidebar] {
          background: linear-gradient(180deg, #002855 0%, #003875 100%) !important;
        }

        [data-sidebar] * {
          color: white !important;
        }

        [data-sidebar] [data-sidebar-group-label] {
          color: rgba(255, 255, 255, 0.6) !important;
        }
      `}</style>

      <div className="min-h-screen flex w-full bg-white">
        <Sidebar className="border-r-2 border-[#0066B3]/30" style={{
          background: 'linear-gradient(180deg, #002855 0%, #003875 100%)'
        }}>
          <SidebarHeader className="border-b border-white/10 p-6" style={{
            background: 'linear-gradient(180deg, #002855 0%, #003875 100%)'
          }}>
            <div className="flex items-center justify-center bg-white rounded-xl p-4 shadow-lg">
              <img
                src={appLogo}
                alt="Contabil News"
                className="h-16 object-contain"
                onError={(e) => {
                  console.error('Erro ao carregar logo do sidebar:', e);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </SidebarHeader>

          <SidebarContent className="p-4" style={{
            background: 'linear-gradient(180deg, #002855 0%, #003875 100%)'
          }}>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider px-3 py-3 mb-2" style={{
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Navegacao Principal
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`transition-all duration-200 rounded-lg mb-1 ${
                          location.pathname === item.url
                            ? 'bg-white/20 shadow-lg'
                            : 'hover:bg-white/10'
                        }`}
                        style={{
                          color: 'white'
                        }}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3" style={{
                          color: 'white',
                          fontWeight: location.pathname === item.url ? '600' : '500'
                        }}>
                          <item.icon className="w-5 h-5" style={{ color: 'white' }} />
                          <span>{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="my-4 border-t border-white/20"></div>

            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-bold uppercase tracking-wider px-3 py-3 mb-2" style={{
                color: 'rgba(255, 255, 255, 0.7)'
              }}>
                Categorias
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {categoryItems.map((item) => (
                    <SidebarMenuItem key={item.category}>
                      <SidebarMenuButton
                        asChild
                        className="hover:bg-white/10 transition-all duration-200 rounded-lg mb-1"
                        style={{
                          color: 'rgba(255, 255, 255, 0.85)'
                        }}
                      >
                        <Link
                          to={`${createPageUrl("Feed")}?category=${item.category}`}
                          className="flex items-center gap-3 px-4 py-2.5"
                          style={{
                            color: 'rgba(255, 255, 255, 0.85)'
                          }}
                        >
                          <item.icon className="w-4 h-4" style={{ color: 'white' }} />
                          <span className="text-sm font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 flex flex-col bg-[#F5F5F5]">
          <header className="bg-white border-b border-gray-200 px-6 py-4 md:hidden shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="hover:bg-gray-100 p-2 rounded-lg transition-colors duration-200" />
              <img
                src={appLogo}
                alt="Contabil News"
                className="h-8 object-contain"
                onError={(e) => {
                  console.error('Erro ao carregar logo do cabecalho movel:', e);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>

          <footer className="bg-[#002855] text-white py-4 px-6 text-center text-sm">
            <p className="opacity-80"> 2025 Contabil News - Avisos Contabeis | Todos os direitos reservados</p>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}


