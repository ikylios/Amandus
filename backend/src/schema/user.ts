import { UserInputError, ForbiddenError } from 'apollo-server'
import bcrypt from 'bcryptjs'
import Crypto from 'crypto'
import User from '../model/user'
import Service from '../model/service'
import { createToken } from '../utils/token'
import config from '../utils/config'
import { validateUserArgs } from '../utils/validation'
import {
  RegisterUserInput,
  LoginUserInput,
  AddServiceArgs,
} from '../types/params'
import {
  UserType,
  AppContext,
  GitHubAuthCode,
  GitLabAuthCode,
  ServiceAuthResponse,
} from '../types/user'
import {
  requestGithubToken,
  requestGithubUserAccount,
} from '../services/gitHub'
import {
  requestGitLabToken,
  requestGitLabUserAccount,
} from '../services/gitLab'

const typeDef = `
    type ServiceUser {
      serviceName: String!
      username: String!
      email: String
      reposurl: String!
    }
    type User {
        id: Int!
        username: String!
        email: String!
        services: [ServiceUser!]
    }
`

const resolvers = {
  Query: {
    me: (
      _root: unknown,
      _args: unknown,
      context: AppContext
    ): UserType | undefined => {
      return context.currentUser
    },
    isGithubConnected: (
      _root: unknown,
      _args: unknown,
      context: AppContext
    ): boolean => {
      return !!context.githubToken
    },
    isGitLabConnected: (
      _root: unknown,
      _args: unknown,
      context: AppContext
    ): boolean => {
      return !!context.gitlabToken
    },
    githubLoginUrl: (): string => {
      const cbUrl = config.GITHUB_CB_URL || ''
      const clientID = config.GITHUB_CLIENT_ID || ''

      if (!cbUrl || !clientID) {
        throw new Error('GitHub client id or callback url not set')
      }

      return `https://github.com/login/oauth/authorize?response_type=code&redirect_uri=${cbUrl}&client_id=${clientID}&scope=repo`
    },
    gitLabLoginUrl: (): string => {
      const cbUrl = config.GITLAB_CB_URL || ''
      const clientID = config.GITLAB_CLIENT_ID || ''
      const state = Crypto.randomBytes(24).toString('hex')

      if (!cbUrl || !clientID) {
        throw new Error('GitLab client id or callback url not set')
      }

      return `https://gitlab.com/oauth/authorize?client_id=${clientID}&redirect_uri=${cbUrl}&response_type=code&state=${state}&scope=read_user+read_repository+write_repository`
    },
    currentToken: (
      _root: unknown,
      _args: unknown,
      context: AppContext
    ): string | undefined => {
      return context.githubToken
    },
  },
  Mutation: {
    connectGitService: async (
      _root: unknown,
      args: AddServiceArgs,
      context: AppContext
    ): Promise<string> => {
      if (!context.currentUser) {
        throw new ForbiddenError('You have to login')
      }

      if (!args) {
        throw new UserInputError('No service account provided')
      }

      const service = await Service.getServiceByName(args.service.serviceName)

      if (!service) {
        throw new UserInputError('Currently only Github and GitLab are supported')
      }
      
      await User.addServiceUser({
        ...args.service,
        user_id: context.currentUser.id,
        services_id: service.id,
      })

      return 'success'
    },
    authorizeWithGithub: async (
      _root: unknown,
      args: GitHubAuthCode,
      context: AppContext
    ): Promise<ServiceAuthResponse> => {
      if (!context.currentUser) {
        throw new ForbiddenError('You have to login')
      }

      if (!args.code) {
        throw new UserInputError('GitHub code not provided')
      }

      const { access_token } = await requestGithubToken(args.code)

      if (!access_token) {
        throw new UserInputError('Invalid or expired GitHub code')
      }

      const gitHubUser = await requestGithubUserAccount(access_token)

      const serviceUser = {
        serviceName: 'github',
        username: gitHubUser.login,
        email: gitHubUser.email,
        reposurl: gitHubUser.repos_url,
      }
      
      const token = createToken(context.currentUser, access_token, context.gitlabToken)

      return {
        serviceUser,
        token,
      }
    },
    authorizeWithGitLab: async (
      _root: unknown,
      args: GitLabAuthCode,
      context: AppContext
    ): Promise<ServiceAuthResponse> => {
      if (!context.currentUser) {
        throw new ForbiddenError('You have to login')
      }

      if (!args.code) {
        throw new UserInputError('GitLab code not provided')
      }

      
      const { access_token } = await requestGitLabToken(args.code)

      if (!access_token) {
        throw new UserInputError('Invalid or expired GitLab code')
      }

      const gitLabUser = await requestGitLabUserAccount(access_token)

      const serviceUser = {
        serviceName: 'gitlab',
        username: gitLabUser.username,
        email: gitLabUser.email,
        reposurl: 'https://gitlab.com/api/v4/users/' + gitLabUser.id + '/projects',
      }

      const token = createToken(context.currentUser, context.githubToken, access_token)

      return {
        serviceUser,
        token,
      }
    },
    logout: (
      _root: unknown,
      _args: undefined,
      _context: AppContext
    ): string => {
      return 'logout'
    },
    register: async (
      _root: unknown,
      args: RegisterUserInput
    ): Promise<string> => {
      const { validationFailed, errorMessage } = validateUserArgs(args)
      if (validationFailed) {
        throw new UserInputError(errorMessage)
      }

      const user = await User.registerUser(args)

      if (!user) {
        throw new UserInputError(
          'Could not create a user with given username and password'
        )
      }

      const token = createToken(user)

      return token
    },
    login: async (_root: unknown, args: LoginUserInput): Promise<string> => {
      const user = await User.findUserByUsername(args.username)

      if (!user) {
        throw new UserInputError('Invalid username or password')
      }

      const passwordMatch = await bcrypt.compare(
        args.password,
        user.password ?? ''
      )

      if (!passwordMatch) {
        throw new UserInputError('Invalid username or password')
      }

      const token = createToken(user)

      return token
    },
  },
}

export default {
  typeDef,
  resolvers,
}
