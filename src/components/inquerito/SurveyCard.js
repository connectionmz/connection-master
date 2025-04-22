import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Divider,
  Button,
  Avatar,
  Badge,
  IconButton,
  Tooltip,
  Box
} from '@mui/material';
import { Edit, Delete, Visibility, BarChart } from '@mui/icons-material';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const SurveyCard = ({ 
  survey, 
  responsesCount, 
  onViewResponses, 
  onEdit, 
  onDelete, 
  canEdit 
}) => {
  return (
    <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
              {survey.title}
            </Typography>
            <Chip 
              label={survey.sector} 
              color="primary" 
              size="small" 
              sx={{ mb: 1 }} 
            />
          </Box>
          <Badge
            badgeContent={responsesCount}
            color="primary"
            overlap="circular"
          >
            <Avatar sx={{ bgcolor: responsesCount ? 'primary.main' : 'grey.400' }}>
              <BarChart />
            </Avatar>
          </Badge>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {survey.description}
        </Typography>
        
        <Divider sx={{ my: 1 }} />
        
        <Typography variant="caption" color="text.secondary">
          Criado em: {format(new Date(survey.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
        </Typography>
      </CardContent>
      
      <CardActions sx={{ justifyContent: 'flex-end', p: 2 }}>
        <Tooltip title="Ver respostas">
          <IconButton onClick={onViewResponses} color="primary">
            <Visibility />
          </IconButton>
        </Tooltip>
        
        <Tooltip title={canEdit ? "Editar" : "Não é possível editar inquéritos com respostas"}>
          <span>
            <IconButton 
              onClick={onEdit} 
              color="primary"
              disabled={!canEdit}
            >
              <Edit />
            </IconButton>
          </span>
        </Tooltip>
        
        <Tooltip title="Excluir">
          <IconButton onClick={onDelete} color="error">
            <Delete />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
};

export default SurveyCard;