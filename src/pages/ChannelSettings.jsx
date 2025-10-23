
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, MessageCircle, Users, Mail, BarChart3 } from "lucide-react";
import { TelegramConfig } from "@/api/entities";
import { WhatsAppConfig } from "@/api/entities";
import { TeamsConfig } from "@/api/entities";
import { EmailConfig } from "@/api/entities";
import appLogo from "@/assets/logo.svg";

import WhatsAppSettings from "../components/channels/WhatsAppSettings";
import TeamsSettings from "../components/channels/TeamsSettings";
import EmailSettings from "../components/channels/EmailSettings";

// Import Link for navigation
import { Link } from "react-router-dom";

// Helper function para adicionar delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export default function ChannelSettingsPage() {
  const [stats, setStats] = useState({
    telegram: 0,
    whatsapp: 0,
    teams: 0,
    email: 0
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const loadStats = async () => {
    setIsLoadingStats(true);
    try {
      // Carregar uma por vez com delay para evitar rate limit
      const telegram = await TelegramConfig.list().catch(() => []);
      await delay(300);
      
      const whatsapp = await WhatsAppConfig.list().catch(() => []);
      await delay(300);
      
      const teams = await TeamsConfig.list().catch(() => []);
      await delay(300);
      
      const email = await EmailConfig.list().catch(() => []);

      setStats({
        telegram: telegram.filter(c => c.is_active).length,
        whatsapp: whatsapp.filter(c => c.is_active).length,
        teams: teams.filter(c => c.is_active).length,
        email: email.filter(c => c.is_active).length
      });
    } catch (error) {
      console.error("Erro ao carregar estatÃ­sticas:", error);
      // NÃ£o mostrar alert, apenas log
    } finally {
      setIsLoadingStats(false);
    }
  };

  React.useEffect(() => {
    // Delay inicial antes de carregar
    const timer = setTimeout(() => {
      loadStats();
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Background com gradiente */}
      <div className="fixed inset-0 z-0 bg-gradient-to-br from-blue-50 via-white to-purple-50"></div>

      <div className="relative z-10 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 mb-8 border border-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-[#002855] mb-3">ConfiguraÃ§Ã£o de Canais</h1>
                <p className="text-lg text-[#58595B]">
                  Configure seus canais de distribuiÃ§Ã£o automÃ¡tica de notÃ­cias
                </p>
              </div>
              <div className="flex items-center gap-2">
                <img 
                  src={appLogo} 
                  alt="Contábil News"
                  className="h-16 object-contain"
                />
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Send className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? "..." : stats.telegram}
                  </h3>
                  <p className="text-sm text-gray-500">Telegram Ativos</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? "..." : stats.whatsapp}
                  </h3>
                  <p className="text-sm text-gray-500">WhatsApp Ativos</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? "..." : stats.teams}
                  </h3>
                  <p className="text-sm text-gray-500">Teams Ativos</p>
                </div>
              </div>
            </div>

            <div className="bg-white/80 backdrop-blur-lg rounded-xl p-6 shadow-lg border border-orange-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {isLoadingStats ? "..." : stats.email}
                  </h3>
                  <p className="text-sm text-gray-500">Listas de Email</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6 border border-white">
            <Tabs defaultValue="whatsapp" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="whatsapp" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </TabsTrigger>
                <TabsTrigger value="teams" className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Teams
                </TabsTrigger>
                <TabsTrigger value="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email
                </TabsTrigger>
                <TabsTrigger value="telegram" className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  Telegram
                </TabsTrigger>
              </TabsList>

              <TabsContent value="whatsapp" className="mt-0">
                <WhatsAppSettings onStatsUpdate={loadStats} />
              </TabsContent>

              <TabsContent value="teams" className="mt-0">
                <TeamsSettings onStatsUpdate={loadStats} />
              </TabsContent>

              <TabsContent value="email" className="mt-0">
                <EmailSettings onStatsUpdate={loadStats} />
              </TabsContent>

              {/* Telegram */}
              <TabsContent value="telegram" className="mt-0">
                <div className="text-center py-8">
                  <Send className="w-16 h-16 text-blue-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 mb-2">
                    ConfiguraÃ§Ãµes do Telegram
                  </h3>
                  <p className="text-gray-500 mb-4">
                    Para configurar o Telegram, acesse a pÃ¡gina dedicada
                  </p>
                  <Link 
                    to="/TelegramSettings" 
                    className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Ir para Telegram Settings
                  </Link>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
