import React, { useState } from 'react';
import axios from 'axios';

const TesteMpesa = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [testType, setTestType] = useState('');

  // 1. Testar Backend Básico
  const testarBackend = async () => {
    setLoading(true);
    setTestType('backend');
    setError(null);
    setResult(null);

    try {
      const response = await axios.get('http://localhost:5000/');
      setResult(response.data);
    } catch (err) {
      setError({ message: 'Backend offline!', details: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 2. Verificar Credenciais
  const verificarCredenciais = async () => {
    setLoading(true);
    setTestType('credenciais');
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:5000/verificar-credenciais');
      setResult(response.data);
    } catch (err) {
      setError({ 
        message: 'Erro ao verificar credenciais', 
        details: err.response?.data || err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  // 3. Testar Conexão Básica
  const testarConexao = async () => {
    setLoading(true);
    setTestType('conexao');
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:5000/testar-conexao');
      setResult(response.data);
    } catch (err) {
      setError({ 
        message: 'Erro de conexão com M-Pesa', 
        details: err.response?.data || err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  // 4. Teste Completo de Autenticação
  const testarAuthCompleto = async () => {
    setLoading(true);
    setTestType('auth-completo');
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:5000/testar-auth-completo');
      setResult(response.data);
    } catch (err) {
      setError({ 
        message: 'Falha na autenticação M-Pesa', 
        details: err.response?.data || err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  // 5. Pagamento Simulado
  const fazerPagamentoSimulado = async () => {
    setLoading(true);
    setTestType('pagamento-simulado');
    setError(null);
    setResult(null);

    try {
      const response = await axios.post('http://localhost:5000/pagar-simulado', {
        amount: 10,
        reference: `SIM_${Date.now()}`
      });
      setResult(response.data);
    } catch (err) {
      setError({ 
        message: 'Erro no pagamento simulado', 
        details: err.response?.data || err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  // 6. Debug Variáveis de Ambiente
  const debugEnv = async () => {
    setLoading(true);
    setTestType('debug-env');
    setError(null);
    setResult(null);

    try {
      const response = await axios.get('http://localhost:5000/debug-env');
      setResult(response.data);
    } catch (err) {
      setError({ 
        message: 'Erro ao debug', 
        details: err.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '700px', margin: '0 auto', fontFamily: 'Arial' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50', marginBottom: '10px' }}>🔧 Diagnóstico M-Pesa</h1>
      <p style={{ textAlign: 'center', color: '#7f8c8d', marginBottom: '30px' }}>
        Teste em ordem para identificar problemas
      </p>
      
      <div style={{ 
        background: '#fff3cd', 
        padding: '15px', 
        borderRadius: '8px', 
        marginBottom: '25px', 
        border: '1px solid #ffeaa7' 
      }}>
        <p style={{ margin: 0, color: '#856404', fontSize: '14px' }}>
          <strong>⚠️ IMPORTANTE:</strong> Execute os testes em ordem sequencial para diagnosticar o problema
        </p>
      </div>

      {/* Grid de Botões */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px', 
        marginBottom: '25px' 
      }}>
        <TestButton 
          onClick={testarBackend}
          loading={loading}
          number="1"
          title="Testar Backend"
          description="Verifica se o servidor está online"
          color="#3498db"
        />
        
        <TestButton 
          onClick={verificarCredenciais}
          loading={loading}
          number="2"
          title="Verificar Credenciais"
          description="Analisa API Key e Public Key"
          color="#9b59b6"
        />
        
        <TestButton 
          onClick={testarConexao}
          loading={loading}
          number="3"
          title="Testar Conexão"
          description="Conexão básica com M-Pesa"
          color="#e67e22"
        />
        
        <TestButton 
          onClick={testarAuthCompleto}
          loading={loading}
          number="4"
          title="Testar Autenticação"
          description="Teste completo de auth"
          color="#f39c12"
        />
        
        <TestButton 
          onClick={fazerPagamentoSimulado}
          loading={loading}
          number="5"
          title="Pagamento Simulado"
          description="Simulação sem M-Pesa"
          color="#27ae60"
        />
        
        <TestButton 
          onClick={debugEnv}
          loading={loading}
          number="6"
          title="Debug Env"
          description="Ver variáveis de ambiente"
          color="#95a5a6"
        />
      </div>

      {/* Loading */}
      {loading && <Loading testType={testType} />}
      
      {/* Resultado */}
      {result && <Result result={result} />}
      
      {/* Erro */}
      {error && <Error error={error} />}

      {/* Instruções */}
      <div style={{ 
        marginTop: '30px', 
        padding: '15px', 
        background: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <h4 style={{ color: '#495057', marginBottom: '10px' }}>📋 Ordem Recomendada:</h4>
        <ol style={{ color: '#6c757d', margin: 0, paddingLeft: '20px' }}>
          <li><strong>Testar Backend</strong> - Verifique se o servidor local está rodando</li>
          <li><strong>Verificar Credenciais</strong> - Confirme se API Key e Public Key estão configuradas</li>
          <li><strong>Testar Conexão</strong> - Verifique conectividade com servidor M-Pesa</li>
          <li><strong>Testar Autenticação</strong> - Teste completo com credenciais</li>
          <li><strong>Pagamento Simulado</strong> - Use para desenvolvimento</li>
        </ol>
      </div>
    </div>
  );
};

// Componente de Botão de Teste
const TestButton = ({ onClick, loading, number, title, description, color }) => (
  <button 
    onClick={onClick}
    disabled={loading}
    style={{
      padding: '15px 12px',
      background: loading ? '#bdc3c7' : color,
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      cursor: loading ? 'not-allowed' : 'pointer',
      fontWeight: 'bold',
      textAlign: 'left',
      minHeight: '80px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      transition: 'all 0.3s ease'
    }}
    onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
    onMouseOut={(e) => !loading && (e.target.style.transform = 'translateY(0)')}
  >
    <div style={{ fontSize: '16px', marginBottom: '5px' }}>
      {number}️⃣ {title}
    </div>
    <div style={{ fontSize: '11px', opacity: 0.9, fontWeight: 'normal' }}>
      {description}
    </div>
  </button>
);

// Componente Loading
const Loading = ({ testType }) => {
  const messages = {
    'backend': 'Testando servidor backend...',
    'credenciais': 'Analisando credenciais M-Pesa...',
    'conexao': 'Testando conexão com M-Pesa...',
    'auth-completo': 'Testando autenticação completa...',
    'pagamento-simulado': 'Processando pagamento simulado...',
    'debug-env': 'Verificando variáveis de ambiente...'
  };

  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      background: '#e3f2fd', 
      borderRadius: '8px',
      marginBottom: '20px'
    }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        border: '4px solid #f3f3f3',
        borderTop: '4px solid #3498db',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        margin: '0 auto 10px'
      }}></div>
      <p style={{ margin: 0, color: '#3498db', fontWeight: 'bold' }}>
        {messages[testType] || 'Processando...'}
      </p>
    </div>
  );
};

// Componente Resultado
const Result = ({ result }) => (
  <div style={{ 
    padding: '20px', 
    background: '#d4edda', 
    border: '2px solid #28a745', 
    borderRadius: '8px',
    marginBottom: '20px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
      <span style={{ 
        fontSize: '24px', 
        marginRight: '10px' 
      }}>✅</span>
      <h3 style={{ 
        color: '#155724', 
        margin: 0 
      }}>
        Sucesso!
      </h3>
    </div>
    <pre style={{ 
      background: 'white', 
      padding: '15px', 
      borderRadius: '6px',
      overflow: 'auto',
      fontSize: '12px',
      margin: 0,
      maxHeight: '400px',
      border: '1px solid #c3e6cb'
    }}>
      {JSON.stringify(result, null, 2)}
    </pre>
  </div>
);

// Componente Erro
const Error = ({ error }) => (
  <div style={{ 
    padding: '20px', 
    background: '#f8d7da', 
    border: '2px solid #dc3545', 
    borderRadius: '8px',
    marginBottom: '20px'
  }}>
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
      <span style={{ 
        fontSize: '24px', 
        marginRight: '10px' 
      }}>❌</span>
      <h3 style={{ 
        color: '#721c24', 
        margin: 0 
      }}>
        {error.message}
      </h3>
    </div>
    
    {error.details && (
      <pre style={{ 
        background: 'white', 
        padding: '15px', 
        borderRadius: '6px',
        overflow: 'auto',
        fontSize: '12px',
        margin: 0,
        maxHeight: '400px',
        border: '1px solid #f5c6cb'
      }}>
        {JSON.stringify(error.details, null, 2)}
      </pre>
    )}
  </div>
);

// Estilos globais
const styles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Adicionar estilos ao documento
const styleSheet = document.createElement("style");
styleSheet.innerText = styles;
document.head.appendChild(styleSheet);

export default TesteMpesa;