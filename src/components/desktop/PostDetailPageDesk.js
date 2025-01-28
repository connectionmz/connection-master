import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../../fb';
import { ref, onValue, update, push, child, set, remove } from 'firebase/database';
import { Box, Button, Card, CardContent, CardMedia, Typography, TextField, Divider } from '@mui/material';

const PostDetailPageDesk = ({ user }) => {
  const { postId } = useParams();  // Pega o ID do post da URL
  const [likes, setLikes] = useState(0);  // Controle do número de likes
  const [comments, setComments] = useState([]);  // Controle dos comentários
  const [commentText, setCommentText] = useState('');  // Texto do comentário
  const [post, setPost] = useState(null); // Armazenar o post específico

  useEffect(() => {
    const postsRef = ref(db, `posts/${postId}`);  // Referência ao post específico no Firebase

    // Buscar o post específico no Firebase
    onValue(postsRef, (snapshot) => {
      const data = snapshot.val();

      if (data) {
        // Atualiza os dados do post no estado
        setPost({
          id: postId,
          description: data.description || '',
          url: data.url || '',
          companyName: data.company?.name || 'Empresa Desconhecida',
          logoUrl: data.company?.logo || 'https://via.placeholder.com/150',
          companyId: data.company?.id // Armazena o ID da empresa do post
        });
        const likeCount = Object.keys(data.likes || {}).length;
        setLikes(likeCount || 0);  // Configura o número de likes

        const commentsArray = data.comments || {};
        setComments(Object.values(commentsArray));  // Carrega os comentários
      } else {
        setPost(null);  // Caso o post não seja encontrado
      }
    });
  }, [postId]);

  // Função para adicionar um comentário
  const handleAddComment = () => {
    if (commentText.trim()) {
      const commentRef = ref(db, `posts/${postId}/comments`);  // Referência para os comentários
      const newCommentRef = push(commentRef);  // Cria uma nova chave para o comentário

      const comment = {
        userId: user.id,  // ID do usuário que fez o comentário
        userName: user.nome,  // Nome do usuário
        comment: commentText,  // Texto do comentário
        data: new Date().toISOString()  // Data e hora do comentário
      };

      // Usa set para salvar o comentário na nova chave
      set(newCommentRef, comment).then(() => {
        setCommentText('');  // Limpa o campo de texto após adicionar o comentário
      }).catch((error) => {
        console.error('Erro ao adicionar comentário: ', error);
      });
    }
  };

  const handleLike = () => {
    const postRef = ref(db, `posts/${postId}/likes`);
  
    // Verifica se o usuário já deu like ou não
    set(postRef, {
      [user.id]: true
    }).then(() => {
      console.log('Like registrado!');
    }).catch((error) => {
      console.error('Erro ao registrar like: ', error);
    });
  };

  const handleShare = () => {

  }

  const handleReport = () => {
    const postRef = ref(db, `posts/${postId}/reports`);
    set(postRef, {
      [user.id]: true
    }).then(() => {
      console.log('Denúncia registrada!');
    }).catch((error) => {
      console.error('Erro ao registrar denúncia: ', error);
    });
  };

  // Função para excluir um comentário
  const handleDeleteComment = (commentId) => {
    const commentRef = ref(db, `posts/${postId}/comments/${commentId}`);
    remove(commentRef).then(() => {
      console.log('Comentário excluído com sucesso!');
    }).catch((error) => {
      console.error('Erro ao excluir comentário: ', error);
    });
  };

  if (!post) {
    return <div>Post não encontrado!</div>;
  }

  return (
    <Box className="container" sx={{ maxWidth: '800px', margin: '0 auto', padding: 2 }}>
      <Card sx={{ boxShadow: 3, marginBottom: 2 }}>
        {/* Card de Imagem e Descrição */}
        <CardMedia
          component="img"
          height="350"
          image={post.url}
          alt={`Post ${post.id}`}
        />
        <CardContent>
          <Typography variant="h5" gutterBottom>
            {post.description || 'Sem descrição'}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {post.companyName}
          </Typography>
        </CardContent>

        {/* Botões de Interação */}
        <Box sx={{ padding: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleLike} variant="contained" color="primary">
            Curtir ({likes})
          </Button>
          <Button onClick={() => handleShare(post.id)} variant="contained" color="success">
            Compartilhar
          </Button>
          <Button onClick={handleReport} variant="contained" color="error">
            Denunciar
          </Button>
        </Box>
      </Card>

      {/* Comentários */}
      <Card sx={{ boxShadow: 3, marginBottom: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Comentários ({comments.length})
          </Typography>

          <TextField
            label="Escreva um comentário..."
            multiline
            rows={4}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            fullWidth
            variant="outlined"
            margin="normal"
          />
          <Button onClick={handleAddComment} variant="contained" color="primary">
            Adicionar Comentário
          </Button>
          <Divider sx={{ marginY: 2 }} />

          {comments.length === 0 ? (
            <Typography variant="body2" color="textSecondary">
              Sem comentários ainda.
            </Typography>
          ) : (
            comments.map((comment, index) => (
              <Box key={index} sx={{ marginBottom: 1 }}>
                <Typography variant="body2">{comment.comment}</Typography>
                <Typography variant="body2" color="textSecondary">{comment.userName}</Typography>

                {/* Verifica se o usuário atual é o dono do comentário ou do post */}
                {(comment.userId === user.id || post.companyId === user.id) && (
                  <Button 
                    onClick={() => handleDeleteComment(index)} 
                    variant="outlined" 
                    color="error"
                  >
                    Excluir
                  </Button>
                )}
              </Box>
            ))
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default PostDetailPageDesk;
