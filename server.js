const express = require('express');
const graphqlHTTP = require('express-graphql');
const {buildSchema} = require('graphql');
const fs = require('fs');

const schema = buildSchema(`
  type Query {
    note(id: Int!): Note
    notes: [Note]
  },
  type Note {
    id: Int
    content: String
  }
  type Mutation {
    updateNote(id: Int!, content: String!): Note
  }
`);

const dataDir = `/Users/zemke/Code/notes/data`;

const readNote = id =>
  fs.readFileSync(`${dataDir}/${id}.md`, 'utf8');

const readNotes = id =>
  fs.readdirSync(`${dataDir}`, 'utf8')
    .filter(file => file.endsWith('.md'))
    .map(file => ({
      id: parseInt(file.substr(0, file.length - 3)),
      content: fs.readFileSync(`${dataDir}/${file}`, 'utf8')
    }));

const root = {
  note: ({id}) => ({id, content: readNote(id)}),
  notes: readNotes,
  updateNote: ({id, content}) =>
    notes
      .map(note => {
        if (note.id === id) note.content = content;
        return note;
      })
      .filter(note => note.id === id)[0]
};

const app = express();
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true,
}));
const port = 4000;
app.listen(port, () => console.log(`Now browse to localhost:${port}/graphql`));

// curl -X POST 'http://localhost:4000/graphql' -H 'Content-Type: application/json' -d '{"query": "query getAllNotes {notes {id, content}}"}'
