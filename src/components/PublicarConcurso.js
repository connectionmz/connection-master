import React, { useEffect, useState } from 'react';
import { equalTo, get, onValue, orderByChild, push, query, ref, set } from 'firebase/database';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; 
import { db } from '../fb';

const PublicarConcurso = ({ user }) => {
    const [formData, setFormData] = useState({
        titulo: '',
        entidade: user.nome,
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
        company:user,
        anexos: [],
        requisitosTecnicos: '',
    })

    const [richTextData, setRichTextData] = useState({
        objeto: '',
        condicoes: '',
        documentacao: '',
        criterios: '',
        condicoesPagamento: '',
        observacoes: '',
    })

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


    
    const handleRichTextChange = (field, value) => {
        setRichTextData({ ...richTextData, [field]: value });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        setFormData((prevState) => ({
            ...prevState,
            anexos: [...prevState.anexos, ...files],
        }));
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
    
        const sanitizedData = Object.fromEntries(
            Object.entries({
                ...formData,
                ...richTextData,
                user: user?.uid,
                dataCriacao: new Date().toISOString(),
            }).filter(([_, v]) => v !== undefined)
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
                    <label htmlFor="prazo" className="block">Prazo de Apresentação de Propostas</label>
                    <input
                        type="date"
                        name="prazo"
                        value={formData.prazo}
                        onChange={handleChange}
                        required
                        className="border p-2 w-full"/>
                </div>
                <div className="mb-4">
                    <label htmlFor="contato" className="block">Contato (Telefone/E-mail)</label>
                    <input
                        type="text"
                        name="contato"
                        value={formData.contato}
                        onChange={handleChange}
                        className="border p-2 w-full"
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="categoria" className="block">Categoria</label>
                    <select
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
                        className="border p-2 w-full"
                    >
                        <option value="">Selecione a Categoria</option>
                        <option value="Obras Públicas">Obras Públicas</option>
                        <option value="Serviços">Serviços</option>
                        <option value="Fornecimentos">Fornecimentos</option>
                    </select>
                </div>
                <div className="mb-4">
                    <label htmlFor="anexos" className="block">Anexos</label>
                    <input
                        type="file"
                        name="anexos"
                        multiple
                        onChange={handleFileUpload}
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

                {/* Campos de texto longo com ReactQuill */}
                <div className="mb-4">
                    <label htmlFor="objeto" className="block">Objeto do Concurso</label>
                    <ReactQuill
                        value={richTextData.objeto}
                        onChange={(value) => handleRichTextChange('objeto', value)}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="condicoes" className="block">Condições de Participação</label>
                    <ReactQuill
                        value={richTextData.condicoes}
                        onChange={(value) => handleRichTextChange('condicoes', value)}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="documentacao" className="block">Documentação Necessária</label>
                    <ReactQuill
                        value={richTextData.documentacao}
                        onChange={(value) => handleRichTextChange('documentacao', value)}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="criterios" className="block">Critérios de Avaliação</label>
                    <ReactQuill
                        value={richTextData.criterios}
                        onChange={(value) => handleRichTextChange('criterios', value)}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="condicoesPagamento" className="block">Condições de Pagamento</label>
                    <ReactQuill
                        value={richTextData.condicoesPagamento}
                        onChange={(value) => handleRichTextChange('condicoesPagamento', value)}
                    />
                </div>

                <div className="mb-4">
                    <label htmlFor="observacoes" className="block">Observações</label>
                    <ReactQuill
                        value={richTextData.observacoes}
                        onChange={(value) => handleRichTextChange('observacoes', value)}
                    />
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
