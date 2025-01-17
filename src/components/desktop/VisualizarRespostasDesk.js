import React, { useEffect, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../../fb';
import { Box, Typography, Button, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Bar, Pie } from 'react-chartjs-2';
import { saveAs } from 'file-saver'; // Para exportação XLS
import jsPDF from 'jspdf'; // Para exportação PDF
import autoTable from 'jspdf-autotable';

const VisualizarRespostasDesk = ({ surveyId, onBack }) => {
  const [respostas, setRespostas] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const respostasRef = ref(db, `survey_responses/${surveyId}`);
    setLoading(true);
    onValue(respostasRef, (snapshot) => {
      const data = snapshot.val();
      setRespostas(data || {});
      setLoading(false);
    });
  }, [surveyId]);

  // Funções para análises
  const calcularEstatisticas = (respostas) => {
    const categorias = {};
    Object.values(respostas).forEach((resposta) => {
      if (resposta.responses) {
        Object.entries(resposta.responses).forEach(([question, answer]) => {
          if (!categorias[question]) categorias[question] = {};
          categorias[question][answer] = (categorias[question][answer] || 0) + 1;
        });
      }
    });

    return { totalRespostas: Object.keys(respostas).length, categorias };
  };

  const estatisticas = calcularEstatisticas(respostas);

  // Função para gerar os dados para gráficos
  const gerarDadosGrafico = (question) => {
    const dados = estatisticas.categorias[question] || {};
    return {
      labels: Object.keys(dados),
      datasets: [
        {
          label: `Distribuição das Respostas para "${question}"`,
          data: Object.values(dados),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };
  };

  // Exportação para XLS
  const exportarXLS = () => {
    const linhas = [];
    Object.entries(respostas).forEach(([userId, resposta]) => {
      const linha = {
        Nome: resposta.company?.nome || userId,
        "Com que frequência você compra online?": resposta.responses["Com que frequência você compra online?"] || '',
        "Quais destes métodos de pagamento você prefere?": resposta.responses["Quais destes métodos de pagamento você prefere?"] || '',
        "Qual é o fator mais importante para você ao escolher um produto?": resposta.responses["Qual é o fator mais importante para você ao escolher um produto?"] || '',
      };
      linhas.push(linha);
    });

    const blob = new Blob(
      [
        "\ufeff" +
          Object.keys(linhas[0])
            .join("\t") +
          "\n" +
          linhas
            .map((linha) => Object.values(linha).join("\t"))
            .join("\n"),
      ],
      { type: "application/vnd.ms-excel" }
    );

    saveAs(blob, `respostas_${surveyId}.xls`);
  };

  // Exportação para PDF
  const exportarPDF = () => {
    const doc = new jsPDF();
    doc.text("Respostas do Inquérito", 10, 10);

    const linhas = Object.entries(respostas).map(([userId, resposta]) => [
      resposta.company?.nome || userId,
      resposta.responses["Com que frequência você compra online?"] || '',
      resposta.responses["Quais destes métodos de pagamento você prefere?"] || '',
      resposta.responses["Qual é o fator mais importante para você ao escolher um produto?"] || '',
    ]);

    autoTable(doc, {
      head: [["Nome", "Frequência de Compra", "Método de Pagamento", "Fator Importante"]],
      body: linhas,
    });

    doc.save(`respostas_${surveyId}.pdf`);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
        Respostas do Inquérito
      </Typography>

      <Button onClick={onBack} variant="outlined" sx={{ marginBottom: 2 }}>
        Voltar
      </Button>

      {loading ? (
        <CircularProgress />
      ) : (
        <Box>
          <Typography variant="h6" gutterBottom>
            Total de Respostas: {estatisticas.totalRespostas}
          </Typography>

          <Button variant="contained" color="primary" onClick={exportarPDF} sx={{ marginRight: 2 }}>
            Exportar PDF
          </Button>
          <Button variant="contained" color="secondary" onClick={exportarXLS}>
            Exportar XLS
          </Button>

          {/* Exibição dos Gráficos */}
          {Object.keys(estatisticas.categorias).map((question, index) => (
            <Box key={index} sx={{ marginBottom: 4 }}>
              <Typography variant="h6" gutterBottom>
                {question}
              </Typography>
              <Box sx={{ display: 'flex', gap: 4 }}>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <Bar data={gerarDadosGrafico(question)} options={{ responsive: true, maintainAspectRatio: false }} />
                </Box>
                <Box sx={{ flex: 1, minWidth: 300 }}>
                  <Pie data={gerarDadosGrafico(question)} options={{ responsive: true, maintainAspectRatio: false }} />
                </Box>
              </Box>
            </Box>
          ))}

          {/* Tabela de Respostas por Empresas */}
          <Box sx={{ marginTop: 4 }}>
            <Typography variant="h6" gutterBottom>
              Respostas por Empresa
            </Typography>

            <TableContainer sx={{ maxHeight: 400 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Empresa</TableCell>
                    <TableCell>Frequência de Compra</TableCell>
                    <TableCell>Método de Pagamento</TableCell>
                    <TableCell>Fator Importante</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {Object.entries(respostas).map(([userId, resposta]) => (
                    <TableRow key={userId}>
                      <TableCell>{resposta.company?.nome || userId}</TableCell>
                      <TableCell>{resposta.responses["Com que frequência você compra online?"] || ''}</TableCell>
                      <TableCell>{resposta.responses["Quais destes métodos de pagamento você prefere?"] || ''}</TableCell>
                      <TableCell>{resposta.responses["Qual é o fator mais importante para você ao escolher um produto?"] || ''}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default VisualizarRespostasDesk;
