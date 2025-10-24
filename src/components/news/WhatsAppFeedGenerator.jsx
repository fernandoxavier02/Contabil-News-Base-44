
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageCircle, Copy, Download, Calendar, Loader2 } from "lucide-react";
import { format, subDays, subWeeks, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

const categoryEmojis = {
  contabil: "[C]",
  fiscal: "[F]",
  folha_pagamento: "[Folha]",
  tributaria: "[Trib]",
  reforma_tributaria: "[Reforma]",
  ifrs: "[IFRS]",
  usgaap: "[US]",
};

const categoryLabels = {
  contabil: "Contabil",
  fiscal: "Fiscal",
  folha_pagamento: "Folha de Pagamento",
  tributaria: "Tributaria",
  reforma_tributaria: "Reforma Tributaria",
  ifrs: "IFRS",
  usgaap: "US GAAP",
};

const ignoredImportanceEmojis = {
  alta: "",
  media: "",
  baixa: "",
};

export default function WhatsAppFeedGenerator({ allNews = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [period, setPeriod] = useState("today");
  const [generatedFeed, setGeneratedFeed] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const periodOptions = [
    { value: "today", label: "Hoje" },
    { value: "yesterday", label: "Ontem" },
    { value: "2days", label: "Ultimos 2 dias" },
    { value: "3days", label: "Ultimos 3 dias" },
    { value: "5days", label: "Ultimos 5 dias" },
    { value: "week", label: "Ultima semana (7 dias)" },
    { value: "10days", label: "Ultimos 10 dias" },
    { value: "15days", label: "Ultimos 15 dias" },
    { value: "3weeks", label: "Ultimas 3 semanas" },
    { value: "month", label: "Ultimo mes (30 dias)" },
    { value: "45days", label: "Ultimos 45 dias" },
    { value: "2months", label: "Ultimos 2 meses" },
    { value: "3months", label: "Ultimos 3 meses" },
    { value: "6months", label: "Ultimos 6 meses" },
    { value: "year", label: "Ultimo ano" },
    { value: "all", label: "Todas as noticias" },
  ];

  const getDateFilter = (period) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    switch (period) {
      case "today":
        return today;
      case "yesterday":
        return subDays(today, 1);
      case "2days":
        return subDays(today, 2);
      case "3days":
        return subDays(today, 3);
      case "5days":
        return subDays(today, 5);
      case "week":
        return subDays(today, 7);
      case "10days":
        return subDays(today, 10);
      case "15days":
        return subDays(today, 15);
      case "3weeks":
        return subWeeks(today, 3);
      case "month":
        return subDays(today, 30);
      case "45days":
        return subDays(today, 45);
      case "2months":
        return subMonths(today, 2);
      case "3months":
        return subMonths(today, 3);
      case "6months":
        return subMonths(today, 6);
      case "year":
        return subMonths(today, 12);
      default:
        return null;
    }
  };

  const generateFeed = async () => {
    setIsGenerating(true);
    try {
      let filteredNews = [...allNews];
      
      // Filtrar por periodo
      const dateFilter = getDateFilter(period);
      if (dateFilter && period !== "all") {
        filteredNews = filteredNews.filter(news => {
          const newsDate = new Date(news.publication_date);
          newsDate.setHours(0, 0, 0, 0);
          return newsDate >= dateFilter;
        });
      }

      // Organizar por importancia e data
      filteredNews.sort((a, b) => {
        const importanceOrder = { alta: 3, media: 2, baixa: 1 };
        const aImp = importanceOrder[a.importance] || 2;
        const bImp = importanceOrder[b.importance] || 2;
        
        if (aImp !== bImp) return bImp - aImp;
        return new Date(b.publication_date) - new Date(a.publication_date);
      });

      const highImportance = filteredNews.filter(n => n.importance === 'alta');
      const mediumImportance = filteredNews.filter(n => n.importance === 'media');
      const lowImportance = filteredNews.filter(n => n.importance === 'baixa');

      // Gerar cabecalho
      let feed = ` *Contabil News - AVISOS CONTABEIS* \n`;
      feed += ` ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}\n\n`;
      
      if (period !== "today") {
        const periodLabel = periodOptions.find(p => p.value === period)?.label || "";
        feed += ` *Periodo:* ${periodLabel}\n`;
        
        // Adicionar range de datas quando aplicavel
        if (dateFilter) {
          const dateFrom = format(dateFilter, "dd/MM/yyyy", { locale: ptBR });
          const dateTo = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
          feed += ` *De:* ${dateFrom} *ate:* ${dateTo}\n`;
        }
        feed += `\n`;
      }

      const totalNews = filteredNews.length;
      if (totalNews === 0) {
        feed += ` Nenhuma noticia encontrada para o periodo selecionado.\n\n`;
        setGeneratedFeed(feed);
        setIsGenerating(false);
        return;
      }

      feed += ` *Total de noticias:* ${totalNews}\n`;
      feed += `    Alta: ${highImportance.length} |  Media: ${mediumImportance.length} |  Outras: ${lowImportance.length}\n\n`;

      // Secao de alta importancia - TODAS as noticias
      if (highImportance.length > 0) {
        feed += ` *ALTA IMPORTANCIA* (${highImportance.length})\n`;
        feed += `${"".repeat(40)}\n\n`;
        
        highImportance.forEach((news, index) => {
          const emoji = categoryEmojis[news.category] || "";
          const publishDate = format(new Date(news.publication_date), "dd/MM/yyyy", { locale: ptBR });
          
          feed += `${index + 1}. ${emoji} *${news.title}*\n`;
          feed += `    ${categoryLabels[news.category]}\n`;
          feed += `    ${publishDate}\n`;
          feed += `    ${news.summary}\n`;
          
          if (news.tags && news.tags.length > 0) {
            feed += `    ${news.tags.slice(0, 3).join(", ")}\n`;
          }
          
          // LINK EXTERNO - priorizar external_url, depois website da fonte
          const linkToUse = news.external_url || news.source?.website;
          if (linkToUse) {
            feed += `    ${linkToUse}\n`;
          }
          
          if (news.source_name) {
            feed += `    ${news.source_name}\n`;
          }
          
          feed += `\n`;
        });
      }

      // Secao de importancia media - TODAS as noticias
      if (mediumImportance.length > 0) {
        feed += ` *IMPORTANCIA MEDIA* (${mediumImportance.length})\n`;
        feed += `${"".repeat(40)}\n\n`;
        
        mediumImportance.forEach((news, index) => {
          const emoji = categoryEmojis[news.category] || "";
          const publishDate = format(new Date(news.publication_date), "dd/MM/yyyy", { locale: ptBR });
          
          feed += `${index + 1}. ${emoji} *${news.title}*\n`;
          feed += `    ${categoryLabels[news.category]} |  ${publishDate}\n`;
          feed += `    ${news.summary}\n`;
          
          const linkToUse = news.external_url || news.source?.website;
          if (linkToUse) {
            feed += `    ${linkToUse}\n`;
          }
          
          if (news.source_name) {
            feed += `    ${news.source_name}\n`;
          }
          
          feed += `\n`;
        });
      }

      // Secao de baixa importancia - TODAS as noticias
      if (lowImportance.length > 0) {
        feed += ` *OUTRAS NOTICIAS* (${lowImportance.length})\n`;
        feed += `${"".repeat(40)}\n\n`;
        
        lowImportance.forEach((news, index) => {
          const emoji = categoryEmojis[news.category] || "";
          const publishDate = format(new Date(news.publication_date), "dd/MM", { locale: ptBR });
          
          feed += `${index + 1}. ${emoji} *${news.title}*\n`;
          feed += `    ${publishDate} |  ${categoryLabels[news.category]}\n`;
          
          const linkToUse = news.external_url || news.source?.website;
          if (linkToUse) {
            feed += `    ${linkToUse}\n`;
          }
          
          feed += `\n`;
        });
      }

      // Resumo por categoria
      const categorySummary = {};
      filteredNews.forEach(news => {
        if (!categorySummary[news.category]) {
          categorySummary[news.category] = 0;
        }
        categorySummary[news.category]++;
      });

      if (Object.keys(categorySummary).length > 0) {
        feed += ` *RESUMO POR CATEGORIA*\n`;
        feed += `${"".repeat(40)}\n`;
        Object.entries(categorySummary).forEach(([category, count]) => {
          const emoji = categoryEmojis[category] || "";
          feed += `${emoji} ${categoryLabels[category]}: ${count} noticia${count > 1 ? 's' : ''}\n`;
        });
        feed += `\n`;
      }

      // Rodape
      feed += `${"".repeat(50)}\n`;
      feed += ` *Contabil News Avisos Contabeis*\n`;
      feed += ` Atualizado automaticamente\n`;
      feed += ` Para mais detalhes, entre em contato\n`;
      feed += ` Gerado em: ${format(new Date(), "HH:mm 'de' dd/MM/yyyy", { locale: ptBR })}`;

      setGeneratedFeed(feed);
    } catch (error) {
      console.error("Erro ao gerar feed:", error);
      setGeneratedFeed("Erro ao gerar o feed. Tente novamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedFeed);
      alert("Feed copiado para a area de transferencia! ");
    } catch (error) {
      console.error("Erro ao copiar:", error);
      alert("Erro ao copiar. Tente selecionar e copiar manualmente.");
    }
  };

  const downloadAsTxt = () => {
    const blob = new Blob([generatedFeed], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `feed-whatsapp-${format(new Date(), 'yyyy-MM-dd-HHmm')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-[#25D366] border-[#25D366] hover:bg-[#25D366] hover:text-white font-semibold shadow-md">
          <MessageCircle className="w-4 h-4 mr-2" />
          Gerar Feed WhatsApp
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            Gerar Feed para WhatsApp
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info sobre dados */}
          {allNews.length > 0 && (
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-sm text-green-800">
                 Dados sincronizados: <strong>{allNews.length} noticias disponiveis</strong>
              </p>
            </div>
          )}

          {/* Configuracoes */}
          <div className="space-y-3">
            <Label htmlFor="period" className="flex items-center gap-2 text-gray-700 font-semibold">
              <Calendar className="w-5 h-5 text-blue-600" />
              Selecione o Periodo das Noticias:
            </Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="period" className="w-full">
                <SelectValue placeholder="Selecione o periodo" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {periodOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button 
              onClick={generateFeed} 
              disabled={isGenerating} 
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando Feed...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Gerar Feed
                </>
              )}
            </Button>
          </div>

          {/* Preview do Feed */}
          {generatedFeed && (
            <div className="space-y-4">
              <Label className="text-base font-semibold"> Preview do Feed:</Label>
              <Textarea
                value={generatedFeed}
                readOnly
                className="min-h-[400px] font-mono text-sm"
                placeholder="O feed aparecera aqui apos a geracao..."
              />

              {/* Acoes */}
              <div className="flex gap-3">
                <Button onClick={copyToClipboard} className="flex-1 bg-green-600 hover:bg-green-700">
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar para WhatsApp
                </Button>
                <Button variant="outline" onClick={downloadAsTxt}>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar TXT
                </Button>
              </div>
            </div>
          )}

          {/* Dicas */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-medium text-blue-900 mb-2"> Dicas de uso:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li> <strong>16 opcoes de periodo</strong> - De hoje ate ultimo ano</li>
              <li> Inclui TODAS as noticias do periodo (sem limite)</li>
              <li> Mostra o range de datas exato no cabecalho</li>
              <li> Organizadas por importancia: Alta  Media  Baixa</li>
              <li> Formatacao otimizada para WhatsApp com emojis</li>
              <li> Resumo estatistico por categoria e importancia</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
