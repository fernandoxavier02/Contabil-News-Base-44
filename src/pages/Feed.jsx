import React, { useState, useEffect, useCallback } from "react";
import { News } from "@/api/entities";
import { Source } from "@/api/entities";
import { Star, Newspaper, Download, Clock, Trash2, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
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
import { clearAllNews } from "@/api/functions";

import NewsCard from "../components/news/NewsCard";
import NewsFilters from "../components/news/NewsFilters";
import NewsModal from "../components/news/NewsModal";
import NewsUpdateButton from "../components/news/NewsUpdateButton";
import WhatsAppFeedGenerator from "../components/news/WhatsAppFeedGenerator";
import appLogo from "@/assets/logo.svg";

export default function FeedPage() {
  const [news, setNews] = useState([]);
  const [sources, setSources] = useState([]);
  const [filteredNews, setFilteredNews] = useState([]);
  const [selectedNews, setSelectedNews] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedImportance, setSelectedImportance] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [refreshInterval, setRefreshInterval] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [filterTrigger, setFilterTrigger] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = useCallback(async () => {
    console.log("[pages/Feed.js]  Carregando noticias...");
    setIsLoading(true);
    
    try {
      const [newsData, sourcesData] = await Promise.all([
        News.list('-created_date', 1500),
        Source.list()
      ]);
      
      console.log(`[pages/Feed.js]  ${newsData.length} noticias carregadas`);
      
      setNews(newsData);
      setSources(sourcesData);
      
      const tags = [...new Set(newsData.flatMap(item => item.tags || []))];
      setAvailableTags(tags);
      setLastUpdateTime(new Date());
      
    } catch (error) {
      console.error("[pages/Feed.js]  Erro ao carregar dados:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleNewsUpdated = useCallback((createdNewsList) => {
    console.log(`[pages/Feed.js]  Recebidas ${createdNewsList.length} noticias novas para adicionar!`);
    
    if (!createdNewsList || createdNewsList.length === 0) {
      console.warn("[pages/Feed.js]  Nenhuma noticia nova recebida");
      return;
    }
    
    setNews(prevNews => {
      const updatedNews = [...createdNewsList, ...prevNews];
      console.log(`[pages/Feed.js]  Estado atualizado: ${prevNews.length}  ${updatedNews.length} noticias`);
      return updatedNews;
    });
    
    setAvailableTags(prevTags => {
      const newTags = createdNewsList.flatMap(item => item.tags || []);
      const allTags = [...new Set([...prevTags, ...newTags])];
      return allTags;
    });
    
    setLastUpdateTime(new Date());
    setFilterTrigger(prev => prev + 1);
    
    console.log("[pages/Feed.js]  Noticias adicionadas com sucesso ao feed!");
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');
    if (categoryParam) {
      setSelectedCategory(categoryParam);
    }
  }, []);

  useEffect(() => {
    if (refreshInterval > 0) {
      const intervalId = setInterval(() => loadData(), refreshInterval);
      return () => clearInterval(intervalId);
    }
  }, [refreshInterval, loadData]);

  useEffect(() => {
    console.log(`[pages/Feed.js]  Recalculando filtros. Total de noticias: ${news.length}, Trigger: ${filterTrigger}`);
    
    let filtered = [...news];
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.content && item.content.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    if (selectedImportance) {
      filtered = filtered.filter(item => item.importance === selectedImportance);
    }
    
    if (selectedTags.length > 0) {
      filtered = filtered.filter(item =>
        item.tags && selectedTags.some(tag => item.tags.includes(tag))
      );
    }
    
    filtered.sort((a, b) => {
      const importanceOrder = { alta: 3, media: 2, baixa: 1 };
      const aImportance = importanceOrder[a.importance] || 2;
      const bImportance = importanceOrder[b.importance] || 2;
      if (aImportance !== bImportance) return bImportance - aImportance;
      return new Date(b.publication_date) - new Date(a.publication_date);
    });
    
    console.log(`[pages/Feed.js]  Noticias filtradas: ${filtered.length}`);
    setFilteredNews(filtered);
  }, [news, searchTerm, selectedCategory, selectedImportance, selectedTags, filterTrigger]);

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const jsonString = JSON.stringify(news, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `noticias-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erro ao exportar JSON:", error);
      alert("Ocorreu um erro ao exportar os dados.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllNews = async () => {
    setIsDeleting(true);
    try {
      console.log("[Feed] Iniciando limpeza completa do feed...");
      const response = await clearAllNews();
      const result = response?.data;

      if (result?.success) {
        console.log(`[Feed] ${result.deleted_count} noticia(s) removidas do armazenamento local.`);
        alert(result.message);

        await loadData();
        setShowDeleteConfirm(false);
      } else {
        throw new Error(result?.error ?? "Nao foi possivel remover as noticias.");
      }
    } catch (error) {
      console.error("[Feed] Erro ao deletar noticias:", error);
      alert(`Erro ao deletar noticias: ${error.message}`);
    } finally {
      setIsDeleting(false);
    }
  };
  const getSourceForNews = (newsItem) => {
    return sources.find(source => source.id === newsItem.source_id);
  };

  const highlightedNews = filteredNews.filter(item => item.is_highlighted);
  const regularNews = filteredNews.filter(item => !item.is_highlighted);

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

      <div className="min-h-screen bg-white/85 backdrop-blur-sm">
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-8 bg-white rounded-2xl shadow-2xl p-8 border-4 border-[#0066B3]">
              <div className="flex items-center justify-center mb-6">
                <img 
                  src={appLogo} 
                  alt="Contabil News"
                  className="h-20 object-contain"
                  onError={(e) => e.target.style.display = 'none'}
                />
              </div>
              <h1 className="text-4xl font-bold text-[#002855] mb-3">Avisos Contabeis</h1>
              <p className="text-lg text-[#58595B] max-w-2xl mx-auto leading-relaxed">
                Mantenha-se atualizado com as ultimas noticias contabeis, fiscais e tributarias do Brasil
              </p>
              {lastUpdateTime && (
                <div className="mt-4 text-sm">
                  <span className="text-gray-500">Ultima atualizacao: </span>
                  <span className="font-semibold text-[#0066B3]">
                    {format(lastUpdateTime, 'dd/MM/yyyy HH:mm:ss')}
                  </span>
                  <span className="ml-3 text-gray-500">|</span>
                  <span className="ml-3 font-semibold text-[#002855]">
                    {news.length} total | {filteredNews.length} exibidas
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-8 flex flex-col lg:flex-row items-center justify-center gap-4 lg:gap-6 flex-wrap">
              <NewsUpdateButton onNewsUpdated={handleNewsUpdated} />

              <div className="flex items-center gap-3">
                 <Label htmlFor="refresh-interval" className="flex items-center gap-2 text-[#002855] font-semibold">
                    <Clock className="w-4 h-4" />
                    Atualizar a cada:
                  </Label>
                  <Select onValueChange={(value) => setRefreshInterval(Number(value))} value={String(refreshInterval)}>
                    <SelectTrigger id="refresh-interval" className="w-[180px] border-[#0066B3] bg-white">
                      <SelectValue placeholder="Nunca" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Nunca (Manual)</SelectItem>
                      <SelectItem value="300000">5 minutos</SelectItem>
                      <SelectItem value="900000">15 minutos</SelectItem>
                      <SelectItem value="1800000">30 minutos</SelectItem>
                    </SelectContent>
                  </Select>
              </div>
              
              <WhatsAppFeedGenerator allNews={news} />
              
              <Button variant="outline" onClick={handleExportJSON} disabled={isExporting} className="border-[#0066B3] text-[#0066B3] hover:bg-[#0066B3] hover:text-white bg-white">
                <Download className={`w-4 h-4 mr-2 ${isExporting ? 'animate-pulse' : ''}`} />
                {isExporting ? 'Exportando...' : 'Exportar JSON'}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => setShowDeleteConfirm(true)} 
                disabled={news.length === 0 || isDeleting}
                className="border-red-500 text-red-600 hover:bg-red-600 hover:text-white bg-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Feed
              </Button>
            </div>

            <NewsFilters
              searchTerm={searchTerm}
              setSearchTerm={setSearchTerm}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              selectedImportance={selectedImportance}
              setSelectedImportance={setSelectedImportance}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              availableTags={availableTags}
            />

            {highlightedNews.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6 bg-white rounded-lg px-4 py-3 shadow-md border border-gray-200">
                  <Star className="w-5 h-5 text-[#E94D3D]" />
                  <h2 className="text-2xl font-bold text-[#002855]">Noticias em Destaque</h2>
                </div>
                <div className="grid gap-6">
                  {highlightedNews.map((newsItem) => (
                    <NewsCard
                      key={newsItem.id}
                      news={newsItem}
                      source={getSourceForNews(newsItem)}
                      onReadMore={setSelectedNews}
                      isHighlighted={true}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-6 bg-white rounded-lg px-4 py-3 shadow-md border border-gray-200">
                <Newspaper className="w-5 h-5 text-[#0066B3]" />
                <h2 className="text-2xl font-bold text-[#002855]">
                  {selectedCategory ? `Noticias - ${selectedCategory.replace(/_/g, ' ')}` : 'Todas as Noticias'}
                </h2>
                <span className="text-sm text-white bg-[#0066B3] px-3 py-1 rounded-full font-semibold">
                  {filteredNews.length} {filteredNews.length === 1 ? 'noticia' : 'noticias'}
                </span>
              </div>
            </div>

            {isLoading ? (
              <div className="grid gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white rounded-xl p-6 animate-pulse shadow-lg border border-gray-200">
                    <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : filteredNews.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-200"
              >
                <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-[#58595B] mb-2">Nenhuma noticia encontrada</h3>
                <p className="text-gray-400 mb-4">
                  {news.length === 0 
                    ? "Clique em 'Atualizar Noticias' para buscar novas noticias" 
                    : "Tente ajustar seus filtros para ver mais resultados"}
                </p>
                <Button 
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("");
                    setSelectedImportance("");
                    setSelectedTags([]);
                  }}
                  className="bg-[#0066B3] hover:bg-[#002855]"
                >
                  Limpar Filtros
                </Button>
              </motion.div>
            ) : (
              <div className="grid gap-6">
                {regularNews.map((newsItem) => (
                  <NewsCard
                    key={newsItem.id}
                    news={newsItem}
                    source={getSourceForNews(newsItem)}
                    onReadMore={setSelectedNews}
                    isHighlighted={false}
                  />
                ))}
              </div>
            )}

            <NewsModal
              news={selectedNews}
              open={!!selectedNews}
              onOpenChange={() => setSelectedNews(null)}
            />
          </div>
        </div>
      </div>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600"> Confirmar exclusao de TODAS as noticias</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao ira deletar permanentemente <strong>{news.length} noticias</strong> do feed.
              <br /><br />
              <strong className="text-red-600">Esta acao nao pode ser desfeita!</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllNews}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deletando...
                </>
              ) : (
                'Sim, deletar tudo'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}


