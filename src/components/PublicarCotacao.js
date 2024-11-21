import React, { useState } from 'react';
import { getDatabase, ref, push, set, child, get, query, orderByChild, equalTo } from 'firebase/database';
import { useNavigate } from 'react-router-dom';
import { db, storage } from '../fb';
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage';
import axios from 'axios';
import ReactQuill from 'react-quill';
import { EditorText, SectorDeActividades } from '../utils/formUtils';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

const PublicarCotacao = ({ user }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [items, setItems] = useState([]); 
    const [deadline, setDeadline] = useState('');
    const [sector, setSector] = useState('');
    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success'); 
    const navigate = useNavigate();

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        setItems(newItems);
    };

    const handleAddItem = () => {
        setItems([...items, { name: '', description: '', imageUrl: '' }]);
    };

    const handleRemoveItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const handleImageChange = async (index, e) => {
        const file = e.target.files[0];
        if (file) {
            const fileRef = storageRef(storage, `images/${file.name}`);
            await uploadBytes(fileRef, file);
            const imageUrl = await getDownloadURL(fileRef);
            handleItemChange(index, 'imageUrl', imageUrl);
        }
    };

    const handleSectorChange = (e) => {
        setSector(e.target.value);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSnackbarMessage('');
    
        if (user) {
            try {
                const cotacaoRef = ref(db, 'cotacoes');
                const newCotacaoRef = push(cotacaoRef);
                await set(newCotacaoRef, {
                    title,
                    description,
                    items,
                    company: user,
                    sector,
                    timestamp: new Date().toISOString(),
                    datalimite: new Date(deadline).toISOString(),
                    status: 'open'
                });
    
                setSnackbarMessage('Cotação publicada com sucesso!');
                setSnackbarSeverity('success');
                setOpenSnackbar(true);

                setTimeout(() => {
                    navigate('/cotacao'); // Exemplo: rota para página de confirmação
                }, 2000);
    
                const empresasRef = ref(db, 'company'); 
                const setorQuery = query(empresasRef, orderByChild('sector'), equalTo(sector));
    
                const snapshot = await get(setorQuery);
                if (snapshot.exists()) {
                    const empresas = snapshot.val();
    
                    for (const key in empresas) {
                        const empresa = empresas[key];
                        const message = `Nova cotação no seu setor:\n\nTítulo: ${title}\nDescrição: ${description}\nData Limite: ${deadline}`;
                        const to = empresa.contacto; 
    
                        await sendMessage(message, to);
                    }
                }
            } catch (error) {
                setSnackbarMessage('Erro ao publicar a cotação. Tente novamente.');
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
                console.error('Erro ao publicar a cotação:', error.message);
            } finally {
                setLoading(false);
            }
        } else {
            setSnackbarMessage('Por favor, recarregue a página e tente novamente.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
        }
    };
    
    

    const sendMessage = async (message, to) => {
        try {
            const response = await axios.post('http://localhost:3001/send-sms', {
                message,
                to
            });
            if (response.data.success) {
                setSnackbarMessage('Mensagem enviada com sucesso pelo WhatsApp!');
                setSnackbarSeverity('success');
                setOpenSnackbar(true);
            }
        } catch (error) {
            setSnackbarMessage('Erro ao enviar mensagem pelo WhatsApp.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            console.error('Erro ao enviar mensagem pelo WhatsApp:', error);
        }
    };

    const handleSnackbarClose = () => {
        setOpenSnackbar(false);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-semibold mb-4">Pedido de Cotação</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Título do Pedido
                    </label>
                    <input 
                        type="text" 
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        placeholder="Digite o título do pedido"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Descrição Geral
                    </label>
                    <EditorText
                        description={description}
                        setDescription={setDescription}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Data Limite para a Cotação
                    </label>
                    <input 
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="w-full px-3 py-2 border rounded"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-gray-700 text-sm font-bold mb-2">
                        Sector de Atividade
                    </label>
                    <SectorDeActividades 
                        companyData={{ sector }} 
                        handleChange={handleSectorChange} 
                        inputStyles="w-full px-3 py-2 border rounded"/>
                </div>
                {items.map((item, index) => (
                    <div key={index} className="mb-4 border p-4 rounded">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-lg font-semibold">Item {index + 1}</h3>
                            <button 
                                type="button" 
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-500 hover:underline">
                                Remover Item
                            </button>
                        </div>
                        <div className="mb-2">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Nome do Produto/Serviço
                            </label>
                            <input 
                                type="text"
                                value={item.name}
                                onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Digite o nome do produto/serviço"
                                required/>
                        </div>
                        <div className="mb-2">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Descrição do Produto/Serviço
                            </label>
                            <textarea 
                                value={item.description}
                                onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                className="w-full px-3 py-2 border rounded"
                                placeholder="Descreva o produto/serviço"
                                rows="2"/>
                        </div>
                        <div className="mb-2">
                            <label className="block text-gray-700 text-sm font-bold mb-2">
                                Imagem do Produto/Serviço
                            </label>
                            <input 
                                type="file"
                                onChange={(e) => handleImageChange(index, e)}
                                className="w-full"
                                accept="image/*"
                            />
                            {item.imageUrl && (
                                <img src={item.imageUrl} alt={`Imagem do item ${index + 1}`} className="mt-2 w-32 h-32 object-cover"/>
                            )}
                        </div>
                    </div>
                ))}
                <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="bg-gray-200 text-gray-700 py-2 px-4 rounded mb-4"
                >
                    Adicionar Item
                </button>
                <button 
                    type="submit" 
                    disabled={loading}
                    className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
                >
                    {loading ? 'Enviando...' : 'Publicar Cotação'}
                </button>
            </form>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </div>
    );
};

export default PublicarCotacao;
