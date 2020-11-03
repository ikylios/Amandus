import { gql } from '@apollo/client'

export const REPO_STATE = gql`
  query {
    repoState: getRepoState(
      url: "https://github.com/ohtuprojekti-eficode/robot-test-files"
    ) {
      currentBranch
      files {
        name
        content
      }
      branches
    }
  }
`

export const GITHUB_LOGIN_URL = gql`
  query {
    githubLoginUrl
  }
`

export const ME = gql`
  query {
    me {
      id
      username
      emails
      gitHubId
      gitHubLogin
      gitHubEmail
      gitHubReposUrl
      gitHubToken
    }
  }
`
