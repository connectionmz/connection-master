require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');

const app = express();

app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000' 
}));
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MPESA_ENDPOINT = process.env.MPESA_ENDPOINT || 'https://api.vm.co.mz:18352/ipg/v1x/c2bPayment/singleStage/';
const SERVICE_PROVIDER_CODE = process.env.SERVICE_PROVIDER_CODE || '902444';

app.post('/pagar', async (req, res) => {
  try {
    const { amount, phoneNumber,reference } = req.body;

    if (!amount || !phoneNumber) {
      return res.status(400).json({ 
        error: 'Campos obrigatórios faltando',
        details: 'amount e phoneNumber são necessários' 
      });
    }

    const payload = {
      input_TransactionReference: "Modulo "+reference.toUpperCase(),
      input_CustomerMSISDN: phoneNumber.startsWith('258') ? phoneNumber : `258${phoneNumber.replace(/^0/, '')}`,
      input_Amount: amount.toString(),
      input_ThirdPartyReference: reference.toUpperCase(),
      input_ServiceProviderCode: SERVICE_PROVIDER_CODE
    };

    const apiClient = axios.create({
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 60000
    });

    const response = await apiClient.post(MPESA_ENDPOINT, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer GXOcbRUzppWdOoWY5pRumfXGdHPHB3io8KvEb7sGiBCMLUVdy7Gl5QvgAFqRKhLFedZQ6Og3j8ATB+scbYr1KZ6mTVmWo9g6RmToO71LWKf2pTwnUmAJTXNrVxZPJ7NqZuf4OoaVWSMbxljm9lfYAOTrKdN8r9Cx3cEz6pjUdbIYBrhii5Hpr9AJyCBjTDshKNuc7foS04vMNty1jje1dOXRJHozwTrBJYGBvRXpsHZ0dnJYGWK7wSzUWll/phwGh+nozEsE2UbB+D9UEK4/jYMsBvXvSLtuORgCmNFFAOwwv78APw10mrxXnExoQbSj7y8QFLwc35ou3BdyYcm4BHp/4gARgylXVU7obsD1C2u5yGNnvMvldCOpBwPwhJDd1XOlg6Nje9xzo+a7U5/ohsSg73Oxf2t2EMEEGwIfIw78R2MLKq4PslcCkWNr58RQSQ7UUnuwz7rSOW/IBaC6iSB2Pl/723+XOiJZOnySxSrvfjImizavgVl80V3uVq0FgYXFw1IqB3oZsIUGvPXUcFomMaOHFQmE30HOO5CM8HvTK6DeoKYV9UyiNuejk6gEPf4oaJgTno6qQ9wfWmI6TuXXSA/XANNutuI+g2TdIVPWcOrc+moeg5qrA1bM0tYyzUg3JqvIJ6W7WmgOvWurXD/mz+3cv+kEfbUC0Pl1oSQ=`,
        'Origin': 'developer.mpesa.vm.co.mz'
      }
    });

    res.status(200).json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error('Erro na API M-Pesa:', error.message);
    
    res.status(error.response?.status || 500).json({
      success: false,
      error: error.message,
      details: error.response?.data || 'Erro desconhecido'
    });
  }
});

app.get('/', (req, res) => {
  res.send('Backend M-Pesa está funcionando');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Endpoint de pagamento: http://localhost:${PORT}/pagar`);
});