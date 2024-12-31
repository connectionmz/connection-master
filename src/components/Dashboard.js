import React from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Avatar,
  IconButton,
  InputBase,
  Container,
  Grid,
  Paper,
  Button,
  List,
  ListItem,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Search,
  Notifications,
  Message,
  AccountCircle,
  Home,
  BusinessCenter,
  People,
  Article,
} from "@mui/icons-material";
import { logo } from "../utils/utils";
import { Link } from "react-router-dom";
import MarqueeParceiros from "./MarqueeParceiros";
import MarqueeAnuncios from "./MarqueeAnuncios";
import StorieList from "./StorieList";

const Dashboard = ({ user }) => {
  return (
    <Box sx={{ backgroundColor: "#f3f2ef", minHeight: "100vh" }}>
      {/* Navbar */}
      <AppBar position="sticky" sx={{ backgroundColor: "#F1F1F1" }}>
        <Toolbar sx={{ justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Typography variant="h6" sx={{ fontWeight: "bold" }}>
              <Link to="/" className="flex items-center space-x-2">
                <img src={logo} alt="Logo" style={{ width: "20%" }} />
              </Link>
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "white",
                borderRadius: 1,
                padding: "0 10px",
                width: 300,
              }}
            >
              <Search sx={{ color: "gray" }} />
              <InputBase placeholder="Pesquisar" sx={{ ml: 1 }} />
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={3}>
            <IconButton sx={{ color: "black" }}>
              <Home />
            </IconButton>
            <IconButton sx={{ color: "black" }}>
              <People />
            </IconButton>
            <IconButton sx={{ color: "black" }}>
              <BusinessCenter />
            </IconButton>
            <IconButton sx={{ color: "black" }}>
              <Article />
            </IconButton>
            <IconButton sx={{ color: "black" }}>
              <Notifications />
            </IconButton>
            <IconButton sx={{ color: "black" }}>
              <Message />
            </IconButton>
            <IconButton sx={{ color: "black" }}>
              <AccountCircle />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <MarqueeParceiros />
        <StorieList user={user.provincia}/> 
        <MarqueeAnuncios />

        <Grid container spacing={2}>
          <Grid item xs={3}>
            <Paper sx={{ padding: 2, height: "100%" }}>
              <Typography variant="body2" align="center" color="textSecondary">
                Espaço reservado para anúncios do Google Ads
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={6}>
            <Paper sx={{ padding: 2, marginBottom: 2 }}>
              <Typography variant="h6">Comece uma publicação</Typography>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                  mt: 2,
                }}
              >
                <Avatar>A</Avatar>
                <InputBase
                  placeholder="No que você está pensando?"
                  fullWidth
                  sx={{
                    backgroundColor: "#f3f2ef",
                    padding: 1,
                    borderRadius: 1,
                  }}
                />
              </Box>
            </Paper>

            {["Celebrating a Milestone", "Achieved a Goal", "Started a New Job"].map(
              (post, index) => (
                <Paper key={index} sx={{ padding: 2, marginBottom: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                    {post}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis
                    vehicula fermentum justo.
                  </Typography>
                </Paper>
              )
            )}
          </Grid>
          <Grid item xs={3}>
            <Paper sx={{ padding: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: "bold" }}>
                Empresas
              </Typography>
              <List>
                {["Connection Mozambique", "MotorTech,LDA", "NovaEmpresa"].map(
                  (company, index) => (
                    <ListItem key={index} disablePadding>
                      <ListItemText primary={company} />
                    </ListItem>
                  )
                )}
              </List>
              <Divider sx={{ my: 2 }} />
              <Button fullWidth variant="text" sx={{ color: "#0a66c2" }}>
                Ver todas
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Dashboard;
