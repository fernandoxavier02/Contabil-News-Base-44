import { useRef, useState } from "react";
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
import { createRateLimiter, retry } from "@/components/utils/retry";
import { useToast } from "@/components/ui/use-toast";

const categoryPrompts = {
  contabil: "normas contabeis, demonstracoes financeiras, CPC, CFC",
  fiscal: "legislacao fiscal, impostos, declaracoes, DCTF, SPED",
  folha_pagamento: "eSocial, folha de pagamento, obrigacoes trabalhistas",
  tributaria: "jurisprudencia tributaria, STF, planejamento tributario",
  reforma_tributaria: "IBS, CBS, PEC da reforma tributaria",
  ifrs: "International Financial Reporting Standards, IASB",
  usgaap: "US GAAP, FASB, SEC",
};

const allLlmCategories = Object.keys(categoryPrompts);

function buildIdentifier(news) {
  if (!news) return "";
  return `${news.title || ""}-${news.publication_date || ""}`.toLowerCase();
}

export default function NewsUpdateButton({ onNewsUpdated }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [currentSource, setCurrentSource] = useState("");
  const [showProgress, setShowProgress] = useState(false);
  const [updateResults, setUpdateResults] = useState(null);
  const limiterRef = useRef(createRateLimiter(1200));
  const { toast } = useToast();

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
    setIsUpdating(true);
    setShowProgress(true);
    setUpdateProgress(0);
    setUpdateResults({ success: 0, errors: 0, total: 0 });

    const createdNewsList = [];
    const processedNewsIdentifiers = new Set();

    try {
      const sources = await Source.filter({ is_active: true });

      if (!Array.isArray(sources) || sources.length === 0) {
        toast({
          variant: "destructive",
          title: "Nenhuma fonte ativa",
          description: "Ative ou cadastre fontes antes de executar a atualizacao automatica.",
        });
        setShowProgress(false);
        setIsUpdating(false);
        return;
      }

      setUpdateResults({ success: 0, errors: 0, total: sources.length });

      const canFetchRemoteNews = remoteApi.isRouteConfigured("fetchRealNews");

      let successCount = 0;
      let errorCount = 0;

      for (let index = 0; index < sources.length; index += 1) {
        const source = sources[index];
        setCurrentSource(`${source.name} (${index + 1}/${sources.length})`);

        try {
          if (source.update_method === "rss") {
            if (!canFetchRemoteNews) {
              throw new Error(
                "Endpoint fetchRealNews nao configurado. Ajuste VITE_API_ROUTE_FETCH_REAL_NEWS para processar fontes RSS."
              );
            }

            await limiterRef.current();

            const { data } = await retry(
              () =>
                fetchRealNews({
                  rss_feed_url: source.rss_feed_url,
                  source_id: source.id,
                  source_name: source.name,
                  category: "geral",
                }),
              { retries: 1, baseDelayMs: 900, factor: 1.6 }
            );

            const newsArray = Array.isArray(data?.created_news) ? data.created_news : [];
            newsArray.forEach((newsItem) => {
              const identifier = buildIdentifier(newsItem);
              if (!processedNewsIdentifiers.has(identifier)) {
                createdNewsList.push(newsItem);
                processedNewsIdentifiers.add(identifier);
                successCount += 1;
              }
            });
          } else {
            for (const llmCategory of allLlmCategories) {
              const topic = categoryPrompts[llmCategory];

              await limiterRef.current();

              const generated = await retry(
                () => generateNewsForSource(source, llmCategory, topic),
                { retries: 1, baseDelayMs: 900, factor: 1.6 }
              );

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
          }
        } catch (error) {
          errorCount += 1;
          console.error(`[NewsUpdate] Falha ao processar a fonte ${source.name}:`, error);
          toast({
            variant: "destructive",
            title: `Erro na fonte ${source.name}`,
            description: error?.message || "Falha desconhecida durante a atualizacao desta fonte.",
          });
        }

        setUpdateProgress(((index + 1) / sources.length) * 100);
        setUpdateResults({ success: successCount, errors: errorCount, total: sources.length });

        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      if (createdNewsList.length > 0) {
        setCurrentSource(`Processo concluido: ${createdNewsList.length} noticia(s) adicionadas.`);
        if (typeof onNewsUpdated === "function") {
          onNewsUpdated(createdNewsList);
        }
        toast({
          title: "Atualizacao concluida",
          description: `${createdNewsList.length} noticia(s) adicionadas ao feed.`,
        });
      } else {
        setCurrentSource("Nenhuma noticia nova encontrada.");
        toast({
          title: "Sem novidades",
          description: "Nenhuma noticia nova foi encontrada para as fontes selecionadas.",
        });
      }
    } catch (error) {
      console.error("[NewsUpdate] Erro global:", error);
      toast({
        variant: "destructive",
        title: "Falha na atualizacao",
        description: error?.message || "Erro inesperado durante a atualizacao automatica.",
      });
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
            Atualizar Noticias
          </>
        )}
      </Button>

      <Dialog open={showProgress} onOpenChange={() => {}}>
        <DialogContent className="sm:max-w-md" onInteractOutside={(event) => event.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {isUpdating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                  Buscando noticias
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  Processo concluido
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
                  <div className="text-sm text-gray-500">Noticias adicionadas</div>
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
