
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Loader2, CheckCircle, XCircle, AlertCircle, Send } from "lucide-react";
import { News } from "@/api/entities";
import { sendToTeams } from "@/api/functions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export default function TeamsTestPanel({ configs = [] }) {
  const [isSending, setIsSending] = useState(false);
  const [results, setResults] = useState(null);
  const [progress, setProgress] = useState(0);
  const [useAiTriage, setUseAiTriage] = useState(false);

  const handleTest = async () => {
    setIsSending(true);
    setResults(null);
    setProgress(0);
    try {
      const allNews = await News.list('-publication_date', 100); // Aumentado para 100
      if (!allNews.length) {
        setResults({ total: 0, sent: 0, errors: 0, details: [] });
        return;
      }

      const active = configs.filter(c => c.is_active);
      const res = { total: 0, sent: 0, errors: 0, details: [] };

      for (let i = 0; i < active.length; i++) {
        const cfg = active[i];
        
        const importanceOrder = { baixa: 1, media: 2, alta: 3 };
        const minImp = importanceOrder[cfg.min_importance || "media"];
        
        const list = (cfg.category === "geral" ? allNews : allNews.filter(n => n.category === cfg.category))
          .filter(n => importanceOrder[n.importance || "media"] >= minImp);

        const item = list[0];
        console.log(`[Test Panel Teams] Para o canal ${cfg.channel_name}, notícia selecionada:`, item ? item.title : "NENHUMA");

        if (!item) {
          res.details.push({
            channel: cfg.channel_name || cfg.team_name || "Teams",
            status: "error",
            error: "Sem notícias compatíveis para este canal (verifique categoria e importância)"
          });
          res.errors++;
          res.total++;
          setProgress(((i + 1) / active.length) * 100);
          await sleep(400); // Maintain the sleep for visual progression
          continue;
        }

        try {
          const response = await sendToTeams({ news: item, teamsConfig: cfg, useAiTriage });
          if (response.data && response.data.success) {
            res.sent++;
            res.details.push({
              channel: cfg.channel_name || cfg.team_name || "Teams",
              news: item.title,
              status: "sent"
            });
          } else {
            res.errors++;
            res.details.push({
              channel: cfg.channel_name || cfg.team_name || "Teams",
              news: item.title,
              status: "error",
              error: response.data?.message || "Falha ao enviar"
            });
          }
        } catch (e) {
          const msg = e?.response?.data?.error || e.message || "Erro desconhecido";
          res.errors++;
          res.details.push({
            channel: cfg.channel_name || cfg.team_name || "Teams",
            news: item.title,
            status: "error",
            error: msg
          });
        }
        res.total++;
        setProgress(((i + 1) / active.length) * 100);
        await sleep(400);
      }

      setResults(res);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Painel de Teste (Teams)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert className="bg-purple-50 border-purple-200">
          <AlertCircle className="w-4 h-4 text-purple-600" />
          <AlertDescription className="text-sm text-purple-900">
            Garanta que a URL do Webhook para cada canal do Teams está correta.
          </AlertDescription>
        </Alert>

        <div className="flex items-center space-x-2">
          <Checkbox id="ai-triage-teams" checked={useAiTriage} onCheckedChange={setUseAiTriage} />
          <Label htmlFor="ai-triage-teams" className="text-sm font-medium">Usar Triagem de IA para aprovar envio</Label>
        </div>

        <Button onClick={handleTest} disabled={isSending || configs.length === 0} className="bg-purple-600 hover:bg-purple-700">
          {isSending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</> : <><Send className="w-4 h-4 mr-2" /> Enviar teste</>}
        </Button>

        {isSending && <Progress value={progress} className="h-2" />}

        {results && (
          <div className="bg-white rounded-lg p-4 border">
            <div className="grid grid-cols-3 gap-3 mb-3 text-sm">
              <div className="text-blue-700">Total: <strong>{results.total}</strong></div>
              <div className="text-green-700">Enviadas: <strong>{results.sent}</strong></div>
              <div className="text-red-700">Erros: <strong>{results.errors}</strong></div>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto text-sm">
              {results.details.map((d, i) => (
                <div key={i} className={`p-2 rounded border ${d.status === 'sent' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                  <div className="flex justify-between">
                    <div>
                      <div className="font-medium">{d.channel}</div>
                      <div className="text-gray-600">Notícia: {d.news}</div>
                      {d.error && <div className="text-red-700 font-semibold">{d.error}</div>}
                    </div>
                    <div>
                      {d.status === 'sent' ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-red-600" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
