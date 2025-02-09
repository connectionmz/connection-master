import React, { useState, useEffect } from 'react';
import { ref, onValue, update, get, remove } from 'firebase/database';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import DescriptionIcon from '@mui/icons-material/Description';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import ArchiveIcon from '@mui/icons-material/Archive';
import DOMPurify from 'dompurify';
import { db } from '../../fb';

const getFileTypeIcon = (fileType) => {
    if (fileType.includes('pdf')) return <PictureAsPdfIcon style={{ color: 'red' }} />;
    if (fileType.includes('word') || fileType.includes('doc')) return <DescriptionIcon style={{ color: 'blue' }} />;
    if (fileType.includes('excel') || fileType.includes('xls')) return <InsertDriveFileIcon style={{ color: 'green' }} />;
    if (fileType.includes('image')) return <ImageIcon style={{ color: 'purple' }} />;
    if (fileType.includes('video')) return <VideoLibraryIcon style={{ color: 'orange' }} />;
    if (fileType.includes('zip') || fileType.includes('rar')) return <ArchiveIcon style={{ color: 'brown' }} />;
    return <InsertDriveFileIcon style={{ color: 'gray' }} />;
};

const VetrineDesk = ({ id }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [fileToDelete, setFileToDelete] = useState(null);

    useEffect(() => {
        const filesRef = ref(db, `vitrine/${id}`);

        onValue(filesRef, (snapshot) => {
            const data = snapshot.val();
            setLoading(false);

            if (!data) {
                setFiles([]);
                return;
            }

            const fileList = Object.keys(data).map((key) => ({
                id: key,
                description: data[key].description || 'Sem descrição',
                fileType: data[key].fileType || 'application/octet-stream',
                timestamp: new Date(data[key].timestamp).toLocaleString(),
                url: data[key].url || '#',
                ownerId: data[key].company.id,
            }));

            setFiles(fileList);
        }, (error) => {
            setLoading(false);
            setError('Erro ao buscar arquivos');
            console.error('Erro ao buscar arquivos:', error);
        });
    }, [id]);

    const updateDownloadCount = async (fileId) => {
        const downloadRef = ref(db, `download/${id}/${fileId}`);

        try {
            const snapshot = await get(downloadRef);
            const currentData = snapshot.val();
            const totalDownloads = currentData?.totalDownloads || 0;

            await update(downloadRef, { totalDownloads: totalDownloads + 1 });
        } catch (error) {
            console.error('Erro ao atualizar contador de downloads:', error);
        }
    };

    const handleDownload = async (url, description, fileId) => {
        try {
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', description || 'arquivo');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            await updateDownloadCount(fileId);
            setError(null);
        } catch (error) {
            setError('Erro ao baixar o arquivo');
            console.error('Erro ao baixar o arquivo:', error);
        }
    };

    const handleDeleteConfirmation = (fileId) => {
        setFileToDelete(fileId);
        setOpenDeleteDialog(true);
    };

    const handleDelete = async () => {
        if (!fileToDelete) return;
        try {
            const fileRef = ref(db, `vitrine/${id}/${fileToDelete}`);
            await remove(fileRef);
            setOpenDeleteDialog(false);
            alert('Arquivo excluído com sucesso!');
        } catch (error) {
            setOpenDeleteDialog(false);
            setError('Erro ao excluir o arquivo');
            console.error('Erro ao excluir o arquivo:', error);
        }
    };

    const handleCloseDialog = () => {
        setOpenDeleteDialog(false);
        setFileToDelete(null);
    };

    return (
        <>
            {error && <div style={{ color: 'red', textAlign: 'center' }}>{error}</div>}
            {loading ? (
                <div>Carregando...</div>
            ) : (
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>Arquivo</strong></TableCell>
                                <TableCell><strong>Publicado Em</strong></TableCell>
                                <TableCell><strong>Ação</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {files.length > 0 ? (
                                files.map((file) => (
                                    <TableRow key={file.id}>
                                        <TableCell style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {getFileTypeIcon(file.fileType)}
                                            <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(file.description) }} />
                                        </TableCell>
                                        <TableCell>{file.timestamp}</TableCell>
                                        <TableCell>
                                            <Button
                                                variant="contained"
                                                color="primary"
                                                onClick={() => handleDownload(file.url, file.description, file.id)}>
                                                Baixar
                                            </Button>
                                            {file.ownerId == id && (
                                                <Button
                                                    variant="contained"
                                                    color="secondary"
                                                    onClick={() => handleDeleteConfirmation(file.id)}>
                                                    Excluir
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} align="center">
                                        Nenhum arquivo disponível
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            <Dialog open={openDeleteDialog} onClose={handleCloseDialog}>
                <DialogTitle>Excluir Arquivo</DialogTitle>
                <DialogContent>
                    <p>Tem certeza de que deseja excluir o arquivo ?</p>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog} color="primary">Cancelar</Button>
                    <Button onClick={handleDelete} color="secondary">Excluir</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default VetrineDesk;