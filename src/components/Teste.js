import React from 'react';
import axios from 'axios';

const Teste = () => {
  const fazerPagamento = async () => {
    try {
      const paymentData = {
        amount: '10', // Valor mínimo para testes
        phoneNumber: '258840237100', // Número de teste
        reference: 'TEST' + Math.floor(Math.random() * 10000)
      };

      console.log('Initiating payment:', paymentData);
      
      const resposta = await axios.post('http://localhost:5000/pagar', paymentData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 15000 // 15 segundos de timeout
      });

      console.log('Payment response:', resposta.data);
      
      if (resposta.data.success) {
        alert(`✅ Pagamento enviado com sucesso!\nReferência: ${paymentData.reference}`);
      } else {
        alert(`⚠️ Pagamento falhou: ${resposta.data.message}`);
      }

    } catch (erro) {
      console.error('Full error:', erro);
      
      let errorMessage = 'Erro ao processar pagamento';
      
      if (erro.response) {
        console.error('Response data:', erro.response.data);
        console.error('Status code:', erro.response.status);
        errorMessage = erro.response.data?.message || errorMessage;
      } else if (erro.request) {
        console.error('No response received');
        errorMessage = 'Servidor não respondeu. Tente novamente.';
      } else {
        console.error('Request setup error:', erro.message);
        errorMessage = erro.message;
      }
      
      alert(`❌ ${errorMessage}`);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '500px', 
      margin: '0 auto',
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h2 style={{ color: '#2c3e50' }}>Teste de Pagamento M-Pesa</h2>
      <p style={{ marginBottom: '20px', color: '#7f8c8d' }}>
        Clique no botão abaixo para simular um pagamento de 10 MZN
      </p>
      <button 
        onClick={fazerPagamento}
        style={{
          padding: '12px 24px',
          backgroundColor: '#27ae60',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          transition: 'background-color 0.3s'
        }}
        onMouseOver={(e) => e.target.style.backgroundColor = '#2ecc71'}
        onMouseOut={(e) => e.target.style.backgroundColor = '#27ae60'}
      >
        Enviar Pagamento de Teste
      </button>
    </div>
  );
};

export default Teste;