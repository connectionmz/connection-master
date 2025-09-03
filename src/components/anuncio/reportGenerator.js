// utils/reportGenerator.js
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { calculateCTR, formatDate, formatPrice } from './adUtils';

export const generateAdReport = async (ad, adStats, interestedCompanies = []) => {
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
    ['Descrição:', ad.description || 'Nenhuma descrição'],
    ['Tipo:', 
      ad.tipoAnuncio === 'home' ? 'Página Inicial' :
      ad.tipo === 'concurso' ? 'Concurso' :
      ad.tipoAnuncio === 'cotacoes' ? 'Cotações' : 
      ad.tipoAnuncio === 'destacar' ? 'Destacar Perfil' : ad.tipoAnuncio || 'Desconhecido'
    ],
    ['Duração:', `${ad.days || 0} dias`],
    ['Custo:', `${formatPrice(ad.totalCost || 0)} MT`],
    ['Status:', ad.status || 'Desconhecido'],
    ['Criado em:', formatDate(ad.uploadedAt)],
    ['Expira em:', formatDate(ad.expireDate)],
    ['Províncias:', ad.provincias?.join(', ') || 'Todas'],
    ['Setores:', ad.sectores?.join(', ') || 'Todos'],
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
  doc.text('Estatísticas de Cliques', 14, doc.autoTable.previous.finalY + 15);
  
  const generalStats = [
    ['Total de Cliques', adStats.clicks || 0],
    ['Potenciais Interessados', interestedCompanies.length || 0],
  ];
  
  doc.autoTable({
    startY: doc.autoTable.previous.finalY + 20,
    head: [['Métrica', 'Valor']],
    body: generalStats,
    theme: 'grid',
    headStyles: { fillColor: [41, 128, 185] },
  });
  
  // Empresas que clicaram (apenas as top 5)
  if (adStats.companiesReached && adStats.companiesReached.length > 0) {
    doc.setFontSize(14);
    doc.text('Empresas que Clicaram no Anúncio', 14, doc.autoTable.previous.finalY + 15);
    
    const companiesData = adStats.companiesReached.slice(0, 5).map(company => [
      company.name,
      company.clicks,
      company.interestDescription,
      company.provincia
    ]);
    
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [['Empresa', 'Cliques', 'Nível Interesse', 'Província']],
      body: companiesData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });
    
    if (adStats.companiesReached.length > 5) {
      doc.setFontSize(10);
      doc.text(
        `+ ${adStats.companiesReached.length - 5} outras empresas`, 
        14, 
        doc.autoTable.previous.finalY + 10
      );
    }
  }
  
  // Potenciais interessados (3+ cliques)
  if (interestedCompanies && interestedCompanies.length > 0) {
    doc.setFontSize(14);
    doc.text('Potenciais Interessados (3+ cliques)', 14, doc.autoTable.previous.finalY + 15);
    
    const interestedData = interestedCompanies.map(company => [
      company.name,
      company.clicks,
      company.provincia,
      company.sector,
      company.contacto !== 'Não disponível' ? company.contacto : '-',
      company.email !== 'Não disponível' ? company.email : '-'
    ]);
    
    doc.autoTable({
      startY: doc.autoTable.previous.finalY + 20,
      head: [['Empresa', 'Cliques', 'Província', 'Setor', 'Contacto', 'Email']],
      body: interestedData,
      theme: 'grid',
      headStyles: { fillColor: [41, 128, 185] },
    });
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