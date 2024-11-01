import React, { useState } from 'react';
import { getDatabase, ref, set, get } from 'firebase/database';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'; // Importando funções de autenticação
import { Snackbar, Alert } from '@mui/material'; // Importar componentes de Snackbar e Alert

const CadastroEmpresa = ({ companyId = null, initialData = {} }) => {
  const [nome, setNome] = useState(initialData.nome || '');
  const [designacao, setDesignacao] = useState(initialData.designacao || '');
  const [endereco, setEndereco] = useState(initialData.endereco || '');
  const [provincia, setProvincia] = useState(initialData.provincia || 'Cabo Delgado');
  const [contacto, setContacto] = useState(initialData.contacto || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [descricao, setDescricao] = useState(initialData.descricao || '');
  const [sector, setSector] = useState(initialData.sector || 'Outras actividades');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' ou 'error'

  const db = getDatabase();
  const auth = getAuth();

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const senhaGerada = Math.random().toString(36).slice(-8); // Gerando senha aleatória

    const companyData = {
      nome,
      endereco,
      provincia,
      contacto,
      email,
      descricao,
      sector,
      password:senhaGerada,
      logoUrl: initialData.logoUrl || '',
      social: initialData.social || {},
      subscription: initialData.subscription || {},
    };

    try {
      // Verifica se a empresa já existe
      const existingCompanySnapshot = await get(ref(db, `company`));
      const existingCompanies = existingCompanySnapshot.val();

      const isCompanyExists = existingCompanies && Object.values(existingCompanies).some(company => company.email === email);

      if (isCompanyExists) {
        setSnackbarMessage('Uma empresa com este e-mail já está cadastrada.');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
        return;
      }

      if (companyId) {
        // Atualizar empresa existente
        await set(ref(db, `company/${companyId}`), companyData);
      } else {
        // Criar um novo usuário no Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, senhaGerada);
        const userId = userCredential.user.uid;

        // Criar uma nova empresa com o UID do usuário como ID da empresa
        await set(ref(db, `company/${userId}`), { ...companyData, id: userId, userId });
      }

      // Limpar os dados do formulário
      setNome('');
      setDesignacao('');
      setEndereco('');
      setProvincia('Cabo Delgado');
      setContacto('');
      setEmail('');
      setDescricao('');
      setSector('Outras actividades');

      setSnackbarMessage('Dados da empresa salvos com sucesso! A senha foi gerada automaticamente.');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

    } catch (error) {
      console.error('Erro ao salvar os dados:', error);
      setSnackbarMessage('Ocorreu um erro ao salvar os dados.');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Nome da Empresa</label>
          <input 
            type="text" 
            value={nome} 
            onChange={(e) => setNome(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" 
            required 
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Endereço</label>
          <input 
            type="text" 
            value={endereco} 
            onChange={(e) => setEndereco(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" 
            required 
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Província</label>
          <select 
            value={provincia} 
            onChange={(e) => setProvincia(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            required
          >
            <option value="Niassa">Niassa</option>
            <option value="Cabo Delgado">Cabo Delgado</option>
            <option value="Nampula">Nampula</option>
            <option value="Zambézia">Zambézia</option>
            <option value="Tete">Tete</option>
            <option value="Manica">Manica</option>
            <option value="Sofala">Sofala</option>
            <option value="Inhambane">Inhambane</option>
            <option value="Gaza">Gaza</option>
            <option value="Maputo">Maputo</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Sector de Actividade</label>
          <select 
            value={sector} 
            onChange={(e) => setSector(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            required
          >
            <option value="Actividades Administrativas e Serviços de Apoio">Actividades Administrativas e Serviços de Apoio</option>
            <option value="Actividades Artísticas, de Espectáculos, Desportivas e Recreativas">Actividades Artísticas, de Espectáculos, Desportivas e Recreativas</option>
            <option value="Actividades de Saúde Humana e Apoio Social">Actividades de Saúde Humana e Apoio Social</option>
            <option value="Actividades Financeiras e de Seguros">Actividades Financeiras e de Seguros</option>
            <option value="Agricultura, Produção Animal, Caça, Floresta e Pesca">Agricultura, Produção Animal, Caça, Floresta e Pesca</option>
            <option value="Alojamento, Restauração e Similares">Alojamento, Restauração e Similares</option>
            <option value="Captação, Tratamento e Distribuição de Água, Saneamento, Gestão de Resíduos e Despoluição">Captação, Tratamento e Distribuição de Água, Saneamento, Gestão de Resíduos e Despoluição</option>
            <option value="Comércio por Grosso ou Retalho">Comércio por Grosso ou Retalho</option>
            <option value="Construção">Construção</option>
            <option value="Consultoria, Científicas, Técnicas e Similares">Consultoria, Científicas, Técnicas e Similares</option>
            <option value="Educação">Educação</option>
            <option value="Electricidade, Gás, Vapor, Água Quente e Fria e Ar Frio">Electricidade, Gás, Vapor, Água Quente e Fria e Ar Frio</option>
            <option value="Imobiliária">Imobiliária</option>
            <option value="Indústrias Extractivas">Indústrias Extractivas</option>
            <option value="Informação e Comunicação">Informação e Comunicação</option>
            <option value="Outras Actividades de Serviços">Outras Actividades de Serviços</option>
            <option value="Reparação de Veículos Automóveis e Motociclos">Reparação de Veículos Automóveis e Motociclos</option>
            <option value="Transportes e Armazenagem">Transportes e Armazenagem</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Contacto</label>
          <input 
            type="text" 
            value={contacto} 
            onChange={(e) => setContacto(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" 
            required 
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">E-mail</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm" 
            required 
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Descrição</label>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
            required
          />
        </div>

        <button 
          type="submit" 
          className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
        >
          Salvar Empresa
        </button>
      </form>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default CadastroEmpresa;
