const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;

// Configuração do banco de dados SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: 'database.sqlite'
});

// Definir o modelo de Usuário e NotaFiscal
const User = sequelize.define('User', {
  nome: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

const NotaFiscal = sequelize.define('NotaFiscal', {
  nomeComprador: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nomeProdutor: {
    type: DataTypes.STRING,
    allowNull: false
  },
  valorTotal: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  itens: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  data: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: () => new Date().toLocaleDateString('pt-BR')
  }
});

// Relacionamento entre User e NotaFiscal
User.hasMany(NotaFiscal);
NotaFiscal.belongsTo(User);

// Middleware
app.use(express.json());
app.use(cors());

// Middleware de Autenticação (para proteger as rotas)
const autenticarToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) {
    return res.status(401).json({ mensagem: 'Acesso negado. Token não fornecido.' });
  }

  try {
    const usuarioVerificado = jwt.verify(token, 'sua-chave-secreta');
    req.usuario = usuarioVerificado;
    next();
  } catch (err) {
    res.status(400).json({ mensagem: 'Token inválido.' });
  }
};

// Rota de Cadastro
app.post('/cadastro', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const usuarioExistente = await User.findOne({ where: { email: email } });
    if (usuarioExistente) {
      return res.status(409).json({ mensagem: 'E-mail já cadastrado.' });
    }
    const salt = await bcrypt.genSalt(10);
    const senhaCriptografada = await bcrypt.hash(senha, salt);
    const novoUsuario = await User.create({ nome, email, senha: senhaCriptografada });

    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!', usuario: novoUsuario });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao cadastrar usuário.' });
  }
});

// Rota de Login
app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    const usuario = await User.findOne({ where: { email: email } });
    if (!usuario) {
      return res.status(404).json({ mensagem: 'E-mail ou senha incorretos.' });
    }
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ mensagem: 'E-mail ou senha incorretos.' });
    }

    const token = jwt.sign({ id: usuario.id, nome: usuario.nome }, 'sua-chave-secreta');
    res.status(200).json({ mensagem: 'Login bem-sucedido!', token, usuario });

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao fazer login.' });
  }
});

// Rota para salvar nota fiscal (protegida com token)
app.post('/salvar-nota', autenticarToken, async (req, res) => {
  try {
    const { nomeComprador, nomeProdutor, valorTotal, itens } = req.body;

    const novaNota = await NotaFiscal.create({
      nomeComprador,
      nomeProdutor,
      valorTotal,
      itens,
      UserId: req.usuario.id
    });

    res.status(201).json({ mensagem: 'Nota fiscal salva com sucesso!', nota: novaNota });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao salvar nota fiscal.' });
  }
});

// Rota para buscar todas as notas fiscais do usuário logado
app.get('/notas', autenticarToken, async (req, res) => {
  try {
    const notas = await NotaFiscal.findAll({
      where: { UserId: req.usuario.id },
      order: [['createdAt', 'DESC']]
    });

    res.status(200).json(notas);

  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao buscar notas fiscais.' });
  }
});

// NOVA ROTA: para buscar uma nota fiscal específica
app.get('/get-nota/:id', autenticarToken, async (req, res) => {
  try {
    const nota = await NotaFiscal.findOne({
      where: {
        id: req.params.id,
        UserId: req.usuario.id
      }
    });

    if (!nota) {
      return res.status(404).json({ mensagem: 'Nota fiscal não encontrada.' });
    }

    res.status(200).json(nota);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: 'Erro ao buscar nota fiscal.' });
  }
});


// Sincronizar modelos e iniciar o servidor
sequelize.sync() // <-- Mudei esta linha para { force: true }
  .then(() => {
    console.log('Conectado ao SQLite! Tabelas criadas/atualizadas.');
    app.listen(port, () => {
      console.log(`Servidor rodando em http://localhost:${port}`);
    });
  })
  .catch(err => {
    console.error('Erro ao conectar ou sincronizar o banco de dados:', err);
  });