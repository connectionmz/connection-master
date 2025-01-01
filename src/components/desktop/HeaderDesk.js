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
  import { Link } from "react-router-dom";
import { logo } from "../../utils/utils";
import { AppBar, Box, IconButton, InputBase, Toolbar, Typography } from "@mui/material";

  
const HeaderDesk = ()=>{
    return(<>
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
              }}>
              <Search sx={{ color: "gray" }} />
              <InputBase placeholder="Pesquisar" sx={{ ml: 1 }} />
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={3}>

  {/* Empresas */}
  <Link to="/explore">
    <IconButton sx={{ color: "black" }}>
      <BusinessCenter />
    </IconButton>
  </Link>

  {/* Artigos */}
  <Link to="/d">
    <IconButton sx={{ color: "black" }}>
      <Article />
    </IconButton>
  </Link>

  {/* Mensagens */}
  <Link to="/cotacoes">
    <IconButton sx={{ color: "black" }}>
      <Message />
    </IconButton>
  </Link>

  {/* Conta do Usuário */}
  <Link to="/perfil">
    <IconButton sx={{ color: "black" }}>
      <AccountCircle />
    </IconButton>
  </Link>


</Box>

        </Toolbar>
      </AppBar></>)
}
export default HeaderDesk