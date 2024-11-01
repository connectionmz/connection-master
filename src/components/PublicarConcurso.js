import React, { useEffect, useState } from 'react';
import { equalTo, get, onValue, orderByChild, push, query, ref, set } from 'firebase/database';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; 
import { db } from '../fb';

const PublicarConcurso = ({ user }) => {
    const [formData, setFormData] = useState({
        titulo: '',
        entidade: '',
        objeto: '',
        condicoes: '',
        documentacao: '',
        prazo: '',
        localEntrega: '',
        dataAbertura: '',
        criterios: '',
        valorEstimado: '',
        condicoesPagamento: '',
        observacoes: '',
        provincia: '', 
        setor: '',     
        tipoEntidade: '',
        company:user 
    });
    const [description, setDescription] = useState('');
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [provincias, setProvincias] = useState([]);
    const [sectores, setSectores] = useState([]);
    const [tiposEntidades, setTiposEntidades] = useState([]);

    useEffect(() => {
        const provinciasRef = ref(db, 'provincias');
        const sectoresRef = ref(db, 'sectores_de_atividade');
        const tipoEntidadeRef = ref(db, 'tipos_entidades');

        onValue(provinciasRef, (snapshot) => {
            const provinciasData = snapshot.val() || [];
            setProvincias(provinciasData);
        });

        onValue(sectoresRef, (snapshot) => {
            const sectoresData = snapshot.val() || [];
            setSectores(sectoresData);
        });

        onValue(tipoEntidadeRef, (snapshot) => {
            const tipoEntidadeData = snapshot.val() || [];
            setTiposEntidades(tipoEntidadeData);
        });
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const sanitizedData = Object.fromEntries(
            Object.entries({ ...formData, description, user: user?.uid, dataCriacao: new Date().toISOString() })
                .filter(([_, v]) => v !== undefined)
        );
    
        const concursosRef = ref(db, 'concursos');
    
        const newConcursoRef = push(concursosRef);
    
        await set(newConcursoRef, sanitizedData);
    
        await notifySectorCompanies(formData.setor, formData.titulo, description, formData.prazo);
    };
    

    const notifySectorCompanies = async (sector, title, description, deadline) => {
        const empresasRef = ref(db, 'company');
        const setorQuery = query(empresasRef, orderByChild('sector'), equalTo(sector));
        const snapshot = await get(setorQuery);
        if (snapshot.exists()) {
            const empresas = snapshot.val();
            for (const key in empresas) {
                const empresa = empresas[key];
                const message = `Novo concurso no seu setor:\n\nTítulo: ${title}\nDescrição: ${description}\nData Limite: ${deadline}`;
                const to = empresa.contacto;
                await sendMessage(message, to);
            }
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

    return (
        <div className="p-4">
            <h2>Publicar Concurso</h2>
            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="titulo" className="block">Título do Concurso</label>
                    <input
                        type="text"
                        name="titulo"
                        value={formData.titulo}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="entidade" className="block">Entidade Promotora</label>
                    <input
                        type="text"
                        name="entidade"
                        value={formData.entidade}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="objeto" className="block">Objeto do Concurso</label>
                    <textarea
                        name="objeto"
                        value={formData.objeto}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="condicoes" className="block">Condições de Participação</label>
                    <textarea
                        name="condicoes"
                        value={formData.condicoes}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="documentacao" className="block">Documentação Necessária</label>
                    <textarea
                        name="documentacao"
                        value={formData.documentacao}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="prazo" className="block">Prazo de Apresentação de Propostas</label>
                    <input
                        type="date"
                        name="prazo"
                        value={formData.prazo}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="localEntrega" className="block">Local de Entrega</label>
                    <input
                        type="text"
                        name="localEntrega"
                        value={formData.localEntrega}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="provincia" className="block">Província</label>
                    <select
                                name="provincia"
                                value={formData.provincia}
                                onChange={handleChange}
                                required
                                className="border p-2 w-full"
                            >
                                <option value="">Selecione a Província</option>
                                {provincias.map((provinciaObj, index) => (
                                    <option key={index} value={provinciaObj.provincia}>{provinciaObj.provincia}</option>
                                ))}
                            </select>
                </div>
                <div className="mb-4">
                    <label htmlFor="setor" className="block">Setor de Atividade</label>
                    <select
    name="setor"
    value={formData.setor}
    onChange={handleChange}
    required
    className="border p-2 w-full"
>
    <option value="">Selecione o Setor</option>
    {sectores.map((setorObj, index) => (
        <option key={index} value={setorObj.setor}>{setorObj.setor}</option>
    ))}
</select>

                </div>

                <div className="mb-4">
                    <label htmlFor="tipoEntidade" className="block">Tipo de Entidade</label>
                    <select
    name="tipoEntidade"
    value={formData.tipoEntidade}
    onChange={handleChange}
    required
    className="border p-2 w-full"
>
    <option value="">Selecione o Tipo de Entidade</option>
    {tiposEntidades.map((tipoObj, index) => (
        <option key={index} value={tipoObj.tipo}>{tipoObj.tipo}</option>
    ))}
</select>

                </div>
                <div className="mb-4">
                    <label htmlFor="dataAbertura" className="block">Data de Abertura das Propostas</label>
                    <input
                        type="date"
                        name="dataAbertura"
                        value={formData.dataAbertura}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="criterios" className="block">Critérios de Avaliação</label>
                    <textarea
                        name="criterios"
                        value={formData.criterios}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="valorEstimado" className="block">Valor Estimado do Contrato</label>
                    <input
                        type="number"
                        name="valorEstimado"
                        value={formData.valorEstimado}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="condicoesPagamento" className="block">Condições de Pagamento</label>
                    <textarea
                        name="condicoesPagamento"
                        value={formData.condicoesPagamento}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="observacoes" className="block">Observações</label>
                    <textarea
                        name="observacoes"
                        value={formData.observacoes}
                        onChange={handleChange}
                        className="border p-2 w-full"
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="description" className="block">Descrição Detalhada</label>
                    <ReactQuill value={description} onChange={setDescription} />
                </div>

                <button type="submit" className="bg-blue-500 text-white p-2 rounded">Publicar Concurso</button>
            </form>

            {openSnackbar && (
                <div className={`snackbar ${snackbarSeverity}`}>
                    {snackbarMessage}
                </div>
            )}
        </div>
    );
};

export default PublicarConcurso;
