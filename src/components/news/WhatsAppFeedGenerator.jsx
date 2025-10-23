
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
  contabil: "ðŸ“Š",
  fiscal: "ðŸ“‹", 
  folha_pagamento: "ðŸ’°",
  tributaria: "âš–ï¸",
  reforma_tributaria: "ðŸ”„",
  ifrs: "ðŸŒ",
  usgaap: "ðŸ‡ºðŸ‡¸"
};

const categoryLabels = {
  contabil: "ContÃ¡bil",
  fiscal: "Fiscal",
  folha_pagamento: "Folha de Pagamento",
  tributaria: "TributÃ¡ria", 
  reforma_tributaria: "Reforma TributÃ¡ria",
  ifrs: "IFRS",
  usgaap: "US GAAP"
};

const importanceEmojis = {
  alta: "ðŸ”¥",
  media: "âš ï¸",
  baixa: "â„¹ï¸"
};

export default function WhatsAppFeedGenerator({ allNews = [] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [period, setPeriod] = useState("today");
  const [generatedFeed, setGeneratedFeed] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const periodOptions = [
    { value: "today", label: "ðŸ“… Hoje" },
    { value: "yesterday", label: "ðŸ“… Ontem" },
    { value: "2days", label: "ðŸ“… Ãšltimos 2 dias" },
    { value: "3days", label: "ðŸ“… Ãšltimos 3 dias" },
    { value: "5days", label: "ðŸ“… Ãšltimos 5 dias" },
    { value: "week", label: "ðŸ“† Ãšltima semana (7 dias)" },
    { value: "10days", label: "ðŸ“† Ãšltimos 10 dias" },
    { value: "15days", label: "ðŸ“† Ãšltimos 15 dias" },
    { value: "3weeks", label: "ðŸ“† Ãšltimas 3 semanas" },
    { value: "month", label: "ðŸ—“ï¸ Ãšltimo mÃªs (30 dias)" },
    { value: "45days", label: "ðŸ—“ï¸ Ãšltimos 45 dias" },
    { value: "2months", label: "ðŸ—“ï¸ Ãšltimos 2 meses" },
    { value: "3months", label: "ðŸ—“ï¸ Ãšltimos 3 meses" },
    { value: "6months", label: "ðŸ—“ï¸ Ãšltimos 6 meses" },
    { value: "year", label: "ðŸ“… Ãšltimo ano" },
    { value: "all", label: "ðŸŒ Todas as notÃ­cias" }
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
      
      // Filtrar por perÃ­odo
      const dateFilter = getDateFilter(period);
      if (dateFilter && period !== "all") {
        filteredNews = filteredNews.filter(news => {
          const newsDate = new Date(news.publication_date);
          newsDate.setHours(0, 0, 0, 0);
          return newsDate >= dateFilter;
        });
      }

      // Organizar por importÃ¢ncia e data
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

      // Gerar cabeÃ§alho
      let feed = `ðŸ“° *Contábil News - AVISOS CONTÃBEIS* ðŸ“°\n`;
      feed += `ðŸ“… ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}\n\n`;
      
      if (period !== "today") {
        const periodLabel = periodOptions.find(p => p.value === period)?.label || "";
        feed += `ðŸ—“ï¸ *PerÃ­odo:* ${periodLabel}\n`;
        
        // Adicionar range de datas quando aplicÃ¡vel
        if (dateFilter) {
          const dateFrom = format(dateFilter, "dd/MM/yyyy", { locale: ptBR });
          const dateTo = format(new Date(), "dd/MM/yyyy", { locale: ptBR });
          feed += `ðŸ“Š *De:* ${dateFrom} *atÃ©:* ${dateTo}\n`;
        }
        feed += `\n`;
      }

      const totalNews = filteredNews.length;
      if (totalNews === 0) {
        feed += `â„¹ï¸ Nenhuma notÃ­cia encontrada para o perÃ­odo selecionado.\n\n`;
        setGeneratedFeed(feed);
        setIsGenerating(false);
        return;
      }

      feed += `ðŸ“Š *Total de notÃ­cias:* ${totalNews}\n`;
      feed += `   ðŸ”¥ Alta: ${highImportance.length} | âš ï¸ MÃ©dia: ${mediumImportance.length} | â„¹ï¸ Outras: ${lowImportance.length}\n\n`;

      // SeÃ§Ã£o de alta importÃ¢ncia - TODAS as notÃ­cias
      if (highImportance.length > 0) {
        feed += `ðŸ”¥ *ALTA IMPORTÃ‚NCIA* (${highImportance.length})\n`;
        feed += `${"â”".repeat(40)}\n\n`;
        
        highImportance.forEach((news, index) => {
          const emoji = categoryEmojis[news.category] || "ðŸ“„";
          const publishDate = format(new Date(news.publication_date), "dd/MM/yyyy", { locale: ptBR });
          
          feed += `${index + 1}. ${emoji} *${news.title}*\n`;
          feed += `   ðŸ“‚ ${categoryLabels[news.category]}\n`;
          feed += `   ðŸ“… ${publishDate}\n`;
          feed += `   ðŸ“ ${news.summary}\n`;
          
          if (news.tags && news.tags.length > 0) {
            feed += `   ðŸ·ï¸ ${news.tags.slice(0, 3).join(", ")}\n`;
          }
          
          // LINK EXTERNO - priorizar external_url, depois website da fonte
          const linkToUse = news.external_url || news.source?.website;
          if (linkToUse) {
            feed += `   ðŸ”— ${linkToUse}\n`;
          }
          
          if (news.source_name) {
            feed += `   ðŸ“° ${news.source_name}\n`;
          }
          
          feed += `\n`;
        });
      }

      // SeÃ§Ã£o de importÃ¢ncia mÃ©dia - TODAS as notÃ­cias
      if (mediumImportance.length > 0) {
        feed += `âš ï¸ *IMPORTÃ‚NCIA MÃ‰DIA* (${mediumImportance.length})\n`;
        feed += `${"â”".repeat(40)}\n\n`;
        
        mediumImportance.forEach((news, index) => {
          const emoji = categoryEmojis[news.category] || "ðŸ“„";
          const publishDate = format(new Date(news.publication_date), "dd/MM/yyyy", { locale: ptBR });
          
          feed += `${index + 1}. ${emoji} *${news.title}*\n`;
          feed += `   ðŸ“‚ ${categoryLabels[news.category]} | ðŸ“… ${publishDate}\n`;
          feed += `   ðŸ“ ${news.summary}\n`;
          
          const linkToUse = news.external_url || news.source?.website;
          if (linkToUse) {
            feed += `   ðŸ”— ${linkToUse}\n`;
          }
          
          if (news.source_name) {
            feed += `   ðŸ“° ${news.source_name}\n`;
          }
          
          feed += `\n`;
        });
      }

      // SeÃ§Ã£o de baixa importÃ¢ncia - TODAS as notÃ­cias
      if (lowImportance.length > 0) {
        feed += `â„¹ï¸ *OUTRAS NOTÃCIAS* (${lowImportance.length})\n`;
        feed += `${"â”".repeat(40)}\n\n`;
        
        lowImportance.forEach((news, index) => {
          const emoji = categoryEmojis[news.category] || "ðŸ“„";
          const publishDate = format(new Date(news.publication_date), "dd/MM", { locale: ptBR });
          
          feed += `${index + 1}. ${emoji} *${news.title}*\n`;
          feed += `   ðŸ“… ${publishDate} | ðŸ“‚ ${categoryLabels[news.category]}\n`;
          
          const linkToUse = news.external_url || news.source?.website;
          if (linkToUse) {
            feed += `   ðŸ”— ${linkToUse}\n`;
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
        feed += `ðŸ“ˆ *RESUMO POR CATEGORIA*\n`;
        feed += `${"â”".repeat(40)}\n`;
        Object.entries(categorySummary).forEach(([category, count]) => {
          const emoji = categoryEmojis[category] || "ðŸ“„";
          feed += `${emoji} ${categoryLabels[category]}: ${count} notÃ­cia${count > 1 ? 's' : ''}\n`;
        });
        feed += `\n`;
      }

      // RodapÃ©
      feed += `${"â”".repeat(50)}\n`;
      feed += `ðŸ“± *Contábil News Avisos ContÃ¡beis*\n`;
      feed += `ðŸ”„ Atualizado automaticamente\n`;
      feed += `ðŸ“§ Para mais detalhes, entre em contato\n`;
      feed += `â° Gerado em: ${format(new Date(), "HH:mm 'de' dd/MM/yyyy", { locale: ptBR })}`;

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
      alert("Feed copiado para a Ã¡rea de transferÃªncia! ðŸ“‹âœ¨");
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
                ðŸ“Š Dados sincronizados: <strong>{allNews.length} notÃ­cias disponÃ­veis</strong>
              </p>
            </div>
          )}

          {/* ConfiguraÃ§Ãµes */}
          <div className="space-y-3">
            <Label htmlFor="period" className="flex items-center gap-2 text-gray-700 font-semibold">
              <Calendar className="w-5 h-5 text-blue-600" />
              Selecione o PerÃ­odo das NotÃ­cias:
            </Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger id="period" className="w-full">
                <SelectValue placeholder="Selecione o perÃ­odo" />
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
              <Label className="text-base font-semibold">ðŸ“„ Preview do Feed:</Label>
              <Textarea
                value={generatedFeed}
                readOnly
                className="min-h-[400px] font-mono text-sm"
                placeholder="O feed aparecerÃ¡ aqui apÃ³s a geraÃ§Ã£o..."
              />

              {/* AÃ§Ãµes */}
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
            <h4 className="font-medium text-blue-900 mb-2">ðŸ’¡ Dicas de uso:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>â€¢ <strong>16 opÃ§Ãµes de perÃ­odo</strong> - De hoje atÃ© Ãºltimo ano</li>
              <li>â€¢ Inclui TODAS as notÃ­cias do perÃ­odo (sem limite)</li>
              <li>â€¢ Mostra o range de datas exato no cabeÃ§alho</li>
              <li>â€¢ Organizadas por importÃ¢ncia: Alta â†’ MÃ©dia â†’ Baixa</li>
              <li>â€¢ FormataÃ§Ã£o otimizada para WhatsApp com emojis</li>
              <li>â€¢ Resumo estatÃ­stico por categoria e importÃ¢ncia</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
