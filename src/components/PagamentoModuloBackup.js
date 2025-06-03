import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../fb';
import { onValue, ref } from 'firebase/database';
import PayModuleCheckout from './checkout/PayModuleCheckout';
import { UpdatePayment } from './UpdatePayment';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import PaySMSCheckout from './PaySMSCheckout';
import BackButton from './BackButton';

const PagamentoModulo = ({ user }) => {
  const { moduleKey } = useParams();
  const [modules, setModules] = useState([]);
  const [currentModule, setCurrentModule] = useState(null);
  const navigate = useNavigate();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const modulesRef = ref(db, `modules/modulos`);

    const unsubscribe = onValue(modulesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setModules(data);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (modules.length > 0) {
      const foundModule = modules.find((mod) => mod.key === moduleKey);
      setCurrentModule(foundModule || null);
    }
  }, [modules, moduleKey]);

  if (!currentModule) {
    return (
      <Box sx={{ p: 6, backgroundColor: '#f5f5f5', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <Typography variant="h4" color="error">
          Módulo não encontrado
        </Typography>
      </Box>
    );
  }

  const handlePaymentSuccess = (paymentDetails) => {
    setPaymentSuccess(true);
  
    const smsCount = paymentDetails?.smsCount

    UpdatePayment(user, currentModule.key, {
      amount: paymentDetails.amount,
      method: paymentDetails.method,
      smsCount:smsCount
    });
    navigate('/apx');
  };
  
  const cleanPrice = (price) => {
    return parseInt(price.replace(/[^\d]/g, ''));
  };

  return (
    <Box sx={{ p: 6, minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', width:'100%' }}>
       <BackButton sx={{ mb: 2 }} />
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Pagamento do Módulo
      </Typography>
      <Card sx={{ width: '100%', boxShadow: 3 }}>
    
        <CardContent>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            {currentModule.name}
          </Typography>
          <Typography variant="body1" color="textSecondary" paragraph>
            {currentModule.description}
          </Typography>
          <Typography variant="h6" color="primary" fontWeight="bold">
          {currentModule?.price || ''}
          </Typography>
        </CardContent>
        <CardActions sx={{ flexDirection: 'column', alignItems: 'stretch', px: 2, pb: 2 }}>
          {!paymentSuccess && (
            <>
              {currentModule.key === 'moduloSMS' ? (
                <PaySMSCheckout
                  user={user}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              ) : (
                <PayModuleCheckout
                  user={user}
                  planPrice={cleanPrice(currentModule.price)}
                  validade={currentModule?.validade || ''}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              )}
            </>
          )}
          {paymentSuccess && (
            <Alert severity="success" sx={{ mt: 2 }}>
              Pagamento concluído com sucesso!
            </Alert>
          )}
</CardActions>

      </Card>
    </Box>
  );
};

export default PagamentoModulo;
