import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set, get, push } from 'firebase/database';
import { Snackbar, TextField, Button, Dialog, DialogActions, DialogContent, DialogTitle, Select, MenuItem } from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import { db } from '../../fb';
import BackButton from '../BackButton';

const EditProformaDesk = ({ user }) => {
    const [cliente, setCliente] = useState('');
    const [dataEmissao, setDataEmissao] = useState('');
    const [dataVencimento, setDataVencimento] = useState('');
    const [itens, setItens] = useState([{ descricao: '', quantidade: 1, preco: 0 }]);
    const [errors, setErrors] = useState({});
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('error');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [clientes, setClientes] = useState([]);
    const [produtos, setProdutos] = useState([]);  
    const [selectedProduto, setSelectedProduto] = useState(null);  
    const [isAddingCliente, setIsAddingCliente] = useState(false); 
    const [openModal, setOpenModal] = useState(false);
    const [novoCliente, setNovoCliente] = useState({
        nome: '',
        email: '',
        telefone: '',
        endereco: '',
        nuit: '',
        empresa: '',
        notas: '',
    });

    useEffect(() => {
        fetchClientes();
        fetchProdutos();  
    }, []);

    const fetchClientes = async () => {
        const clientesRef = ref(db, `clientes/${user.id}`);
        const snapshot = await get(clientesRef);
        const data = snapshot.val();
        if (data) {
            setClientes(Object.values(data));
        }
    };

    const fetchProdutos = async () => {
        const produtosRef = ref(db, `stores/${user.id}/products`);
        const snapshot = await get(produtosRef);
        const data = snapshot.val();
        if (data) {
            setProdutos(Object.values(data)); 
        }
    };

    const handleAddItemFromStore = () => {
        if (!selectedProduto) {
            setSnackbarMessage('Selecione um produto para adicionar.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        const item = {
            descricao: selectedProduto.name,
            quantidade: 1,
            preco: selectedProduto.price,
        };
        setItens([...itens, item]);  
        setSelectedProduto(null);  
    };

    const handleAddItem = () => {
        setItens([...itens, { descricao: '', quantidade: 1, preco: 0 }]);
    };

    const handleRemoveItem = (index) => {
        const newItens = itens.filter((_, i) => i !== index);
        setItens(newItens);
    };

    const handleItemChange = (index, field, value) => {
        const newItens = [...itens];
        newItens[index][field] = value;
        setItens(newItens);
    };

    const total = itens.reduce((sum, item) => sum + item.quantidade * item.preco, 0);

    const validateForm = () => {
        const newErrors = {};

        if (!dataEmissao) {
            newErrors.dataEmissao = 'Data de emissão é obrigatória';
        }

        if (!dataVencimento) {
            newErrors.dataVencimento = 'Data de vencimento é obrigatória';
        }

        itens.forEach((item, index) => {
            if (!item.descricao) {
                newErrors[`item-descricao-${index}`] = 'Descrição é obrigatória';
            }
            if (item.quantidade <= 0) {
                newErrors[`item-quantidade-${index}`] = 'Quantidade deve ser maior que 0';
            }
            if (item.preco <= 0) {
                newErrors[`item-preco-${index}`] = 'Preço deve ser maior que 0';
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSalvar = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setSnackbarMessage('Erro: Campos obrigatórios não preenchidos.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        setLoading(true);
        try {
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = String(today.getFullYear()).slice(-2);
            
            const proformaRef = ref(db, `invoices/${user.id}`);
            const snapshot = await get(proformaRef);
            const proformas = snapshot.val();
            const proformaCount = proformas ? Object.keys(proformas).length : 0;

            const sequentialNumber = String(proformaCount + 1).padStart(2, '0');
            const numeroProforma = `PF${day}${month}${year}${sequentialNumber}`;

            const newProformaRef = ref(db, `invoices/${user.id}/${numeroProforma}`);
            await set(newProformaRef, {
                numeroProforma,
                cliente,
                dataEmissao,
                dataVencimento,
                itens,
                total,
                status: 'POR PAGAR',
            });

            setSnackbarMessage('Proforma criada com sucesso!');
            setSnackbarSeverity('success');
            navigate('/faturacao');
        } catch (err) {
            console.error(err);
            setSnackbarMessage('Erro ao salvar a proforma. Tente novamente.');
            setSnackbarSeverity('error');
        } finally {
            setLoading(false);
            setOpenSnackbar(true);
        }
    };

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    const handleOpenModal = () => {
    setOpenModal(true);  
};

const handleCloseModal = () => {
    setOpenModal(false); 
};


    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-semibold mb-6">Criar Nova Proforma</h1>
            <BackButton sx={{ mb: 2 }} />

            <form onSubmit={handleSalvar} className="space-y-6">
                <div>
                    <label className="block text-gray-700">Cliente (Opcional)</label>
                    <div className="flex items-center space-x-2">
                        <select
                            value={cliente}
                            onChange={(e) => setCliente(e.target.value)}
                            className="w-full p-2 border rounded"
                        >
                            <option value="">Selecione um cliente</option>
                            {clientes.map((c, index) => (
                                <option key={index} value={c.nome}>
                                    {c.nome}
                                </option>
                            ))}
                        </select>
                        <Button onClick={handleOpenModal} variant="contained" color="primary">
                            Cliente +
                        </Button>
                    </div>
                </div>

                <div className="flex space-x-4">
                    <div className="flex-1">
                        <label className="block text-gray-700">Data de Emissão</label>
                        <input
                            type="date"
                            value={dataEmissao}
                            onChange={(e) => setDataEmissao(e.target.value)}
                            className={`w-full p-2 border rounded ${errors.dataEmissao ? 'border-red-500' : ''}`}
                        />
                        {errors.dataEmissao && <p className="text-red-500">{errors.dataEmissao}</p>}
                    </div>

                    <div className="flex-1">
                        <label className="block text-gray-700">Valido Por</label>
                        <input
                            type="number"
                            value={dataVencimento}
                            onChange={(e) => setDataVencimento(e.target.value)}
                            className={`w-full p-2 border rounded ${errors.dataVencimento ? 'border-red-500' : ''}`}
                        />
                        {errors.dataVencimento && <p className="text-red-500">{errors.dataVencimento}</p>}
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">Adicionar Item da Loja</h3>
                    <Select
                        value={selectedProduto}
                        onChange={(e) => setSelectedProduto(e.target.value)}
                        fullWidth
                    >
                        <MenuItem value="">Selecione um produto</MenuItem>
                        {produtos.map((produto) => (
                            <MenuItem key={produto.id} value={produto}>
                                {produto.name} - {produto.price} MZN
                            </MenuItem>
                        ))}
                    </Select>
                    <Button onClick={handleAddItemFromStore} className="mt-2" variant="contained" color="secondary">
                        Adicionar Produto
                    </Button>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">Itens</h3>
                    <table className="min-w-full table-auto border-collapse border">
                        <thead>
                            <tr>
                                <th className="border p-2 text-left">Descrição</th>
                                <th className="border p-2 text-left">Quantidade</th>
                                <th className="border p-2 text-left">Preço Unitário</th>
                                <th className="border p-2 text-left">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {itens.map((item, index) => (
                                <tr key={index}>
                                    <td className="border p-2">
                                        <input
                                            type="text"
                                            value={item.descricao}
                                            onChange={(e) => handleItemChange(index, 'descricao', e.target.value)}
                                            className={`w-full p-2 border rounded ${errors[`item-descricao-${index}`] ? 'border-red-500' : ''}`}
                                            placeholder="Descrição do item"
                                        />
                                        {errors[`item-descricao-${index}`] && (
                                            <p className="text-red-500">{errors[`item-descricao-${index}`]}</p>
                                        )}
                                    </td>
                                    <td className="border p-2">
                                        <input
                                            type="number"
                                            value={item.quantidade}
                                            onChange={(e) => handleItemChange(index, 'quantidade', parseInt(e.target.value))}
                                            className={`w-full p-2 border rounded ${errors[`item-quantidade-${index}`] ? 'border-red-500' : ''}`}
                                        />
                                        {errors[`item-quantidade-${index}`] && (
                                            <p className="text-red-500">{errors[`item-quantidade-${index}`]}</p>
                                        )}
                                    </td>
                                    <td className="border p-2">
                                        <input
                                            type="number"
                                            value={item.preco}
                                            onChange={(e) => handleItemChange(index, 'preco', parseFloat(e.target.value))}
                                            className={`w-full p-2 border rounded ${errors[`item-preco-${index}`] ? 'border-red-500' : ''}`}
                                        />
                                        {errors[`item-preco-${index}`] && (
                                            <p className="text-red-500">{errors[`item-preco-${index}`]}</p>
                                        )}
                                    </td>
                                    <td className="border p-2 text-center">
                                        <button type="button" onClick={() => handleRemoveItem(index)} className="text-red-600">Remover</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="mt-4 p-2 bg-blue-600 text-white rounded"
                    >
                        Adicionar Item Manualmente
                    </button>
                </div>

                <div>
                    <h3 className="text-lg font-semibold mb-4">Total: {total} MZN</h3>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? 'Criando...' : 'Criar Proforma'}
                    </Button>
                </div>
            </form>

            <Dialog open={openModal} onClose={handleCloseModal}>
    <DialogTitle>Cadastrar Novo Cliente</DialogTitle>
    <DialogContent>
        <TextField
            label="Nome"
            value={novoCliente.nome}
            onChange={(e) => setNovoCliente({ ...novoCliente, nome: e.target.value })}
            fullWidth
            margin="normal"
        />
        <TextField
            label="Email"
            value={novoCliente.email}
            onChange={(e) => setNovoCliente({ ...novoCliente, email: e.target.value })}
            fullWidth
            margin="normal"
        />
        <TextField
            label="Telefone"
            value={novoCliente.telefone}
            onChange={(e) => setNovoCliente({ ...novoCliente, telefone: e.target.value })}
            fullWidth
            margin="normal"
        />
        <TextField
            label="Endereço"
            value={novoCliente.endereco}
            onChange={(e) => setNovoCliente({ ...novoCliente, endereco: e.target.value })}
            fullWidth
            margin="normal"
        />
        <TextField
            label="Nuit"
            value={novoCliente.nuit}
            onChange={(e) => setNovoCliente({ ...novoCliente, nuit: e.target.value })}
            fullWidth
            margin="normal"
        />
        <TextField
            label="Empresa"
            value={novoCliente.empresa}
            onChange={(e) => setNovoCliente({ ...novoCliente, empresa: e.target.value })}
            fullWidth
            margin="normal"
        />
        <TextField
            label="Notas"
            value={novoCliente.notas}
            onChange={(e) => setNovoCliente({ ...novoCliente, notas: e.target.value })}
            fullWidth
            margin="normal"
        />
    </DialogContent>
    <DialogActions>
        <Button onClick={handleCloseModal} color="primary">
            Fechar
        </Button>
        <Button
            onClick={async () => {
                const clienteRef = ref(db, `clientes/${user.id}`);
                const clienteId = push(clienteRef).key;
                await set(ref(db, `clientes/${user.id}/${clienteId}`), novoCliente);
                setClientes([...clientes, novoCliente]);
                setOpenModal(false);
            }}
            color="primary"
        >
            Salvar
        </Button>
        </DialogActions>
    </Dialog>
            <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={handleCloseSnackbar}>
                <MuiAlert onClose={handleCloseSnackbar} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </MuiAlert>
            </Snackbar>
        </div>
    );
};

export default EditProformaDesk;
