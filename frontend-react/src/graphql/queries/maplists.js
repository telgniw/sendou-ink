import { gql } from "apollo-boost"

export const maplists = gql`
  {
    maplists {
      name
      sz
      tc
      rm
      cb
    }
  }
`
