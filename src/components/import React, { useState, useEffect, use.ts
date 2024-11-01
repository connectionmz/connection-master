import React, { useState, useEffect, useCallback } from 'react';
import { ref, get, push } from 'firebase/database';
import { db, auth } from '../fb';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

const Faturacao = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState('');
  const [newCliente, setNewCliente] = useState({ nome: '', endereco: '', nuit: '' });
  const [servicos, setServicos] = useState([{ descricao: '', quantidade: 1, preco: 0 }]);
  const [subtotal, setSubtotal] = useState(0);
  const [iva, setIva] = useState(0);
  const [total, setTotal] = useState(0);
  const [user, setUser] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const clientesRef = ref(db, 'company');
        const snapshot = await get(clientesRef);
        if (snapshot.exists()) {
          setClientes(Object.values(snapshot.val()));
        } else {
          setClientes([]);
        }
      } catch (err) {
        setError('Erro ao carregar clientes.');
      }
    };

    if (user) {
      fetchClientes();
    }
  }, [user]);

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        const invoicesRef = ref(db, `invoices/${user}`);
        const snapshot = await get(invoicesRef);
        if (snapshot.exists()) {
          setInvoices(Object.values(snapshot.val()));
        } else {
          setInvoices([]);
        }
      } catch (err) {
        setError('Erro ao carregar faturas.');
      }
    };

    if (user) {
      fetchInvoices();
    }
  }, [user]);

  useEffect(() => {
    const subtotalValue = servicos.reduce((acc, servico) => acc + servico.quantidade * servico.preco, 0);
    const ivaValue = subtotalValue * 0.17;
    const totalValue = subtotalValue + ivaValue;

    setSubtotal(subtotalValue);
    setIva(ivaValue);
    setTotal(totalValue);
  }, [servicos]);

  const handleAddServico = () => {
    setServicos([...servicos, { descricao: '', quantidade: 1, preco: 0 }]);
  };

  const handleRemoveServico = useCallback(
    (index) => {
      const updatedServicos = [...servicos];
      updatedServicos.splice(index, 1);
      setServicos(updatedServicos);
    },
    [servicos]
  );

  const generateInvoiceNumber = () => `INV-${Date.now()}`;

  const handleSaveInvoice = async () => {
    const invoiceNumber = generateInvoiceNumber();
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString();

    const invoiceData = {
      numeroFatura: invoiceNumber,
      data: formattedDate,
      cliente: selectedCliente || newCliente.nome,
      endereco: newCliente.endereco || 'Endereço não fornecido',
      nuit: newCliente.nuit || 'N/A',
      servicos,
      subtotal,
      iva,
      total,
      user: user,
    };

    try {
      const invoicesRef = ref(db, `invoices/${user}`);
      const newInvoiceRef = await push(invoicesRef, invoiceData);

      setSelectedCliente('');
      setNewCliente({ nome: '', endereco: '', nuit: '' });
      setServicos([{ descricao: '', quantidade: 1, preco: 0 }]);
      setSubtotal(0);
      setIva(0);
      setTotal(0);

      navigate(`/faturas/${newInvoiceRef.key}`);
    } catch (err) {
      setError('Erro ao salvar a fatura.');
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.numeroFatura.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-4 bg-white shadow-lg rounded-md">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Faturação</h1>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2 text-gray-700">Cliente</h2>
        <select
          className="w-full p-2 border rounded-md mb-4"
          value={selectedCliente}
          onChange={(e) => setSelectedCliente(e.target.value)}
        >
          <option value="">Selecione um cliente</option>
          {clientes.map((cliente, index) => (
            <option key={index} value={cliente.nome}>{cliente.nome}</option>
          ))}
        </select>

        <h3 className="text-md font-semibold text-gray-600 mb-2">Ou adicione manualmente:</h3>
        <input
          type="text"
          className="w-full p-2 border rounded-md mb-2"
          placeholder="Nome do Cliente"
          value={newCliente.nome}
          onChange={(e) => setNewCliente({ ...newCliente, nome: e.target.value })}
        />
        <input
          type="text"
          className="w-full p-2 border rounded-md mb-2"
          placeholder="Endereço"
          value={newCliente.endereco}
          onChange={(e) => setNewCliente({ ...newCliente, endereco: e.target.value })}
        />
        <input
          type="text"
          className="w-full p-2 border rounded-md"
          placeholder="NUIT"
          value={newCliente.nuit}
          onChange={(e) => setNewCliente({ ...newCliente, nuit: e.target.value })}
        />
      </div>

      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-700">Serviços</h2>
        {servicos.map((servico, index) => (
          <div key={index} className="grid grid-cols-4 gap-4 mb-4">
            <input
              type="text"
              className="p-2 border rounded-md"
              placeholder="Descrição"
              value={servico.descricao}
              onChange={(e) => {
                const updatedServicos = [...servicos];
                updatedServicos[index].descricao = e.target.value;
                setServicos(updatedServicos);
              }}
            />
            <input
              type="number"
              className="p-2 border rounded-md"
              placeholder="Quantidade"
              value={servico.quantidade}
              onChange={(e) => {
                const updatedServicos = [...servicos];
                updatedServicos[index].quantidade = parseFloat(e.target.value);
                setServicos(updatedServicos);
              }}
            />
            <input
              type="number"
              className="p-2 border rounded-md"
              placeholder="Preço Unitário"
              value={servico.preco}
              onChange={(e) => {
                const updatedServicos = [...servicos];
                updatedServicos[index].preco = parseFloat(e.target.value);
                setServicos(updatedServicos);
              }}
            />
            <button
              className="bg-red-500 text-white p-2 rounded-md"
              onClick={() => handleRemoveServico(index)}
            >
              Remover
            </button>
          </div>
        ))}
        <button
          className="bg-blue-500 text-white py-2 px-4 rounded-md"
          onClick={handleAddServico}
        >
          Adicionar Serviço
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Subtotal: {subtotal.toFixed(2)} MZN</h3>
        <h3 className="text-lg font-semibold text-gray-800">IVA (17%): {iva.toFixed(2)} MZN</h3>
        <h2 className="text-xl font-bold text-gray-800">Total: {total.toFixed(2)} MZN</h2>
      </div>

      <button
        className="bg-green-500 text-white py-2 px-6 rounded-md"
        onClick={handleSaveInvoice}
      >
        Salvar Fatura
      </button>

      <div className="mt-6">
        <input
          type="text"
          className="w-full p-2 border rounded-md"
          placeholder="Procurar Faturas"
          value={searchQuery}
          onChange={handleSearch}
        />
      </div>

      <div className="mt-4">
        <h2 className="text-xl font-semibold mb-4">Faturas Recentes</h2>
        <ul>
          {filteredInvoices.map((invoice, index) => (
            <li key={index} className="p-2 border-b">
              {invoice.numeroFatura} - {invoice.cliente} - {invoice.total} MZN
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Faturacao;
