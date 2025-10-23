import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Loader2, CheckCircle } from "lucide-react";
import { Source } from "@/api/entities";
import { safeCreateNews, generateNewsViaLLM } from "@/components/utils/integrationHelpers";
import { fetchRealNews } from "@/api/functions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { remoteApi } from "@/api/remoteApi";

const categoryPrompts = {
  contabil: "normas contábeis, demonstrações financeiras, CPC, CFC",
  fiscal: "legislação fiscal, impostos, declarações, DCTF, SPED",
  folha_pagamento: "eSocial, folha de pagamento, obrigações trabalhistas",
  tributaria: "jurisprudência tributária, STF, planejamento tributário",
  reforma_tributaria: "IBS, CBS, PEC da reforma tributária",
  ifrs: "International Financial Reporting Standards, IASB",
  usgaap: "US GAAP, FASB, SEC",
};

const allLlmCategories = Object.keys(categoryPrompts);

function buildIdentifier(news) {
  return `${news.title}-${news.publication_date || ""}`.toLowerCase();
}

export default function NewsUpdateButton({ onNewsUpdated }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [currentSource, setCurrentSource] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [updateResults, setUpdateResults] = useState(null);

  const generateNewsForSource = async (source, category, topic) => {
    const generated = await generateNewsViaLLM({
      sourceName: source.name,
      sourceDescription: source.description || "",
      topic,
      defaultCategory: category,
      sourceWebsite: source.website || "",
    });
    return generated?.news || generated;
  };

  const updateNews = async () => {
    if (
      !remoteApi.isRouteConfigured("fetchRealNews") &&
      !remoteApi.isRouteConfigured("generateNews")
    ) {
      alert(
        "Configure VITE_API_BASE_URL e os endpoints em src/api/remoteApi.js antes de executar a atualizacao automatica."
      );
      return;
    }

    setIsUpdating(true);
    setShowProgress(true);
    setUpdateProgress(0);
    setUpdateResults({ success: 0, errors: 0, total: 0 });

    const createdNewsList = [];
    const processedNewsIdentifiers = new Set();

    try {
      const sources = await Source.filter({ is_active: true });

      if (sources.length === 0) {
        alert("Nenhuma fonte ativa encontrada. Configure fontes primeiro!");
        setShowProgress(false);
        setIsUpdating(false);
        return;
      }

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < sources.length; i += 1) {
        const source = sources[i];
        setCurrentSource(`${source.name} (${i + 1}/${sources.length})`);

        try {
          if (
            source.update_method === "rss" &&
            source.rss_feed_url &&
            remoteApi.isRouteConfigured("fetchRealNews")
          ) {
            const { data } = await fetchRealNews({
              rss_feed_url: source.rss_feed_url,
              source_id: source.id,
              source_name: source.name,
              category: "geral",
            });

            const newsArray = Array.isArray(data?.created_news) ? data.created_news : [];
            newsArray.forEach((newsItem) => {
              const identifier = buildIdentifier(newsItem);
              if (!processedNewsIdentifiers.has(identifier)) {
                createdNewsList.push(newsItem);
                processedNewsIdentifiers.add(identifier);
                successCount += 1;
              }
            });
          } else if (remoteApi.isRouteConfigured("generateNews")) {
            for (const llmCategory of allLlmCategories) {
              const topic = categoryPrompts[llmCategory];
              const generated = await generateNewsForSource(source, llmCategory, topic);

              if (!generated) {
                continue;
              }

              const identifier = buildIdentifier(generated);
              if (processedNewsIdentifiers.has(identifier)) {
                continue;
              }

              const persisted = await safeCreateNews({
                ...generated,
                source_id: source.id,
                source_name: source.name,
              });

              createdNewsList.push(persisted);
              processedNewsIdentifiers.add(identifier);
              successCount += 1;
            }
          } else {
            throw new Error("Nenhuma estratégia disponível para esta fonte.");
          }
        } catch (error) {
          errorCount += 1;
          console.error(`[NewsUpdate] Falha ao processar a fonte ${source.name}:`, error);
        }

        setUpdateProgress(((i + 1) / sources.length) * 100);
        setUpdateResults({ success: successCount, errors: errorCount, total: sources.length });

        await new Promise((resolve) => setTimeout(resolve, 400));
      }

      if (createdNewsList.length > 0) {
        setCurrentSource(`Processo concluido: ${createdNewsList.length} noticia(s) adicionadas.`);
        if (typeof onNewsUpdated === "function") {
          onNewsUpdated(createdNewsList);
        }
      } else {
        setCurrentSource("Nenhuma noticia nova encontrada.");
      }
    } catch (error) {
      console.error("[NewsUpdate] Erro global:", error);
      alert(`Erro: ${error.message}`);
    } finally {
      setTimeout(() => {
        setShowProgress(false);
        setIsUpdating(false);
      }, 1500);
    }
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
                  Buscando notícias
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Processo concluído
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <Progress value={updateProgress} className="w-full" />
            <div className="text-sm text-gray-600">{currentSource}</div>

            {updateResults && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {updateResults.success}
                  </div>
                  <div className="text-sm text-gray-500">Notícias adicionadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{updateResults.errors}</div>
                  <div className="text-sm text-gray-500">Fontes com erro</div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
