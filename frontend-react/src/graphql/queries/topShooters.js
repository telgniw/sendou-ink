import { gql } from "apollo-boost"

export const topShooterPlayers = gql`
  {
    topShooterPlayers {
      id
      unique_id
      name
      alias
      twitter
      topShooterScore
      topShooter {
        name
        weapon
        mode
        x_power
        rank
        month
        year
      }
    }
  }
`
