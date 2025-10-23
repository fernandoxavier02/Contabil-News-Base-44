
import React, { useState, useEffect, useCallback } from "react";
import { WhatsAppConfig } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, MessageCircle, AlertCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

import WhatsAppConfigCard from "./WhatsAppConfigCard";
import WhatsAppConfigForm from "./WhatsAppConfigForm";
import WhatsAppTestPanel from "./WhatsAppTestPanel";

export default function WhatsAppSettings({ onStatsUpdate }) {
  const [configs, setConfigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Aguardar um pouco antes de fazer a requisição
      await new Promise(resolve => setTimeout(resolve, 300));
      const data = await WhatsAppConfig.list('-created_date');
      setConfigs(data);
      if (onStatsUpdate) {
        // Aguardar antes de atualizar stats
        setTimeout(() => onStatsUpdate(), 500);
      }
    } catch (error) {
      console.error("Erro ao carregar configurações:", error);
      if (error.response?.status === 429) {
        setError("Muitas requisições. Por favor, aguarde alguns segundos e recarregue a página.");
      } else {
        setError("Erro ao carregar configurações. Tente novamente.");
      }
    }
    setIsLoading(false);
  }, [onStatsUpdate]);

  useEffect(() => {
    // Delay inicial antes de carregar
    const timer = setTimeout(() => {
      loadConfigs();
    }, 800);

    return () => clearTimeout(timer);
  }, [loadConfigs]);

  const handleSubmit = async (configData) => {
    try {
      if (editingConfig) {
        await WhatsAppConfig.update(editingConfig.id, configData);
      } else {
        await WhatsAppConfig.create(configData);
      }
      setShowForm(false);
      setEditingConfig(null);
      // Aguardar antes de recarregar
      setTimeout(() => loadConfigs(), 500);
    } catch (error) {
      console.error("Erro ao salvar configuração:", error);
      alert("Ocorreu um erro ao salvar a configuração.");
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleDelete = async (configId) => {
    if (confirm("Tem certeza que deseja excluir esta configuração?")) {
      try {
        await WhatsAppConfig.delete(configId);
        setTimeout(() => loadConfigs(), 500);
      } catch (error) {
        console.error("Erro ao excluir configuração:", error);
      }
    }
  };

  const handleToggleActive = async (config) => {
    try {
      await WhatsAppConfig.update(config.id, { ...config, is_active: !config.is_active });
      setTimeout(() => loadConfigs(), 500);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const activeConfigs = configs.filter(c => c.is_active);
  const inactiveConfigs = configs.filter(c => !c.is_active);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configurações WhatsApp</h2>
          <p className="text-gray-500">Configure números WhatsApp Business via Twilio</p>
        </div>
        <Button 
          onClick={() => {
            setEditingConfig(null);
            setShowForm(!showForm);
          }}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo WhatsApp
        </Button>
      </div>

      {error && (
        <Alert className="mb-6 bg-red-50 border-red-200">
          <AlertCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-900">{error}</AlertDescription>
        </Alert>
      )}

      <AnimatePresence>
        {showForm && (
          <WhatsAppConfigForm
            config={editingConfig}
            onSubmit={handleSubmit}
            onCancel={() => {
              setShowForm(false);
              setEditingConfig(null);
            }}
          />
        )}
      </AnimatePresence>
      
      {activeConfigs.length > 0 && (
        <WhatsAppTestPanel configs={activeConfigs} className="mb-8" />
      )}

      {activeConfigs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ativos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {activeConfigs.map((config) => (
                <WhatsAppConfigCard
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

      {inactiveConfigs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inativos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {inactiveConfigs.map((config) => (
                <WhatsAppConfigCard
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

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
          <p className="mt-4 text-gray-500">Carregando configurações...</p>
        </div>
      ) : !error && configs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">Nenhuma configuração WhatsApp</h3>
          <p className="text-gray-400 mb-6">Configure seu primeiro número WhatsApp Business</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Configuração
          </Button>
        </div>
      ) : null}
    </div>
  );
}
