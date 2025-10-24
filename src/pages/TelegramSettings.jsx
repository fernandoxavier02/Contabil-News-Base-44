
import React, { useState, useEffect, useCallback } from "react";
import { TelegramConfig } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Send, Settings as SettingsIcon } from "lucide-react";
import { AnimatePresence } from "framer-motion";

import TelegramConfigCard from "../components/telegram/TelegramConfigCard";
import TelegramConfigForm from "../components/telegram/TelegramConfigForm";
import TelegramTestPanel from "../components/telegram/TelegramTestPanel";
import appLogo from "@/assets/logo.svg";

export default function TelegramSettingsPage() {
  const [configs, setConfigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await TelegramConfig.list('-created_date');
      setConfigs(data);
    } catch (error) {
      console.error("Erro ao carregar configuracoes:", error);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadConfigs();
  }, [loadConfigs]);

  const handleSubmit = async (configData) => {
    try {
      if (editingConfig) {
        await TelegramConfig.update(editingConfig.id, configData);
      } else {
        await TelegramConfig.create(configData);
      }
      setShowForm(false);
      setEditingConfig(null);
      loadConfigs();
    } catch (error) {
      console.error("Erro ao salvar configuracao:", error);
      alert("Ocorreu um erro ao salvar a configuracao. Verifique o console.");
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleDelete = async (configId) => {
    if (confirm("Tem certeza que deseja excluir esta configuracao?")) {
      try {
        await TelegramConfig.delete(configId);
        loadConfigs();
      } catch (error) {
        console.error("Erro ao excluir configuracao:", error);
      }
    }
  };

  const handleToggleActive = async (config) => {
    try {
      await TelegramConfig.update(config.id, { ...config, is_active: !config.is_active });
      loadConfigs();
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const activeConfigs = configs.filter(c => c.is_active);
  const inactiveConfigs = configs.filter(c => !c.is_active);

  return (
    <div className="min-h-screen" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradient 15s ease infinite'
    }}>
      <style>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>

      <div className="min-h-screen bg-white/85 backdrop-blur-sm p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header com Logo */}
          <div className="bg-gradient-to-r from-[#002855] to-[#0066B3] rounded-2xl shadow-xl p-8 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <img 
                  src={appLogo} 
                  alt="Contabil News"
                  className="h-16 object-contain brightness-0 invert"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <div className="text-white">
                  <h1 className="text-3xl font-bold mb-2">Integracao com Telegram</h1>
                  <p className="text-white/80">Configure canais e automacao com IA</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  setEditingConfig(null);
                  setShowForm(!showForm);
                }}
                className="bg-white text-[#002855] hover:bg-white/90 font-semibold shadow-lg"
              >
                <Plus className="w-5 h-5 mr-2" />
                Novo Canal
              </Button>
            </div>
          </div>

          {/* Instrucoes */}
          <div className="bg-blue-100/80 backdrop-blur-lg border border-blue-300 rounded-xl p-6 mb-8">
            <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              Como configurar com topicos:
            </h3>
            <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
              <li>Crie um bot no Telegram atraves do @BotFather</li>
              <li>Copie o token do bot fornecido</li>
              <li>Crie topicos no seu grupo (Menu  Topicos  Criar Topico)</li>
              <li>Adicione o bot como administrador do grupo</li>
              <li>Para obter o ID do topico: envie uma mensagem no topico e encaminhe para @userinfobot</li>
              <li>Configure aqui: use o mesmo channel_id para o grupo, mas diferentes message_thread_id para cada topico</li>
              <li>Cada categoria pode ir para um topico diferente automaticamente!</li>
            </ol>
          </div>

          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <TelegramConfigForm
                config={editingConfig}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingConfig(null);
                }}
              />
            )}
          </AnimatePresence>

          {/* Painel de Teste */}
          {activeConfigs.length > 0 && (
            <TelegramTestPanel configs={activeConfigs} />
          )}

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{configs.length}</h3>
                  <p className="text-gray-500 text-sm">Total de Canais</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <SettingsIcon className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{activeConfigs.length}</h3>
                  <p className="text-gray-500 text-sm">Canais Ativos</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Send className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">
                    {configs.filter(c => c.send_automatically).length}
                  </h3>
                  <p className="text-gray-500 text-sm">Envio Automatico</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Configs */}
          {activeConfigs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Canais Ativos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {activeConfigs.map((config) => (
                    <TelegramConfigCard
                      key={config.id}
                      config={config}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Inactive Configs */}
          {inactiveConfigs.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Canais Inativos</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence>
                  {inactiveConfigs.map((config) => (
                    <TelegramConfigCard
                      key={config.id}
                      config={config}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onToggleActive={handleToggleActive}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Empty State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-12">
              <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">Nenhum canal configurado</h3>
              <p className="text-gray-400 mb-6">Comece criando sua primeira configuracao de canal</p>
              <Button
                onClick={() => {
                  setEditingConfig(null);
                  setShowForm(true);
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeiro Canal
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
