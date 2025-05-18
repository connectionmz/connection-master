// utils/reportGenerator.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { calculateCTR, formatDate, formatPrice } from './adUtils';

export const generateAdReport = async (ad, stats) => {
  const doc = new jsPDF();
  
  // Adicionar logo ou cabeçalho
  doc.setFontSize(18);
  doc.text('Relatório de Anúncio', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, 105, 30, { align: 'center' });
  
  // Informações básicas do anúncio
  doc.setFontSize(14);
  doc.text('Informações do Anúncio', 14, 40);
  doc.setFontSize(10);
  
  const adInfo = [
    ['Descrição:', ad.description],
    ['Tipo:', 
      ad.tipoAnuncio === 'home' ? 'Página Inicial' :
      ad.tipoAnuncio === 'concurso' ? 'Concurso' :
      ad.tipoAnuncio === 'cotacoes' ? 'Cotações' : 'Destacar Perfil'
    ],
    ['Duração:', `${ad.days} dias`],
    ['Custo:', `${formatPrice(ad.totalCost)} MT`],
    ['Status:', ad.status],
    ['Criado em:', formatDate(ad.uploadedAt)],
    ['Expira em:', formatDate(ad.expireDate)],
    ['Províncias:', ad.provincias?.join(', ') || 'Nenhuma'],
    ['Setores:', ad.sectores?.join(', ') || 'Nenhum'],
  ];
  
  doc.autoTable({
    startY: 45,
    head: [['Campo', 'Valor']],
    body: adInfo,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });
  
  // Estatísticas gerais
  doc.setFontSize(14);
  doc.text('Estatísticas Gerais', 14, doc.autoTable.previous.finalY + 15);
  
  const generalStats = [
    ['Impressões', stats.impressions],
    ['Cliques', stats.clicks],
    ['CTR', `${calculateCTR(stats.clicks, stats.impressions)}%`],
  ];
  
  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 20,
    head: [['Métrica', 'Valor']],
    body: generalStats,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });
  
  // Desempenho por setor
  if (stats.performanceBySector.length > 0) {
    doc.setFontSize(14);
    doc.text('Desempenho por Setor', 14, doc.autoTable.previous.finalY + 15);
    
    const sectorData = stats.performanceBySector.map(sector => [
      sector.sector,
      sector.impressions,
      sector.clicks,
      `${sector.ctr}%`
    ]);
    
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [['Setor', 'Impressões', 'Cliques', 'CTR']],
      body: sectorData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });
  }
  
  // Empresas atingidas (apenas as top 5)
  if (stats.companiesReached.length > 0) {
    doc.setFontSize(14);
    doc.text('Top 5 Empresas Atingidas', 14, doc.autoTable.previous.finalY + 15);
    
    const companiesData = stats.companiesReached.slice(0, 5).map(company => [
      company.name,
      company.impressions,
      company.clicks,
      `${company.ctr}%`
    ]);
    
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [['Empresa', 'Impressões', 'Cliques', 'CTR']],
      body: companiesData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    if (stats.companiesReached.length > 5) {
      doc.setFontSize(10);
      doc.text(
        `+ ${stats.companiesReached.length - 5} outras empresas`, 
        14, 
        doc.autoTable.previous.finalY + 10
      );
    }
  }
  
  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(150);
  doc.text(
    'Relatório gerado automaticamente pelo sistema de anúncios', 
    105, 
    doc.internal.pageSize.height - 10, 
    { align: 'center' }
  );
  
  // Salvar o PDF
  doc.save(`relatorio_anuncio_${ad.id}.pdf`);
};