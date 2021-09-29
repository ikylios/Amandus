import React, { useEffect, useState } from 'react'
import { useHistory } from 'react-router-dom'
import { ChevronRight, ExpandMore } from '@material-ui/icons'
import { TreeItem, TreeView } from '@material-ui/lab'
import { File, FileTree } from '../types'
import { makeStyles } from '@material-ui/core/styles'
import { parseToFileTree } from '../utils/files'

interface PropsType {
  files: File[]
}

const useStyles = makeStyles({
  root: {
    height: 110,
    flexGrow: 1,
    maxWidth: 400,
    marginLeft: '2px',
  },
})

const FileTreeView = ({ files }: PropsType) => {
  const [fileTree, setFileTree] = useState<FileTree>()

  const classes = useStyles()
  const history = useHistory()

  useEffect(() => {
    setFileTree(parseToFileTree(files))
  }, [files])

  const handleClick = (path: string, type: string) => {
    if (type === 'folder') {
      return () => {}
    }
    return () => {
      history.push(`edit?q=${path}`)
    }
  }

  const renderTree = (fileTree: FileTree) => {
    return fileTree.children.map((node) => buildTree(node))
  }

  const buildTree = (fileTree: FileTree) => {
    return (
      <TreeItem
        key={fileTree.path}
        nodeId={fileTree.path}
        onClick={handleClick(fileTree.path, fileTree.type)}
        label={fileTree.name}
      >
        {fileTree.children.length !== 0
          ? fileTree.children.map((node) => buildTree(node))
          : null}
      </TreeItem>
    )
  }

  if (!fileTree) {
    return <div>No files...</div>
  }

  return (
    <TreeView
      className={classes.root}
      defaultCollapseIcon={<ExpandMore />}
      defaultExpandIcon={<ChevronRight />}
    >
      {renderTree(fileTree)}
    </TreeView>
  )
}

export default FileTreeView
