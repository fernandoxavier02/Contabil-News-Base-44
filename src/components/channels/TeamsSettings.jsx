
import React, { useState, useEffect, useCallback } from "react";
import { TeamsConfig } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Users, AlertCircle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { Alert, AlertDescription } from "@/components/ui/alert";

import TeamsConfigCard from "./TeamsConfigCard";
import TeamsConfigForm from "./TeamsConfigForm";
import TeamsTestPanel from "./TeamsTestPanel"; // New import for TeamsTestPanel

export default function TeamsSettings({ onStatsUpdate }) {
  const [configs, setConfigs] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadConfigs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 600));
      const data = await TeamsConfig.list('-created_date');
      setConfigs(data);
      if (onStatsUpdate) {
        setTimeout(() => onStatsUpdate(), 500);
      }
    } catch (error) {
      console.error("Erro ao carregar configuracoes:", error);
      if (error.response?.status === 429) {
        setError("Muitas requisicoes. Por favor, aguarde alguns segundos e recarregue a pagina.");
      } else {
        setError("Erro ao carregar configuracoes. Tente novamente.");
      }
    }
    setIsLoading(false);
  }, [onStatsUpdate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadConfigs();
    }, 1200);

    return () => clearTimeout(timer);
  }, [loadConfigs]);

  const handleSubmit = async (configData) => {
    try {
      if (editingConfig) {
        await TeamsConfig.update(editingConfig.id, configData);
      } else {
        await TeamsConfig.create(configData);
      }
      setShowForm(false);
      setEditingConfig(null);
      setTimeout(() => loadConfigs(), 500);
    } catch (error) {
      console.error("Erro ao salvar configuracao:", error);
      alert("Ocorreu um erro ao salvar a configuracao.");
    }
  };

  const handleEdit = (config) => {
    setEditingConfig(config);
    setShowForm(true);
  };

  const handleDelete = async (configId) => {
    if (confirm("Tem certeza que deseja excluir esta configuracao?")) {
      try {
        await TeamsConfig.delete(configId);
        setTimeout(() => loadConfigs(), 500);
      } catch (error) {
        console.error("Erro ao excluir configuracao:", error);
      }
    }
  };

  const handleToggleActive = async (config) => {
    try {
      await TeamsConfig.update(config.id, { ...config, is_active: !config.is_active });
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
          <h2 className="text-2xl font-bold text-gray-900">Configuracoes Microsoft Teams</h2>
          <p className="text-gray-500">Configure canais Teams via webhooks</p>
        </div>
        <Button 
          onClick={() => {
            setEditingConfig(null);
            setShowForm(!showForm);
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          <Plus className="w-5 h-5 mr-2" />
          Novo Teams
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
          <TeamsConfigForm
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
        <TeamsTestPanel configs={activeConfigs} />
      )}

      {activeConfigs.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Ativos</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AnimatePresence>
              {activeConfigs.map((config) => (
                <TeamsConfigCard
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
                <TeamsConfigCard
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
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-500">Carregando configuracoes...</p>
        </div>
      ) : !error && configs.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-500 mb-2">Nenhuma configuracao Teams</h3>
          <p className="text-gray-400 mb-6">Configure seu primeiro canal Microsoft Teams</p>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Criar Configuracao
          </Button>
        </div>
      ) : null}
    </div>
  );
}
