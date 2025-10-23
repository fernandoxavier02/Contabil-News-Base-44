
import React, { useState, useEffect, useCallback } from "react";
import { EmailConfig } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Mail, AlertCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

import EmailConfigCard from "./EmailConfigCard";
import EmailConfigForm from "./EmailConfigForm";
import EmailTestPanel from "./EmailTestPanel"; // Import the new component

export default function EmailSettings({ onStatsUpdate }) {
  const [configs, setConfigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 900));
      const data = await EmailConfig.list('-created_date');
      setConfigs(data);
      if (onStatsUpdate) {
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
    const timer = setTimeout(() => {
      loadConfigs();
    }, 1600);

    return () => clearTimeout(timer);
  }, [loadConfigs]);

  const handleSubmit = async (configData) => {
    try {
      if (editingConfig) {
        await EmailConfig.update(editingConfig.id, configData);
      } else {
        await EmailConfig.create(configData);
      }
      setShowForm(false);
      setEditingConfig(null);
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
        await EmailConfig.delete(configId);
        setTimeout(() => loadConfigs(), 500);
      } catch (error) {
        console.error("Erro ao excluir configuração:", error);
      }
    }
  };

  const handleToggleActive = async (config) => {
    try {
      await EmailConfig.update(config.id, { ...config, is_active: !config.is_active });
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
          <h2 className="text-2xl font-bold text-gray-900">Configurações Email</h2>
          <p className="text-gray-500">Configure listas de distribuição de email</p>
        </div>
        <Button 
          onClick={() => {
            setEditingConfig(null);
            setShowForm(!showForm);
          }}
          className="bg-orange-600 hover:bg-orange-700 text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Nova Lista
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
          <EmailConfigForm
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
        <>
          <EmailTestPanel configs={activeConfigs} />
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ativos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {activeConfigs.map((config) => (
                  <EmailConfigCard
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
        </>
      )}

      {inactiveConfigs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inativos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {inactiveConfigs.map((config) => (
                <EmailConfigCard
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
          <p className="mt-4 text-gray-500">Carregando configurações...</p>
        </div>
      ) : !error && configs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">Nenhuma lista de email</h3>
          <p className="text-gray-400 mb-6">Configure sua primeira lista de distribuição</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-orange-600 hover:bg-orange-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Lista
          </Button>
        </div>
      ) : null}
    </div>
  );
}
