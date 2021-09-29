import React from 'react'
import MonacoDiffEditor from './MonacoDiffEditor'
import Sidebar from './Sidebar'
import { useLocation } from 'react-router-dom'
import { useLazyQuery, useQuery } from '@apollo/client'
import { RepoStateQueryResult } from '../types'
import { REPO_STATE, CLONE_REPO } from '../graphql/queries'
import { createStyles, makeStyles } from '@material-ui/core/styles'

const EditView = () => {
  const location = useLocation()
  const classes = useStyles()

  const [
    repoStateQuery,
    { data: repoStateData },
  ] = useLazyQuery<RepoStateQueryResult>(REPO_STATE)
  const cloneRepoQuery = useQuery(CLONE_REPO, {
    onCompleted: () => repoStateQuery(),
  })

  if (cloneRepoQuery.error){
    console.log(`Clone error: ${cloneRepoQuery.error}`)
  }

  if (cloneRepoQuery.loading) return <div>Cloning repo...</div>
  if (cloneRepoQuery.error) return <div>Error cloning repo...</div>

  // TODO: "can't perform react state update on unmounted component "
  // if (repoStateLoading) return <div>Fetching repo state...</div>
  // if (repoStateError) return <div>Error fetching repo state...</div>

  const files = repoStateData ? repoStateData.repoState.files : []
  const filename = location.search.slice(3)
  const content = files.find((e) => e.name === filename)?.content
  const commitMessage = repoStateData ? repoStateData.repoState.commitMessage : ''

  return (
    <div className={classes.root}>
      <div className={classes.sidebar}>
        <Sidebar files={files} />
      </div>
      <div className={classes.editor}>
        <MonacoDiffEditor original="previous state of code" modified="incoming changes" content={content} filename={filename} commitMessage={commitMessage}/>
      </div>
    </div>
  )
}

const useStyles = makeStyles(() =>
  createStyles({
    root: {
      display: 'flex',
    },
    sidebar: {
      flexShrink: 0,
      width: '20%',
    },
    editor: {
      flexGrow: 1,
    },
  })
)

export default EditView
