import React from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
    createStyles,
    makeStyles,
    Link,
  } from '@material-ui/core'

interface Props {
  theme: string
}

const stylesInUse = makeStyles(() =>
  createStyles({
    logo: {
      zIndex: 1250,
      width: '210px',
      marginRight: '2em'
    },
    logoImg: {
        width: '100%',
        height: 'auto',
        display: 'block'
    }
  })
)

const Logo = ({ theme }: Props) => {
  
  const classes = stylesInUse()
  
  const logoImg = theme === 'dark' ? '/img/logo-dark.png' : '/img/logo-light.png'

  return (
    <Link component={RouterLink} className={classes.logo} to="/">      
        <img 
            src={process.env.PUBLIC_URL + logoImg} 
            className={classes.logoImg} 
            alt="Amandus"
        />
    </Link>
  )
}

export default Logo
