import React, { useState } from "react";
import { TextField } from "@mui/material";

// Utilitário simples para converter números até 99999 em português
const numeroPorExtenso = (valor) => {
  const n2words = require('n2words');
  if (!valor) return '';
  return n2words(Number(valor), { lang: 'pt-br' }) + ' meticais';
};

const CampoValor = () => {
  const [formData, setFormData] = useState({ maxProposals: '' });

  const handleChange = (e) => {
    let rawValue = e.target.value.replace(/[^\d]/g, ''); // remover não-dígitos
    const number = Number(rawValue);
    if (isNaN(number)) return;

    // Formatar como 10,000.00
    const formatted = new Intl.NumberFormat('pt-PT', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(number / 100);

    setFormData(prev => ({
      ...prev,
      maxProposals: formatted
    }));
  };

  // Extrair valor puro para extenso
  const valorNumerico = parseFloat(formData.maxProposals.replace(/\./g, '').replace(',', '.')) || 0;

  return (
    <TextField
      label="Valor Máximo de Propostas (MT)"
      value={formData.maxProposals}
      onChange={handleChange}
      fullWidth
      inputProps={{ inputMode: "numeric" }}
      helperText={valorNumerico > 0 ? numeroPorExtenso(valorNumerico) : "Defina o valor máximo que está disposto a pagar"}
    />
  );
};

export default CampoValor;
