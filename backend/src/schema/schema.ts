import { makeExecutableSchema } from 'graphql-tools'
import repository from './repository'
import user from './user'

const Query = `
    type Query {
        githubLoginUrl: String!
        bitbucketLoginUrl: String!
        gitLabLoginUrl: String!
        me: User
        isGithubConnected: Boolean!
        isGitLabConnected: Boolean!
        isBitbucketConnected: Boolean!
        getRepoState(url: String): RepoState!
        cloneRepository(url: String!): String
        currentToken: String
    },
`

const Mutation = `
    type Tokens {
        accessToken: String
        refreshToken: String
    }
    type ServiceAuthResponse {
        serviceUser: ServiceUser
        tokens: Tokens
    }
    type LocalUser {
        user_id: Int
        username: String
        email: String
    }
    input AddServiceArgs {
        serviceName: String!
        username: String!
        email: String
        reposurl: String!
    }
    type GithubAccount {
        username: String
        email: String
    }
    type Mutation {
        logout: String
        register(
            username: String!
            email: String!
            password: String!
        ): Tokens
        login(
            username: String!
            password: String!
        ): Tokens
        saveChanges(
            file: FileInput! 
            branch: String!
            commitMessage: String
        ): String
        connectGitService(
            service: AddServiceArgs!
        ): String
        switchBranch(
            url: String!
            branch: String!
        ): String
        authorizeWithGithub(
            code: String!
        ): ServiceAuthResponse
        authorizeWithBitbucket(
            code: String!
        ): ServiceAuthResponse
        authorizeWithGitLab(
            code: String!
        ): ServiceAuthResponse
        pullRepository(url: String!): String
    }
`

const rootSchema = makeExecutableSchema({
  typeDefs: [Query, Mutation, user.typeDef, repository.typeDef],
  resolvers: [user.resolvers, repository.resolvers],
})

export default rootSchema
