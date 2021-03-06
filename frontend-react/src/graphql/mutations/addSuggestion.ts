import { gql, DocumentNode } from "apollo-boost"

export const ADD_SUGGESTION: DocumentNode = gql`
  mutation addSuggestion(
    $discord_id: String!
    $region: String!
    $server: String!
    $description: String!
  ) {
    addSuggestion(
      discord_id: $discord_id
      region: $region
      server: $server
      description: $description
    )
  }
`
