import React from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Star, Clock, Tag, AlertTriangle, Info, Zap, Globe } from "lucide-react";

const categoryColors = {
  contabil: "bg-gradient-to-r from-blue-500 to-blue-600 text-white",
  fiscal: "bg-gradient-to-r from-green-500 to-green-600 text-white", 
  folha_pagamento: "bg-gradient-to-r from-purple-500 to-purple-600 text-white",
  tributaria: "bg-gradient-to-r from-orange-500 to-orange-600 text-white",
  reforma_tributaria: "bg-gradient-to-r from-red-500 to-red-600 text-white",
  ifrs: "bg-gradient-to-r from-indigo-500 to-indigo-600 text-white",
  usgaap: "bg-gradient-to-r from-cyan-500 to-cyan-600 text-white"
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
    color: "bg-gradient-to-r from-red-500 to-red-600 text-white",
    icon: AlertTriangle,
    badgeColor: "bg-red-500",
    ringColor: "ring-red-500/20"
  },
  media: {
    label: "Importancia Media",
    color: "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white",
    icon: Info,
    badgeColor: "bg-yellow-500",
    ringColor: "ring-yellow-500/20"
  },
  baixa: {
    label: "Baixa Importancia",
    color: "bg-gradient-to-r from-green-500 to-green-600 text-white",
    icon: Info,
    badgeColor: "bg-green-500",
    ringColor: "ring-green-500/20"
  }
};

// Funcao para formatar data sem depender do fuso local
function formatDateLocal(dateString) {
  if (!dateString) return "";

  const [year, month, day] = dateString.split("-").map(Number);
  const monthIndex = Number.isNaN(month) ? 0 : Math.max(0, Math.min(11, month - 1));

  const monthNames = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];

  return `${day} ${monthNames[monthIndex]} ${year}`;
}

export default function NewsCard({ news, onReadMore, isHighlighted, source, isNew }) {
  const importanceInfo = importanceConfig[news.importance] || importanceConfig.media;
  const ImportanceIcon = importanceInfo.icon;
  const sourceName = source?.name || news.source_name;
  const externalLink = source?.website || news.external_url;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      whileHover={{ y: -8, transition: { duration: 0.3 } }}
      className="group"
    >
      <Card className={`relative overflow-hidden transition-all duration-300 hover:shadow-2xl bg-white border ${
        isHighlighted 
          ? "border-[#0066B3] ring-2 ring-[#0066B3]/20 shadow-lg" 
          : "border-gray-200 hover:border-[#0066B3]/50"
      } ${news.importance === 'alta' ? `ring-2 ${importanceInfo.ringColor}` : ''} rounded-2xl ${
        isNew ? 'ring-2 ring-green-400 border-green-300' : ''
      }`}>
        
        {isNew && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute -top-3 -left-3 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg z-10"
          >
            NOVO
          </motion.div>
        )}

        <div className={`absolute top-0 left-0 w-1.5 h-full ${importanceInfo.badgeColor}`} />
        
        {isHighlighted && (
          <div className="absolute top-4 right-4 bg-gradient-to-r from-[#0066B3] to-[#002855] text-white px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
            <Star className="w-3.5 h-3.5 fill-current" />
            <span className="text-xs font-bold">Destaque</span>
          </div>
        )}
        
        <CardHeader className="pb-4 pt-6 px-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={`${categoryColors[news.category]} shadow-md px-3 py-1 font-semibold text-xs rounded-full`}>
                {categoryLabels[news.category]}
              </Badge>
              
              <Badge className={`${importanceInfo.color} shadow-md px-3 py-1 font-semibold text-xs rounded-full flex items-center gap-1.5`}>
                <ImportanceIcon className="w-3 h-3" />
                {importanceInfo.label}
              </Badge>
            </div>
          </div>
          
          <h3 className={`text-2xl font-bold group-hover:text-[#0066B3] transition-colors duration-200 leading-tight mb-3 ${
            news.importance === 'alta' ? 'text-[#002855]' : 'text-[#002855]'
          }`}>
            {news.importance === 'alta' && <Zap className="w-5 h-5 text-red-500 inline mr-2 mb-1" />}
            {news.title}
          </h3>
          
          <p className="text-[#58595B] text-base leading-relaxed">
            {news.summary}
          </p>
        </CardHeader>

        <CardContent className="pt-0 px-6 pb-6">
          <div className="flex items-center justify-between pt-4 border-t border-gray-100">
            <div className="flex items-center gap-4 text-sm text-[#58595B]">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span className="font-medium">{formatDateLocal(news.publication_date)}</span>
              </div>
              
              {sourceName && (
                <div className="flex items-center gap-1.5">
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">{sourceName}</span>
                </div>
              )}
              
              {news.tags && news.tags.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Tag className="w-4 h-4" />
                  <span className="font-medium">{news.tags.slice(0, 2).join(", ")}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => onReadMore(news)}
                className="bg-gradient-to-r from-[#0066B3] to-[#002855] hover:from-[#002855] hover:to-[#0066B3] text-white shadow-md font-semibold transition-all duration-300"
              >
                <Clock className="w-4 h-4 mr-1.5" />
                Ler Mais
              </Button>
              
              {externalLink && (
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="border-[#0066B3] text-[#0066B3] hover:bg-[#0066B3] hover:text-white transition-all duration-300"
                >
                  <a
                    href={externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
