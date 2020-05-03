const express = require('express');
const favicon = require('serve-favicon');
const graphqlHTTP = require('express-graphql');
const jwtMiddleware = require('express-jwt');
const {buildSchema} = require('graphql');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const port = process.argv[2] || 4000;

const schema = buildSchema(`
  type Query {
    note(id: Int!): Note
    notes: [Note]
    newNote: Note
  },
  type Note {
    id: Int
    content: [String]
  }
  type Mutation {
    updateNote(id: Int!, content: [String]!): Note
    deleteNote(id: Int!): Boolean
  }
`);

const dataDir = path.join(__dirname, 'data');

const readNote = id =>
  fs.readFileSync(path.join(dataDir, `${id}.md`), 'utf8')
    .trim()
    .split('\n');

const root = {
  note: ({id}) => ({id, content: readNote(id)}),
  notes: () =>
    fs.readdirSync(`${dataDir}`, 'utf8')
      .filter(file => file.endsWith('.md'))
      .map(file => ({
        id: parseInt(file.substr(0, file.length - 3)),
        content: fs.readFileSync(path.join(dataDir, file), 'utf8')
          .trim()
          .split('\n')
      })),
  updateNote: ({id, content}) => {
    fs.writeFileSync(path.join(dataDir, `${id}.md`), content.join('\n'));
    return {id, content: readNote(id)};
  },
  deleteNote: ({id}) => {
    fs.unlinkSync(path.join(dataDir, `${id}.md`));
    return true;
  },
  newNote: () => ({
    id: root.notes().map(note => note.id).sort().reverse()[0] + 1,
    content: [""]
  })
};

const app = express();
const props = JSON.parse(fs.readFileSync(path.join(__dirname, `.props.json`), 'utf8'));
app.use(favicon(path.join(__dirname, 'favicon.ico')));
app.use(express.json());
app.post('/authentication', (req, res) => {
  if (req.body.password !== props.password) {
    return res.status(401).send('Wrong credentials.');
  }
  return res.json({token: jwt.sign({}, props["jwtSecret"])})
});
app.get('/', (req, res) =>
  res.sendFile('index.html', {root: __dirname}));
app.get('/sw.js', (req, res) =>
  res.sendFile('sw.js', {root: __dirname}));
app.get('/manifest.json', (req, res) =>
  res.sendFile('manifest.json', {root: __dirname}));
app.get('/icons/icon192.png', (req, res) =>
  res.sendFile(path.join('icons', 'icon192.png'), {root: __dirname}));
app.get('/icons/icon512.png', (req, res) =>
  res.sendFile(path.join('icons', 'icon512.png'), {root: __dirname}));
app.get('/icons/maskable.png', (req, res) =>
  res.sendFile(path.join('icons', 'maskable.png'), {root: __dirname}));
app.use(jwtMiddleware({secret: props["jwtSecret"]}).unless({path: ['/authentication', '/']}));
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: false,
}));
app.listen(port, () =>
  console.log(`Now browse to localhost:${port}/graphql`));

// curl -X POST 'http://localhost:4000/graphql' -H 'Content-Type: application/json' -d '{"query": "query getAllNotes {notes {id, content}}"}'
