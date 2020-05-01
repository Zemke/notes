const express = require('express');
const graphqlHTTP = require('express-graphql');
const {buildSchema} = require('graphql');

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

const notes = [
  {id: 1, content: "There's a lot to learn."},
  {id: 2, content: "GraphQL solves all of our problems."},
];

const root = {
  note: args => notes.filter(user => user.id === args.id)[0],
  notes: () => notes,
  updateNote: ({id, content}) =>
    notes
      .map(note => {
        if (note.id === id) {
          note.name = name;
          note.content = content;
          return note;
        }
      })
      .filter(user => user.id === id)[0]
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
