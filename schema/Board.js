export const types = `
type Board {
  id: Int!
  name: String!
  suggestions: [Suggestion!]!
  owner: Int!
}
`;

export const queries = `
allBoards: [Board!]!     
userBoards(owner: Int!): [Board!]!
`;

export const mutations = `
createBoard(owner: Int!, name: String!): Board!    
`;
