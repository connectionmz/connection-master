import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Grid,
    Typography,
    MenuItem,
    FormControl,
    InputLabel,
    Select,
    Box,
    Alert
} from '@mui/material';
import { ref, update } from 'firebase/database';
import { db } from '../../fb';

const EditarConcurso = ({ concurso, user, onClose, onSuccess, onError }) => {
    const [formData, setFormData] = useState({
        titulo: '',
        objeto: '',
        prazo: '',
        valorEstimado: '',
        condicoes: '',
        criterios: '',
        documentacao: '',
        localEntrega: '',
        modalidade: '',
        provincia: '',
        status: 'Aberta'
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (concurso) {
            // Formata a data para o input type="date" (YYYY-MM-DD)
            const prazoDate = concurso.prazo ? new Date(concurso.prazo) : new Date();
            const formattedDate = prazoDate.toISOString().split('T')[0];
            
            setFormData({
                titulo: concurso.titulo || '',
                objeto: concurso.objeto || '',
                prazo: formattedDate,
                valorEstimado: concurso.valorEstimado || '',
                condicoes: concurso.condicoes || '',
                criterios: concurso.criterios || '',
                documentacao: concurso.documentacao || '',
                localEntrega: concurso.localEntrega || '',
                modalidade: concurso.modalidade || 'Concurso Público',
                provincia: concurso.provincia || user.provincia || '',
                status: concurso.status || 'Aberta'
            });
        }
    }, [concurso, user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const updatedConcurso = {
                ...formData,
                updatedAt: new Date().toISOString()
            };

            await update(ref(db, `concursos/${concurso.id}`), updatedConcurso);

            setSuccess(true);
            if (onSuccess) onSuccess();
        } catch (err) {
            console.error('Error updating concurso:', err);
            setError('Erro ao atualizar o pedido de proposta. Tente novamente.');
            if (onError) onError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const modalidades = [
        'Concurso Público',
        'Concurso Limitado por Pré-Qualificação',
        'Ajuste Direto',
        'Consulta Prévia',
        'Leilão'
    ];

    const provincias = [
        'Maputo Cidade',
        'Maputo Província',
        'Gaza',
        'Inhambane',
        'Sofala',
        'Manica',
        'Tete',
        'Zambézia',
        'Nampula',
        'Cabo Delgado',
        'Niassa'
    ];

    return (
        <Dialog open={true} onClose={onClose} fullWidth maxWidth="md">
            <DialogTitle>Editar Pedido de Proposta</DialogTitle>
            <DialogContent>
                <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Título do Pedido de Proposta"
                                name="titulo"
                                value={formData.titulo}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Objeto do Pedido de Proposta"
                                name="objeto"
                                value={formData.objeto}
                                onChange={handleChange}
                                multiline
                                rows={4}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Prazo de Submissão"
                                name="prazo"
                                type="date"
                                value={formData.prazo}
                                onChange={handleChange}
                                InputLabelProps={{
                                    shrink: true,
                                }}
                                required
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                fullWidth
                                label="Valor Estimado (MT)"
                                name="valorEstimado"
                                value={formData.valorEstimado}
                                onChange={handleChange}
                                type="number"
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Modalidade</InputLabel>
                                <Select
                                    name="modalidade"
                                    value={formData.modalidade}
                                    onChange={handleChange}
                                    label="Modalidade"
                                    required
                                >
                                    {modalidades.map((mod) => (
                                        <MenuItem key={mod} value={mod}>
                                            {mod}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Província</InputLabel>
                                <Select
                                    name="provincia"
                                    value={formData.provincia}
                                    onChange={handleChange}
                                    label="Província"
                                    required
                                >
                                    {provincias.map((prov) => (
                                        <MenuItem key={prov} value={prov}>
                                            {prov}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Local de Entrega"
                                name="localEntrega"
                                value={formData.localEntrega}
                                onChange={handleChange}
                                required
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Condições de Pagamento"
                                name="condicoes"
                                value={formData.condicoes}
                                onChange={handleChange}
                                multiline
                                rows={3}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Critérios de Avaliação"
                                name="criterios"
                                value={formData.criterios}
                                onChange={handleChange}
                                multiline
                                rows={3}
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                fullWidth
                                label="Documentação Necessária"
                                name="documentacao"
                                value={formData.documentacao}
                                onChange={handleChange}
                                multiline
                                rows={3}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Status</InputLabel>
                                <Select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    label="Status"
                                    required
                                >
                                    <MenuItem value="Aberta">Aberta</MenuItem>
                                    <MenuItem value="Fechada">Fechada</MenuItem>
                                    <MenuItem value="Expirada">Expirada</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {error && (
                            <Grid item xs={12}>
                                <Alert severity="error">{error}</Alert>
                            </Grid>
                        )}

                        {success && (
                            <Grid item xs={12}>
                                <Alert severity="success">Pedido de proposta atualizado com sucesso!</Alert>
                            </Grid>
                        )}
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="secondary">
                    Cancelar
                </Button>
                <Button 
                    onClick={handleSubmit} 
                    color="primary" 
                    variant="contained"
                    disabled={loading}
                >
                    {loading ? 'Salvando...' : 'Salvar Alterações'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default EditarConcurso;