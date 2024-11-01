import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ref, set, get } from 'firebase/database';
import { db } from '../fb'; // Caminho correto para o Firebase
import { Snackbar } from '@mui/material'; // Import do Snackbar
import MuiAlert from '@mui/material/Alert'; // Import do MuiAlert

const CriarProforma = ({ user }) => {
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

    useEffect(() => {
        // Aqui você pode carregar os clientes da base de dados
        // Exemplo: fetchClientes();
    }, []);

    // Adicionar um novo item à lista
    const handleAddItem = () => {
        setItens([...itens, { descricao: '', quantidade: 1, preco: 0 }]);
    };

    // Remover um item da lista
    const handleRemoveItem = (index) => {
        const newItens = itens.filter((_, i) => i !== index);
        setItens(newItens);
    };

    // Atualizar o valor de um item
    const handleItemChange = (index, field, value) => {
        const newItens = [...itens];
        newItens[index][field] = value;
        setItens(newItens);
    };

    // Calcular o total
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
            // Gerar o número da proforma
            const today = new Date();
            const day = String(today.getDate()).padStart(2, '0');
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const year = String(today.getFullYear()).slice(-2);
            
            // Obter referência para as proformas do usuário
            const proformaRef = ref(db, `invoices/${user.id}`);
            const snapshot = await get(proformaRef);
            const proformas = snapshot.val();
            const proformaCount = proformas ? Object.keys(proformas).length : 0;

            // Incrementar o número da proforma
            const sequentialNumber = String(proformaCount + 1).padStart(2, '0');
            const numeroProforma = `PF${day}${month}${year}${sequentialNumber}`;

            // Salvar a proforma usando o número da proforma como chave
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

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h1 className="text-3xl font-semibold mb-6">Criar Nova Proforma</h1>

            <form onSubmit={handleSalvar} className="space-y-6">
                <div>
                    <label className="block text-gray-700">Cliente (Opcional)</label>
                    <select
                        value={cliente}
                        onChange={(e) => setCliente(e.target.value)}
                        className="w-full p-2 border rounded"
                    >
                        <option value="">Selecione um cliente</option>
                        {clientes.map((c) => (
                            <option key={c.id} value={c.nome}>
                                {c.nome}
                            </option>
                        ))}
                    </select>
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
                        <label className="block text-gray-700">Data de Vencimento</label>
                        <input
                            type="date"
                            value={dataVencimento}
                            onChange={(e) => setDataVencimento(e.target.value)}
                            className={`w-full p-2 border rounded ${errors.dataVencimento ? 'border-red-500' : ''}`}
                        />
                        {errors.dataVencimento && <p className="text-red-500">{errors.dataVencimento}</p>}
                    </div>
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
                        Adicionar Item
                    </button>
                </div>

                <div>
                    <h3 className="text-lg font-semibold">Total: {total.toFixed(2)}</h3>
                </div>

                <button
                    type="submit"
                    className="w-full bg-green-600 text-white p-2 rounded"
                    disabled={loading}
                >
                    {loading ? 'Salvando...' : 'Salvar Proforma'}
                </button>
            </form>

            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={handleCloseSnackbar}>
                <MuiAlert elevation={6} variant="filled" onClose={handleCloseSnackbar} severity={snackbarSeverity}>
                    {snackbarMessage}
                </MuiAlert>
            </Snackbar>
        </div>
    );
};

export default CriarProforma;
