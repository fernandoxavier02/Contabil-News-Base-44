import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Send, Loader2, AlertCircle, CheckCircle, XCircle } from "lucide-react";
import { News } from "@/api/entities";
import { sendToTelegram } from "@/api/functions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";

export default function TelegramTestPanel({ configs = [] }) {
  const [isSending, setIsSending] = useState(false);
  const [useAiTriage, setUseAiTriage] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleTest = async () => {
    setIsSending(true);
    setResults(null);
    setProgress(0);

    try {
      console.log(" Iniciando teste de envio de noticias...");
      
      const activeConfigs = configs.filter(c => c.is_active);

      if (!activeConfigs || activeConfigs.length === 0) {
        setResults({
          total: 0,
          sent: 0,
          errors: 0,
          details: [{
            channel: "Sistema",
            news: "N/A",
            status: "error",
            error: "Nenhum canal ativo encontrado. Ative ao menos um canal para testar."
          }]
        });
        setIsSending(false);
        return;
      }

      const allNews = await News.list('-publication_date', 100);
      console.log(` ${allNews.length} noticias encontradas`);
      
      if (allNews.length === 0) {
        setResults({
          total: 0,
          sent: 0,
          errors: 0,
          details: [{
            channel: "Sistema",
            news: "N/A",
            status: "error",
            error: "Nao ha noticias recentes para enviar. Gere/importe noticias primeiro."
          }]
        });
        setIsSending(false);
        return;
      }

      const res = {
        total: 0,
        sent: 0,
        errors: 0,
        details: []
      };

      const totalActiveConfigs = activeConfigs.length;
      let processedConfigs = 0;

      for (const config of activeConfigs) {
        console.log(`\n Processando canal: ${config.channel_name || config.channel_id}`);
        
        const newsForChannel = config.category === 'geral' 
          ? allNews 
          : allNews.filter(n => n.category === config.category);

        console.log(`    Noticias na categoria: ${newsForChannel.length}`);

        const importanceOrder = { baixa: 1, media: 2, alta: 3 };
        const minImportance = importanceOrder[config.min_importance || 'media'];
        
        const filteredNews = newsForChannel.filter(n => 
          importanceOrder[n.importance || 'media'] >= minImportance
        );

        console.log(`    Noticias apos filtro de importancia: ${filteredNews.length}`);

        const newsItemToTest = filteredNews.length > 0 ? filteredNews[0] : null;

        if (!newsItemToTest) {
          res.total++;
          res.errors++;
          res.details.push({
            channel: config.channel_name || config.channel_id,
            news: "N/A",
            status: "error",
            error: "Sem noticias compativeis para este canal (verifique categoria e importancia)"
          });
          processedConfigs++;
          setProgress((processedConfigs / totalActiveConfigs) * 100);
          continue;
        }

        res.total++;
          
        try {
          console.log(`       Enviando: ${newsItemToTest.title}`);
          
          const response = await sendToTelegram({
            news: newsItemToTest,
            telegramConfig: config,
            useAiTriage
          });

          console.log(`       Resposta:`, response.data);

          if (response.data && response.data.success) {
            res.sent++;
            res.details.push({
              channel: config.channel_name || config.channel_id,
              news: newsItemToTest.title,
              status: 'sent',
              aiAnalysis: response.data.aiAnalysis
            });
            console.log(`       SUCESSO`);
          } else {
            res.errors++;
            let errorMessage = response.data?.error || response.data?.message || "Erro desconhecido";
            
            res.details.push({
              channel: config.channel_name || config.channel_id,
              news: newsItemToTest.title,
              status: 'error',
              error: errorMessage
            });
            console.log(`       FALHA`);
          }
        } catch (error) {
          res.errors++;
          console.error(`       ERRO:`, error);
          
          let errorMessage = "Erro desconhecido";
          
          try {
            if (error.response?.data?.error) {
              errorMessage = error.response.data.error;
            } else if (error.message) {
              errorMessage = error.message;
            }
          } catch (e) {
            console.error("Erro ao processar mensagem de erro:", e);
          }
          
          res.details.push({
            channel: config.channel_name || config.channel_id,
            news: newsItemToTest.title,
            status: 'error',
            error: errorMessage
          });
        }
        
        processedConfigs++;
        setProgress((processedConfigs / totalActiveConfigs) * 100);
      }

      console.log("\n Resultado final:", res);
      setResults(res);

    } catch (error) {
      console.error(" Erro geral:", error);
      
      setResults({
        total: 0,
        sent: 0,
        errors: 1,
        details: [{
          channel: "Sistema",
          news: "Erro geral",
          status: 'error',
          error: error.message || error.toString()
        }]
      });
      
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="mb-8 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="w-5 h-5 text-blue-600" />
          Painel de Testes e Envio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600" />
          <AlertDescription className="text-sm text-amber-900">
            <strong> Antes de testar:</strong> Certifique-se que:
            <ul className="list-disc list-inside mt-1 ml-2">
              <li>O bot foi adicionado como <strong>ADMINISTRADOR</strong> no canal/grupo</li>
              <li>O bot tem permissao para <strong>enviar mensagens</strong></li>
              <li>Se usar topico: o <strong>ID do topico esta correto</strong> (use @userinfobot)</li>
            </ul>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="ai-triage-telegram"
              checked={useAiTriage}
              onCheckedChange={setUseAiTriage}
              disabled={isSending}
            />
            <Label htmlFor="ai-triage-telegram" className="flex items-center gap-2 text-sm font-medium">
              Usar Triagem de IA para aprovar envio
            </Label>
          </div>
          
          <Button
            onClick={handleTest}
            disabled={isSending || configs.filter(c => c.is_active).length === 0}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            {isSending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Enviar teste
              </>
            )}
          </Button>
        </div>

        {isSending && (
          <div className="bg-white rounded-lg p-6 border border-blue-200">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-sm font-medium text-gray-700">Processando canais e noticias...</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </div>
        )}

        {results && !isSending && (
          <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
            <h4 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
               Resultado do Envio:
            </h4>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-3xl font-bold text-blue-600">{results.total}</div>
                <div className="text-xs text-gray-500 mt-1">Total Processadas</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="text-3xl font-bold text-green-600">{results.sent}</div>
                <div className="text-xs text-gray-500 mt-1">Enviadas </div>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-lg border border-red-200">
                <div className="text-3xl font-bold text-red-600">{results.errors}</div>
                <div className="text-xs text-gray-500 mt-1">Erros </div>
              </div>
            </div>

            {results.details.length > 0 ? (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {results.details.map((detail, index) => (
                  <div 
                    key={index}
                    className={`p-3 rounded border ${
                      detail.status === 'sent' ? 'bg-green-50 border-green-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 text-sm">{detail.channel}</div>
                        <div className="text-xs text-gray-600 mt-1"> {detail.news}</div>
                        {detail.error && (
                          <div className="text-xs mt-2 p-2 bg-white rounded border border-red-200">
                            <pre className="whitespace-pre-wrap font-mono text-red-700">{detail.error}</pre>
                          </div>
                        )}
                      </div>
                      <div>
                        {detail.status === 'sent' ? 
                          <CheckCircle className="w-5 h-5 text-green-600" /> : 
                          <XCircle className="w-5 h-5 text-red-600" />
                        }
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                Nenhum detalhe disponivel
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
