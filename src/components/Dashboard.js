import React from 'react';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Divider, Avatar } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const DashboardComponent = () => {
  const stats = [
    { label: 'Enablement Tasks', value: '1', icon: <AssignmentTurnedInIcon color="primary" /> },
    { label: 'Orders', value: '932', icon: <ShoppingCartIcon color="secondary" /> },
    { label: 'New Orders', value: '51', icon: <TrendingUpIcon color="success" /> },
    { label: 'Changed Orders', value: '0', icon: <PendingActionsIcon color="warning" /> },
    { label: 'Orders to Invoice', value: '5', icon: <ReceiptLongIcon color="error" /> },
  ];

  const widgets = [
    {
      title: 'Purchase Orders',
      value: '$579K USD',
      subtitle: 'Last 3 months',
      chartPlaceholder: true,
    },
    {
      title: 'Invoice Aging',
      value: '$0 USD',
      subtitle: 'Last 3 months',
      chartPlaceholder: true,
    },
    {
      title: 'My Leads',
      content: [...Array(3)].map((_, i) => ({
        title: `RFI - RFP #${i + 1}`,
        dueDate: `Due: Apr 0${i + 5}, 2021`,
      })),
    },
    {
      title: 'Company Profile',
      value: '95% Completed',
      progress: 95,
    },
  ];

  return (
    <Box sx={{ padding: 3, backgroundColor: '#eef2f7', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary">
          Dashboard Overview
        </Typography>
        <Typography variant="subtitle1" color="text.secondary">
          Last 31 days
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={3}>
        {stats.map((item, index) => (
          <Grid item xs={6} sm={4} md={2.4} key={index}>
            <Card
              sx={{
                display: 'flex',
                alignItems: 'center',
                padding: 2,
                backgroundColor: '#ffffff',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                borderRadius: 2,
              }}
            >
              <Avatar sx={{ backgroundColor: '#f0f0f0', mr: 2 }}>{item.icon}</Avatar>
              <Box>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  {item.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.label}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Divider sx={{ my: 4 }} />

      {/* Widgets */}
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }} color="primary">
        My Widgets
      </Typography>
      <Grid container spacing={3}>
        {widgets.map((widget, index) => (
          <Grid item xs={12} md={4} key={index}>
            <Card sx={{ backgroundColor: '#ffffff', boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', borderRadius: 2 }}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight="bold" color="text.primary" gutterBottom>
                  {widget.title}
                </Typography>
                {widget.chartPlaceholder ? (
                  <>
                    <Typography variant="h4" color="primary" fontWeight="bold">
                      {widget.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {widget.subtitle}
                    </Typography>
                    <Box
                      sx={{
                        mt: 2,
                        height: 100,
                        backgroundColor: '#e8eaf6',
                        borderRadius: 1,
                      }}
                    />
                  </>
                ) : widget.progress ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">
                      {widget.value}
                    </Typography>
                    <CircularProgress variant="determinate" value={widget.progress} />
                  </Box>
                ) : (
                  <Box>
                    {widget.content.map((lead, i) => (
                      <Box key={i} sx={{ mb: 2 }}>
                        <Typography variant="body2" fontWeight="bold" color="text.primary">
                          {lead.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {lead.dueDate}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardComponent;
