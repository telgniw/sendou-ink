import React, { useState } from 'react'
import { Menu, Segment } from 'semantic-ui-react'
import { withRouter } from 'react-router-dom'
import { memCakes } from '../utils/lists'

const MainMenu = withRouter(({ history, menuSelection, setMenuSelection }) => {
  const [memCakePic, setMemCakePic] = useState(memCakes[Math.floor(Math.random()*memCakes.length)])
  return (
    <Segment inverted>
      <Menu inverted secondary>
        <Menu.Item>
          <img src={process.env.PUBLIC_URL + `/memCakes/${memCakePic}`} alt="mem cake logo" onClick={() => setMemCakePic(memCakes[Math.floor(Math.random()*memCakes.length)])}/>
        </Menu.Item>
        <Menu.Item 
          name='home' 
          active={menuSelection === 'home'} 
          onClick={() => { 
            history.push('/')
            setMenuSelection('home')
          }} 
        />
        <Menu.Item
          name='top 500 search'
          active={menuSelection === 'search'}
          onClick={() => { history.push('/xsearch') }}
        />
        <Menu.Item
          name='leaderboards'
          active={menuSelection === 'leaderboards'}
          onClick={() => { history.push('/xleaderboard') }}
        />
      </Menu>
    </Segment>
  )
})

export default MainMenu