import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { verifyNewsDates } from "@/api/functions";
import { Calendar, CheckCircle, XCircle, AlertTriangle, Loader2, FileSearch } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

export default function DateVerifier() {
  const [sampleSize, setSampleSize] = useState(10);
  const [isVerifying, setIsVerifying] = useState(false);
  const [report, setReport] = useState(null);

  const handleVerify = async () => {
    setIsVerifying(true);
    setReport(null);

    try {
      const response = await verifyNewsDates({
        sample_size: sampleSize
      });

      setReport(response.data);
    } catch (error) {
      console.error('Erro na verificaÃ§Ã£o:', error);
      alert(`Erro: ${error.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Verificador de Datas das NotÃ­cias
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Esta ferramenta compara as datas salvas no banco de dados com as datas reais das notÃ­cias nas fontes originais.
          </p>

          <div className="space-y-2">
            <Label htmlFor="sample-size">Tamanho da Amostra</Label>
            <Input
              id="sample-size"
              type="number"
              min="1"
              max="50"
              value={sampleSize}
              onChange={(e) => setSampleSize(parseInt(e.target.value) || 10)}
              placeholder="Quantas notÃ­cias verificar"
            />
            <p className="text-xs text-gray-500">
              NÃºmero de notÃ­cias aleatÃ³rias a serem verificadas (mÃ¡x: 50)
            </p>
          </div>

          <Button 
            onClick={handleVerify} 
            disabled={isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Verificando... (isso pode levar alguns minutos)
              </>
            ) : (
              <>
                <FileSearch className="w-4 h-4 mr-2" />
                Iniciar VerificaÃ§Ã£o
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {report && (
        <Card>
          <CardHeader>
            <CardTitle>RelatÃ³rio de VerificaÃ§Ã£o</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Resumo */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">{report.total_verified}</div>
                <div className="text-sm text-gray-600">Total Verificadas</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">{report.correct_dates}</div>
                <div className="text-sm text-gray-600">Corretas</div>
              </div>
              
              <div className="bg-red-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">{report.incorrect_dates}</div>
                <div className="text-sm text-gray-600">Incorretas</div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">{report.unable_to_verify}</div>
                <div className="text-sm text-gray-600">NÃ£o VerificÃ¡veis</div>
              </div>
            </div>

            {/* PrecisÃ£o */}
            <Alert className={report.incorrect_dates === 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}>
              <AlertDescription>
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    {report.incorrect_dates === 0 ? 'âœ…' : 'âš ï¸'} PrecisÃ£o das Datas:
                  </span>
                  <span className="text-2xl font-bold">{report.accuracy_percentage}%</span>
                </div>
                <p className="text-sm mt-2">{report.summary.recommendation}</p>
              </AlertDescription>
            </Alert>

            {/* Resultados Detalhados */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Resultados Detalhados:</h3>
              
              {report.results.map((result, index) => (
                <Card key={index} className={
                  result.status === 'correct' ? 'border-green-200 bg-green-50/50' :
                  result.status === 'incorrect' ? 'border-red-200 bg-red-50/50' :
                  'border-yellow-200 bg-yellow-50/50'
                }>
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {result.status === 'correct' && <CheckCircle className="w-5 h-5 text-green-600" />}
                          {result.status === 'incorrect' && <XCircle className="w-5 h-5 text-red-600" />}
                          {result.status === 'unable_to_verify' && <AlertTriangle className="w-5 h-5 text-yellow-600" />}
                          {result.status === 'error' && <XCircle className="w-5 h-5 text-gray-600" />}
                          
                          <h4 className="font-medium text-sm">{result.title}</h4>
                        </div>
                        
                        <div className="space-y-1 text-sm">
                          <div className="flex gap-4">
                            <span className="text-gray-600">Data Salva:</span>
                            <span className="font-mono">{result.saved_date}</span>
                          </div>
                          
                          {result.found_date && (
                            <>
                              <div className="flex gap-4">
                                <span className="text-gray-600">Data na Fonte:</span>
                                <span className="font-mono">{result.found_date}</span>
                              </div>
                              
                              {result.difference_days > 0 && (
                                <div className="flex gap-4">
                                  <span className="text-gray-600">DiferenÃ§a:</span>
                                  <Badge variant="destructive">{result.difference_days} dias</Badge>
                                </div>
                              )}
                              
                              {result.source && (
                                <div className="flex gap-4">
                                  <span className="text-gray-600">Fonte da Data:</span>
                                  <span className="text-xs">{result.source}</span>
                                </div>
                              )}
                              
                              {result.confidence && (
                                <div className="flex gap-4">
                                  <span className="text-gray-600">ConfianÃ§a:</span>
                                  <Badge variant={
                                    result.confidence === 'high' ? 'default' :
                                    result.confidence === 'medium' ? 'secondary' : 'outline'
                                  }>
                                    {result.confidence}
                                  </Badge>
                                </div>
                              )}
                            </>
                          )}
                          
                          {result.message && (
                            <p className="text-gray-500 italic">{result.message}</p>
                          )}
                          
                          {result.error && (
                            <p className="text-red-600 text-xs">Erro: {result.error}</p>
                          )}
                        </div>
                        
                        {result.external_url && (
                          <a 
                            href={result.external_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                          >
                            Ver notÃ­cia original â†’
                          </a>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
