
import React, { useState, useEffect, useCallback } from "react";
import { Source } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Plus, Globe, Settings, RefreshCw, AlertTriangle } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { safeCreateNews, generateNewsViaLLM } from "@/components/utils/integrationHelpers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { resetSources } from "@/api/functions"; // Reset local data to defaults
import { useToast } from "@/components/ui/use-toast";

import SourceCard from "../components/sources/SourceCard";
import SourceForm from "../components/sources/SourceForm";
import { fetchRealNews } from "@/api/functions";
import appLogo from "@/assets/logo.svg";

export default function SourcesPage() {
  const [sources, setSources] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [scrapingSourceId, setScrapingSourceId] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const { toast } = useToast();

  const loadSources = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const data = await Source.list('-created_date');
      setSources(data);
    } catch (error) {
      console.error("Erro ao carregar fontes:", error);
      setLoadError("Nao foi possivel carregar as fontes. Tente novamente.");
      toast({
        variant: "destructive",
        title: "Falha ao carregar fontes",
        description: error.message,
      });
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  const handleSubmit = async (sourceData) => {
    try {
      if (editingSource) {
        await Source.update(editingSource.id, sourceData);
      } else {
        await Source.create(sourceData);
      }
      setShowForm(false);
      setEditingSource(null);
      loadSources();
      toast({
        title: editingSource ? "Fonte atualizada" : "Fonte criada",
        description: "As alteracoes foram salvas com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao salvar fonte:", error);
      toast({
        variant: "destructive",
        title: "Erro ao salvar fonte",
        description: error.message,
      });
    }
  };

  const handleEdit = (source) => {
    setEditingSource(source);
    setShowForm(true);
  };
  
  const requestDelete = (sourceId) => {
    setDeleteConfirmation(sourceId);
  };

  const confirmDelete = async () => {
    if (deleteConfirmation) {
      try {
        await Source.delete(deleteConfirmation);
        loadSources();
        toast({
          title: "Fonte removida",
          description: "A fonte foi excluida do catalogo.",
        });
      } catch (error) {
        console.error("Erro ao excluir fonte:", error);
        toast({
          variant: "destructive",
          title: "Erro ao excluir fonte",
          description: error.message,
        });
      } finally {
        setDeleteConfirmation(null);
      }
    }
  };

  const handleToggleActive = async (source) => {
    try {
      await Source.update(source.id, { ...source, is_active: !source.is_active });
      loadSources();
      toast({
        title: "Status atualizado",
        description: `A fonte ${source.is_active ? "foi desativada" : "esta ativa"}.`,
      });
    } catch (error) {
      console.error("Erro ao atualizar status da fonte:", error);
      toast({
        variant: "destructive",
        title: "Falha ao atualizar status",
        description: error.message,
      });
    }
  };

  const handleScrapeSource = async (source) => {
    setScrapingSourceId(source.id);

    try {
      if (source.update_method === 'rss' && source.rss_feed_url) {
        const { data: rssResult } = await fetchRealNews({
          rss_feed_url: source.rss_feed_url,
          source_id: source.id,
          source_name: source.name,
          category: "geral",
        });

        if (rssResult && rssResult.success) {
          toast({
            title: "Busca concluida",
            description: `${rssResult.created_count || rssResult.created_news?.length || 0} noticia(s) criadas a partir do RSS de ${source.name}.`,
          });
        } else {
          throw new Error(rssResult?.error || "Falha ao buscar RSS.");
        }
      } else {
        const categories = ["contabil", "fiscal", "folha_pagamento", "tributaria", "reforma_tributaria"];
        const selectedCategory = categories[Math.floor(Math.random() * categories.length)];

        const categoryPrompts = {
          contabil: "noticias sobre normas contabeis, demonstracoes financeiras, balancos, CPC, CFC",
          fiscal: "noticias sobre legislacao fiscal, impostos, declaracoes, DCTF, SPED, Receita Federal",
          folha_pagamento: "noticias sobre eSocial, folha de pagamento, trabalhistas, INSS, FGTS",
          tributaria: "noticias sobre direito tributario, jurisprudencia tributaria, STF, planejamento tributario",
          reforma_tributaria: "noticias sobre reforma tributaria brasileira, IBS, CBS, IS, PEC da reforma",
        };

        const newsData = await generateNewsViaLLM({
          sourceName: source.name,
          sourceDescription: source.description || "",
          topic: categoryPrompts[selectedCategory],
          defaultCategory: selectedCategory,
          sourceId: source.id,
          sourceWebsite: source.website,
        });

        await safeCreateNews(newsData);
        toast({
          title: "Noticia criada",
          description: `Nova noticia adicionada a partir de ${source.name}.`,
        });
      }
    } catch (error) {
      console.error("Erro ao buscar noticias:", error);
      toast({
        variant: "destructive",
        title: "Erro ao criar noticia",
        description: error.message,
      });
    } finally {
      setScrapingSourceId(null);
    }
  };

  const handleResetSources = async () => {
    if (!confirm(' ATENCAO: isso ira apagar todas as fontes atuais e recriar o catalogo padrao. Deseja continuar?')) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await resetSources();

      if (response.data.success) {
        toast({
          title: 'Fontes recriadas',
          description: response.data.message,
        });
        await loadSources();
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      console.error('Erro ao resetar fontes:', error);
      toast({
        variant: 'destructive',
        title: 'Erro ao recriar fontes',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activeSources = sources.filter(source => source.is_active);
  const inactiveSources = sources.filter(source => !source.is_active);

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
        <div className="max-w-6xl mx-auto">
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
                  <h1 className="text-3xl font-bold mb-2">Gerenciar Fontes</h1>
                  <p className="text-white/80">Configure e gerencie as fontes de noticias</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={handleResetSources}
                  disabled={isLoading}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg"
                >
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Resetar com Fontes RSS
                </Button>
                <Button 
                  onClick={() => {
                    setEditingSource(null);
                    setShowForm(!showForm);
                  }}
                  className="bg-white text-[#002855] hover:bg-white/90 font-semibold shadow-lg"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Nova Fonte
                </Button>
              </div>
            </div>
          </div>


          {loadError && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
              {loadError}
            </div>
          )}
          {/* Form */}
          <AnimatePresence>
            {showForm && (
              <SourceForm
                source={editingSource}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingSource(null);
                }}
              />
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{sources.length}</h3>
                  <p className="text-gray-500 text-sm">Total de Fontes</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{activeSources.length}</h3>
                  <p className="text-gray-500 text-sm">Fontes Ativas</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/85 backdrop-blur-xl rounded-xl p-6 shadow-lg border border-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Settings className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-900">{sources.filter(s => s.credibility_level === 'alta').length}</h3>
                  <p className="text-gray-500 text-sm">Alta Credibilidade</p>
                </div>
              </div>
            </div>
          </div>

          {/* Active Sources */}
          {activeSources.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 bg-white/80 backdrop-blur-lg rounded-lg px-4 py-3 shadow-md border border-white inline-block">Fontes Ativas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {activeSources.map((source) => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      onEdit={handleEdit}
                      onDelete={requestDelete}
                      onToggleActive={handleToggleActive}
                      onScrapeSource={handleScrapeSource}
                      isScraping={scrapingSourceId === source.id}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Inactive Sources */}
          {inactiveSources.length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 bg-white/80 backdrop-blur-lg rounded-lg px-4 py-3 shadow-md border border-white inline-block">Fontes Inativas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                  {inactiveSources.map((source) => (
                    <SourceCard
                      key={source.id}
                      source={source}
                      onEdit={handleEdit}
                      onDelete={requestDelete}
                      onToggleActive={handleToggleActive}
                      onScrapeSource={null}
                      isScraping={false}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Empty State */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(0).map((_, i) => (
                <div key={i} className="bg-white/85 backdrop-blur-xl rounded-xl p-6 animate-pulse shadow-lg border border-white">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : sources.length === 0 ? (
            <div className="text-center py-12 bg-white/85 backdrop-blur-xl rounded-xl shadow-lg border border-white">
              <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-500 mb-2">Nenhuma fonte cadastrada</h3>
              <p className="text-gray-400 mb-6">Comece criando sua primeira fonte de noticias</p>
              <Button 
                onClick={() => setShowForm(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Primeira Fonte
              </Button>
            </div>
          ) : null}
        </div>
        <AlertDialog open={!!deleteConfirmation} onOpenChange={() => setDeleteConfirmation(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                Confirmar Exclusao
              </AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir esta fonte? Esta acao nao pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}


