import * as Suggestion from './Suggestion';
import * as Board from './Board';
import * as Book from './Book';

const types = [];
const queries = [];
const mutations = [];

const schemas = [Suggestion, Board, Book];

schemas.forEach(s => {
  types.push(s.types);
  queries.push(s.queries);
  mutations.push(s.mutations);
});

export default `

  type Subscription {
    userAdded: User!
  }

  ${types.join('\n')}
  
  type User {
    id: Int!
    username: String!
    email: String!
    isAdmin: Boolean!
    createdAt: String!
    updatedAt: String!
    boards: [Board!]!
    suggestions: [Suggestion!]!
  }

  type AuthPayload {
    token: String!
    refreshToken: String!
  }

  type Author {
    id: Int!
    firstname: String!
    lastname: String!
    primary: Boolean
    books: [Book!]!
  }

  type Query {    
    allAuthors: [Author!]!
    allUsers: [User!]!
    me: User
    getUser(username: String!): User!
    ${queries.join('\n')}
  }

  type Mutation {
    createAuthor(firstname: String!, lastname: String!): Author!    
    createUser(username: String!): User!
    updateUser(username: String!, newUsername: String!): [Int!]!
    deleteUser(username: String!): Int!        
    register(username: String!, email: String!, password: String!, isAdmin: Boolean): User!
    login(email: String!, password: String!): AuthPayload!
    refreshTokens(token: String!, refreshToken: String!): AuthPayload!
    ${mutations.join('\n')}
  }

  schema {
    query: Query
    mutation: Mutation
    subscription: Subscription
  }
`;
