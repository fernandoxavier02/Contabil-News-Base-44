import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Tag, AlertTriangle, Info } from "lucide-react";

const categoryColors = {
  contabil: "bg-blue-100 text-blue-800 border-blue-200",
  fiscal: "bg-green-100 text-green-800 border-green-200",
  folha_pagamento: "bg-purple-100 text-purple-800 border-purple-200",
  tributaria: "bg-orange-100 text-orange-800 border-orange-200",
  reforma_tributaria: "bg-red-100 text-red-800 border-red-200",
  ifrs: "bg-indigo-100 text-indigo-800 border-indigo-200",
  usgaap: "bg-cyan-100 text-cyan-800 border-cyan-200"
};

const categoryLabels = {
  contabil: "Contabil",
  fiscal: "Fiscal", 
  folha_pagamento: "Folha de Pagamento",
  tributaria: "Tributaria",
  reforma_tributaria: "Reforma Tributaria",
  ifrs: "IFRS",
  usgaap: "US GAAP"
};

const importanceConfig = {
  alta: {
    label: "Alta Importancia",
    color: "bg-red-100 text-red-800 border-red-300",
    icon: AlertTriangle
  },
  media: {
    label: "Importancia Media",
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    icon: Info
  },
  baixa: {
    label: "Baixa Importancia",
    color: "bg-green-100 text-green-800 border-green-300",
    icon: Info
  }
};

// Funcao para formatar data sem depender do fuso local
function formatDateLocal(dateString) {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-").map(Number);
  const monthIndex = Number.isNaN(month) ? 0 : Math.max(0, Math.min(11, month - 1));

  const monthNames = [
    "janeiro",
    "fevereiro",
    "marco",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];

  return `${day} de ${monthNames[monthIndex]} de ${year}`;
}

export default function NewsModal({ news, open, onOpenChange }) {
  if (!news) return null;

  const importanceInfo = importanceConfig[news.importance] || importanceConfig.media;
  const ImportanceIcon = importanceInfo.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Badge className={`${categoryColors[news.category]} border font-medium`}>
              {categoryLabels[news.category]}
            </Badge>
            
            <Badge className={`${importanceInfo.color} border font-medium flex items-center gap-1`}>
              <ImportanceIcon className="w-3 h-3" />
              {importanceInfo.label}
            </Badge>
            
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar className="w-4 h-4" />
              {formatDateLocal(news.publication_date)}
            </div>
          </div>
          
          <DialogTitle className="text-2xl font-bold text-gray-900 leading-tight mb-4">
            {news.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-lg text-gray-700 font-medium leading-relaxed">
            {news.summary}
          </div>

          {news.content && (
            <div className="prose prose-gray max-w-none">
              <div className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {news.content}
              </div>
            </div>
          )}

          {news.tags && news.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Tag className="w-4 h-4 text-gray-500" />
              {news.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-gray-200">
            {news.source_name && (
              <div className="text-sm text-gray-500">
                <span className="font-medium">Fonte:</span> {news.source_name}
              </div>
            )}

            {news.external_url && (
              <Button
                asChild
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <a
                  href={news.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Ver noticia completa
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
