import React, { useEffect, useState } from 'react';
import { equalTo, get, onValue, orderByChild, push, query, ref, set } from 'firebase/database';
import axios from 'axios';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { db } from '../../fb';
import {
    Container,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Button,
    Snackbar,
    Alert,
    Typography,
    Box,
    CircularProgress,
} from '@mui/material';

const PublicarConcursoDesk = ({ user }) => {
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
        company: user,
        anexos: [],
        timestamp: new Date().toISOString(),
        requisitosTecnicos: '',
        modalidade: '',
        numeroReferencia: '',
    });

    const [richTextData, setRichTextData] = useState({
        objeto: '',
        condicoes: '',
        documentacao: '',
        criterios: '',
        condicoesPagamento: '',
        observacoes: '',
    });

    const [loading, setLoading] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
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
        setLoading(true);
    
        const sanitizedData = Object.fromEntries(
            Object.entries({
                ...formData,
                ...richTextData,
                user: user?.uid,
                dataCriacao: new Date().toISOString(),
            }).filter(([_, v]) => v !== undefined)
        );
    
        try {
            const concursosRef = ref(db, 'concursos');
            const newConcursoRef = push(concursosRef);
    
            // Obtendo o ID gerado automaticamente para o novo concurso
            const concursoId = newConcursoRef.key;
    
            // Adicionando o ID ao objeto de dados
            const concursoWithId = {
                ...sanitizedData,
                id: concursoId,  // Adiciona o ID do concurso aos dados
            };
    
            // Salvando o concurso com o ID no banco de dados
            await set(newConcursoRef, concursoWithId);
    
            await notifySectorCompanies(formData.setor, formData.titulo, richTextData.objeto, formData.prazo, formData.valorEstimado, formData.localEntrega);
    
            setSnackbarMessage('Concurso publicado com sucesso!');
            setSnackbarSeverity('success');
            setOpenSnackbar(true);
    
            // Limpar o formulário após o envio
            setFormData({
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
                company: user,
                anexos: [],
                requisitosTecnicos: '',
                modalidade: '',
                numeroReferencia: '',
            });
    
            setRichTextData({
                objeto: '',
                condicoes: '',
                documentacao: '',
                criterios: '',
                condicoesPagamento: '',
                observacoes: '',
            });
        } catch (error) {
            setSnackbarMessage('Erro ao publicar concurso.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            console.error('Erro ao publicar concurso:', error);
        } finally {
            setLoading(false);
        }
    };
    
    const notifySectorCompanies = async (sector, title, description, deadline, valorEstimado, localEntrega) => {
        const empresasRef = ref(db, 'company');
        const setorQuery = query(empresasRef, orderByChild('sector'), equalTo(sector));
        const snapshot = await get(setorQuery);
        if (snapshot.exists()) {
            const empresas = snapshot.val();
            for (const key in empresas) {
                const empresa = empresas[key];
                const message = `Novo concurso no seu setor:\n\nTítulo: ${title}\nDescrição: ${description}\nValor Estimado: ${valorEstimado}\nLocal de Entrega: ${localEntrega}\nData Limite: ${deadline}`;
                const to = empresa.contacto;
                await sendMessage(message, to);
            }
        }
    };

    const sendMessage = async (message, to) => {
        try {
            const response = await axios.post('http://localhost:3001/send-sms', {
                message,
                to,
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

    const handleCloseSnackbar = () => {
        setOpenSnackbar(false);
    };

    return (
        <Container>
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
                <Typography variant="h4" gutterBottom>
                    Publicar Concurso
                </Typography>

                <TextField
                    fullWidth
                    label="Título do Concurso"
                    name="titulo"
                    value={formData.titulo}
                    onChange={handleChange}
                    required
                    margin="normal"
                />

                <TextField
                    fullWidth
                    label="Número de Referência"
                    name="numeroReferencia"
                    value={formData.numeroReferencia}
                    onChange={handleChange}
                    required
                    margin="normal"
                />

                <TextField
                    fullWidth
                    label="Prazo de Apresentação de Propostas"
                    type="date"
                    name="prazo"
                    value={formData.prazo}
                    onChange={handleChange}
                    required
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                />

                <TextField
                    fullWidth
                    label="Contato (Telefone/E-mail)"
                    name="contato"
                    value={formData.contato}
                    onChange={handleChange}
                    margin="normal"
                />

                <FormControl fullWidth margin="normal">
                    <InputLabel>Categoria</InputLabel>
                    <Select
                        name="categoria"
                        value={formData.categoria}
                        onChange={handleChange}
                        label="Categoria"
                    >
                        <MenuItem value="">Selecione a Categoria</MenuItem>
                        <MenuItem value="Obras Públicas">Obras Públicas</MenuItem>
                        <MenuItem value="Serviços">Serviços</MenuItem>
                        <MenuItem value="Fornecimentos">Fornecimentos</MenuItem>
                    </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                    <InputLabel>Modalidade de Concurso</InputLabel>
                    <Select
                        name="modalidade"
                        value={formData.modalidade}
                        onChange={handleChange}
                        label="Modalidade de Concurso">
                        <MenuItem value="">Selecione a Modalidade</MenuItem>
                        <MenuItem value="Concurso Público">Concurso Público</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    fullWidth
                    type="file"
                    name="anexos"
                    inputProps={{ multiple: true }}
                    onChange={handleFileUpload}
                    margin="normal"/>
                <TextField
                    fullWidth
                    label="Local de Entrega"
                    name="localEntrega"
                    value={formData.localEntrega}
                    onChange={handleChange}
                    required
                    margin="normal"/>
                <FormControl fullWidth margin="normal">
                    <InputLabel>Província</InputLabel>
                    <Select
                        name="provincia"
                        value={formData.provincia}
                        onChange={handleChange}
                        label="Província"
                        required>
                        <MenuItem value="">Selecione a Província</MenuItem>
                        {provincias.map((provinciaObj, index) => (
                            <MenuItem key={index} value={provinciaObj.provincia}>
                                {provinciaObj.provincia}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                    <InputLabel>Setor de Atividade</InputLabel>
                    <Select
                        name="setor"
                        value={formData.setor}
                        onChange={handleChange}
                        label="Setor de Atividade"
                        required>
                        <MenuItem value="">Selecione o Setor</MenuItem>
                        {sectores.map((setorObj, index) => (
                            <MenuItem key={index} value={setorObj.setor}>
                                {setorObj.setor}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <FormControl fullWidth margin="normal">
                    <InputLabel>Tipo de Entidade</InputLabel>
                    <Select
                        name="tipoEntidade"
                        value={formData.tipoEntidade}
                        onChange={handleChange}
                        label="Tipo de Entidade"
                        required>
                        <MenuItem value="">Selecione o Tipo de Entidade</MenuItem>
                        {tiposEntidades.map((tipoObj, index) => (
                            <MenuItem key={index} value={tipoObj.tipo}>
                                {tipoObj.tipo}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <TextField
                    fullWidth
                    label="Data de Abertura das Propostas"
                    type="date"
                    name="dataAbertura"
                    value={formData.dataAbertura}
                    onChange={handleChange}
                    required
                    margin="normal"
                    InputLabelProps={{ shrink: true }}/>
                <TextField
                fullWidth
                label="Valor Estimado do Contrato"
                type="number"
                name="valorEstimado"
                value={formData.valorEstimado}
                onChange={handleChange}
                required
                margin="normal"
                inputProps={{ 
                    maxLength: 20,  
                    inputMode: 'numeric',  
                }}/>
                <Typography variant="h6" gutterBottom>
                    Objeto do Concurso
                </Typography>
                <ReactQuill
                    value={richTextData.objeto}
                    onChange={(value) => handleRichTextChange('objeto', value)}/>

                <Typography variant="h6" gutterBottom>
                    Condições de Participação
                </Typography>
                <ReactQuill
                    value={richTextData.condicoes}
                    onChange={(value) => handleRichTextChange('condicoes', value)}/>

                <Typography variant="h6" gutterBottom>
                    Documentação Necessária
                </Typography>
                <ReactQuill
                    value={richTextData.documentacao}
                    onChange={(value) => handleRichTextChange('documentacao', value)}/>

                <Typography variant="h6" gutterBottom>
                    Critérios de Avaliação
                </Typography>
                <ReactQuill
                    value={richTextData.criterios}
                    onChange={(value) => handleRichTextChange('criterios', value)}/>

                <Typography variant="h6" gutterBottom>
                    Condições de Pagamento
                </Typography>
                <ReactQuill
                    value={richTextData.condicoesPagamento}
                    onChange={(value) => handleRichTextChange('condicoesPagamento', value)}/>

                <Typography variant="h6" gutterBottom>
                    Observações
                </Typography>
                <ReactQuill
                    value={richTextData.observacoes}
                    onChange={(value) => handleRichTextChange('observacoes', value)}/>

                <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }} disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : 'Publicar Concurso'}
                </Button>
            </Box>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}>
                <Alert onClose={handleCloseSnackbar} severity={snackbarSeverity}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default PublicarConcursoDesk;