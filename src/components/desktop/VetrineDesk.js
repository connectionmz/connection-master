import React, { useState, useEffect } from 'react';
import { ref, onValue, update, get } from 'firebase/database';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import { db } from '../../fb';

const VetrineDesk = ({ id }) => {
    const [files, setFiles] = useState([]);

    useEffect(() => {

        const filesRef = ref(db, `vitrine/${id}`);

        onValue(filesRef, (snapshot) => {
            const data = snapshot.val();

            if (!data) { 
                setFiles([]); 
                return;
            }

            const fileList = Object.keys(data).map((key) => ({
                id: key,
                description: data[key].description || 'Sem descrição',
                url: data[key].url || '#',
            }));

            setFiles(fileList);
        }, (error) => {
            console.error('Erro ao buscar arquivos:', error);
        });
    }, [id]);

    // Função para atualizar o contador de downloads no Firebase
    const updateDownloadCount = async () => {
        if (!id) return;

        const downloadRef = ref(db, `download/${id}`);

        try {
            const snapshot = await get(downloadRef);
            const currentData = snapshot.val();
            const totalDownloads = currentData?.totalDownloads || 0;

            await update(downloadRef, { totalDownloads: totalDownloads + 1 });

        } catch (error) {
            console.error('Erro ao atualizar contador de downloads:', error);
        }
    };

    // Função para forçar o download do arquivo
    const handleDownload = async (url, description) => {
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', description || 'arquivo');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        await updateDownloadCount(); // Atualiza contador após o download
    };

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell><strong>Descrição</strong></TableCell>
                        <TableCell><strong>Ação</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {files.length > 0 ? (
                        files.map((file) => (
                            <TableRow key={file.id}>
                               <TableCell>
                                    <div dangerouslySetInnerHTML={{ __html: file.description }} />
                                </TableCell>
                                <TableCell>
                                    <Button 
                                        variant="contained" 
                                        color="primary" 
                                        onClick={() => handleDownload(file.url, file.description)}
                                    >
                                        Baixar
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={2} align="center">
                                Nenhum arquivo disponível
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default VetrineDesk;
