const express = require('express');
const graphqlHTTP = require('express-graphql');
const {buildSchema} = require('graphql');
const fs = require('fs');

const port = process.argv[2] || 4000;

const schema = buildSchema(`
  type Query {
    note(id: Int!): Note
    notes: [Note]
  },
  type Note {
    id: Int
    content: [String]
  }
  type Mutation {
    updateNote(id: Int!, content: [String]!): Note
  }
`);

const dataDir = `${__dirname}/data`;

const readNote = id =>
  fs.readFileSync(`${dataDir}/${id}.md`, 'utf8')
    .trim()
    .split('\n');

const readNotes = () =>
  fs.readdirSync(`${dataDir}`, 'utf8')
    .filter(file => file.endsWith('.md'))
    .map(file => ({
      id: parseInt(file.substr(0, file.length - 3)),
      content: fs.readFileSync(`${dataDir}/${file}`, 'utf8')
        .trim()
        .split('\n')
    }));

const root = {
  note: ({id}) => ({id, content: readNote(id)}),
  notes: readNotes,
  updateNote: ({id, content}) => {
    fs.writeFileSync(`${dataDir}/${id}.md`, content.join('\n'));
    return {id, content: readNote(id)};
  }
};

const app = express();
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));
app.get('/', (req, res) =>
  res.sendFile('index.html', {root: __dirname}));
app.get('/vendor/vue.js', (req, res) =>
  res.sendFile('node_modules/vue/dist/vue.min.js', {root: __dirname}));
app.listen(port, () =>
  console.log(`Now browse to localhost:${port}/graphql`));

// curl -X POST 'http://localhost:4000/graphql' -H 'Content-Type: application/json' -d '{"query": "query getAllNotes {notes {id, content}}"}'
