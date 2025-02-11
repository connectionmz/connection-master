require("dotenv").config();
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// Configuração do Nodemailer
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: 'mohammadvicentesaide@gmail.com',  // Pegando o email do arquivo .env
        pass: 'sdcddbdsbmszbvah' // Pegando a senha do arquivo .env
    }
});

app.post("/send-email", async (req, res) => {
    const { to, subject, text } = req.body;

    try {
        await transporter.sendMail({
            from: 'mohammadvicentesaide@gmail.com',
            to,
            subject,
            text
        });
        res.status(200).json({ message: "Email enviado com sucesso!" });
    } catch (error) {
        res.status(500).json({ message: "Erro ao enviar email", error });
    }
});

// Inicia o servidor
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
