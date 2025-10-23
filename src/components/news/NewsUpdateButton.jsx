import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, CheckCircle } from "lucide-react";
import { Source } from "@/api/entities";
import { News } from "@/api/entities";
import { safeCreateNews, generateNewsViaLLM } from "@/components/utils/integrationHelpers";
import { fetchRealNews } from "@/api/functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

export default function NewsUpdateButton({ onNewsUpdated }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [currentSource, setCurrentSource] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [updateResults, setUpdateResults] = useState(null);

  const categoryPrompts = {
    contabil: "notícias sobre normas contábeis, demonstrações financeiras, balanços, CPC, CFC",
    fiscal: "notícias sobre legislação fiscal, impostos, declarações, DCTF, SPED, Receita Federal",
    folha_pagamento: "notícias sobre eSocial, folha de pagamento, trabalhistas, INSS, FGTS",
    tributaria: "notícias sobre direito tributário, jurisprudência tributária, STF, planejamento tributário",
    reforma_tributaria: "notícias sobre reforma tributária brasileira, IBS, CBS, IS, PEC da reforma",
    ifrs: "notícias sobre International Financial Reporting Standards, IASB, pronunciamentos IFRS, convergência internacional, IFRS no Brasil",
    usgaap: "notícias sobre US Generally Accepted Accounting Principles, FASB, SEC, pronunciamentos contábeis americanos"
  };
  
  const allLlmCategories = Object.keys(categoryPrompts);

  const generateNewsForSource = async (source, category, topic) => {
    return await generateNewsViaLLM({
      sourceName: source.name,
      sourceDescription: source.description || "",
      topic: topic,
      defaultCategory: category,
      sourceWebsite: source.website || ""
    });
  };

  const updateNews = async () => {
    console.log("🚀 [BUTTON] INICIANDO ATUALIZAÇÃO MULTICATEGORIA (RSS + LLM)");
    setIsUpdating(true);
    setShowProgress(true);
    setUpdateProgress(0);
    setUpdateResults({ success: 0, errors: 0, total: 0 });

    const createdNewsList = [];
    const processedNewsIdentifiers = new Set();

    try {
      const sources = await Source.filter({ is_active: true });
      console.log(`📊 [BUTTON] ${sources.length} fontes ativas encontradas`);
      
      if (sources.length === 0) {
        alert("Nenhuma fonte ativa encontrada. Configure fontes primeiro!");
        setShowProgress(false);
        setIsUpdating(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        console.log(`\n[BUTTON] [${i + 1}/${sources.length}] 📰 ${source.name}`);
        setCurrentSource(`${source.name}... (${i + 1}/${sources.length})`);

        try {
          if (source.update_method === 'rss' && source.rss_feed_url) {
            console.log(`   📡 Modo RSS: ${source.rss_feed_url}`);
            
            const { data: rssResult } = await fetchRealNews({
              rss_feed_url: source.rss_feed_url,
              source_id: source.id,
              source_name: source.name,
              category: selectCategoryForSource(source)
            });

            if (rssResult && rssResult.success) {
              if (rssResult.created_news && rssResult.created_news.length > 0) {
                const newsArray = Array.isArray(rssResult.created_news) ? rssResult.created_news : [rssResult.created_news];
                
                newsArray.forEach(newsItem => {
                  const identifier = `${newsItem.title}-${newsItem.publication_date}`;
                  if (!processedNewsIdentifiers.has(identifier)) {
                    createdNewsList.push(newsItem);
                    processedNewsIdentifiers.add(identifier);
                    successCount++;
                  }
                });
                
                console.log(`   ✅ ${newsArray.length} notícias do RSS`);
              } else {
                console.log(`   ℹ️ RSS sem notícias novas`);
              }
            } else {
              console.log(`   ⚠️ RSS falhou: ${rssResult?.error || 'Erro desconhecido'}`);
            }
          } else {
            console.log(`   🤖 Modo LLM: Buscando em ${allLlmCategories.length} categorias...`);
            
            let sourceLlmErrors = 0;
            let sourceLlmSuccess = 0;

            for (const llmCategory of allLlmCategories) {
              const llmTopic = categoryPrompts[llmCategory];
              setCurrentSource(`${source.name} → ${llmCategory} (${i + 1}/${sources.length})`);
              
              console.log(`      🔎 Categoria: ${llmCategory}`);
              
              try {
                const newsData = await generateNewsForSource(source, llmCategory, llmTopic);
                
                const identifier = `${newsData.title}-${newsData.publication_date}`;
                if (!processedNewsIdentifiers.has(identifier)) {
                  const created = await safeCreateNews(newsData);
                  createdNewsList.push(created);
                  processedNewsIdentifiers.add(identifier);
                  successCount++;
                  sourceLlmSuccess++;
                  console.log(`      ✅ Notícia criada: "${newsData.title.substring(0, 50)}..."`);
                } else {
                  console.log(`      ⏭️ Notícia duplicada (já processada nesta rodada)`);
                }
              } catch (llmError) {
                if (llmError.message.includes("Notícia rejeitada")) {
                  console.log(`      ℹ️ ${llmError.message.substring(0, 80)}...`);
                } else {
                  console.error(`      ❌ Erro inesperado: ${llmError.message}`);
                  sourceLlmErrors++;
                }
              }
              
              await new Promise(resolve => setTimeout(resolve, 1500));
            }
            
            console.log(`   📊 Resumo LLM: ${sourceLlmSuccess} notícias | ${sourceLlmErrors} erros`);
            
            if (sourceLlmErrors > 0) {
              errorCount++;
            }
          }
        } catch (error) {
          console.error(`   ❌ Erro ao processar fonte '${source.name}': ${error.message}`);
          errorCount++;
        }

        setUpdateProgress(((i + 1) / sources.length) * 100);
        setUpdateResults({ success: successCount, errors: errorCount, total: sources.length });
        
        await new Promise(resolve => setTimeout(resolve, 2500));
      }

      console.log(`\n🎉 [BUTTON] CONCLUÍDO`);
      console.log(`   ✅ ${successCount} notícias criadas (sem duplicatas)`);
      console.log(`   ⚠️ ${errorCount} fontes com erros de sistema`);
      console.log(`   🔄 ${processedNewsIdentifiers.size} identificadores únicos processados`);
      
      setCurrentSource(`✅ ${successCount} notícias criadas!`);
      
      if (onNewsUpdated && createdNewsList.length > 0) {
        console.log("🔔 [BUTTON] Chamando callback onNewsUpdated...");
        onNewsUpdated(createdNewsList);
        console.log("✅ [BUTTON] Callback executado!");
      } else {
        console.warn("ℹ️ [BUTTON] Nenhuma notícia nova para adicionar");
      }
      
      setTimeout(() => {
        setShowProgress(false);
        setIsUpdating(false);
      }, 2000);

    } catch (error) {
      console.error("❌ [BUTTON] ERRO GLOBAL:", error);
      alert(`Erro: ${error.message}`);
      setShowProgress(false);
      setIsUpdating(false);
    }
  };

  const selectCategoryForSource = (source) => {
    const sourceName = (source.name || "").toLowerCase();
    const sourceDesc = (source.description || "").toLowerCase();
    
    if (sourceName.includes("ifrs") || sourceName.includes("iasb") || sourceDesc.includes("ifrs")) {
      return "ifrs";
    }
    if (sourceName.includes("fasb") || sourceName.includes("us gaap") || sourceName.includes("sec") || sourceDesc.includes("us gaap")) {
      return "usgaap";
    }
    if (sourceName.includes("esocial") || sourceName.includes("folha") || sourceName.includes("trabalhista") || sourceName.includes("sped")) {
      return "folha_pagamento";
    }
    if (sourceName.includes("receita") || sourceName.includes("fiscal") || sourceName.includes("tributário")) {
      return "fiscal";
    }
    if (sourceName.includes("reforma") || sourceName.includes("tributária")) {
      return "reforma_tributaria";
    }
    
    return "contabil";
  };

  return (
    <>
      <Button
        onClick={updateNews}
        disabled={isUpdating}
        className="bg-[#0066B3] hover:bg-[#002855] text-white font-semibold shadow-md"
      >
        {isUpdating ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Atualizando...
          </>
        ) : (
          <>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar Notícias
          </>
        )}
      </Button>

      <Dialog open={showProgress} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isUpdating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  Buscando Notícias (RSS + IA Multicategoria)
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Concluído
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <Progress value={updateProgress} className="w-full" />
            
            <div className="text-sm text-gray-600">
              {currentSource}
            </div>

            {updateResults && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {updateResults.success}
                  </div>
                  <div className="text-sm text-gray-500">Notícias Adicionadas</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {updateResults.errors}
                  </div>
                  <div className="text-sm text-gray-500">Fontes com Erro</div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
