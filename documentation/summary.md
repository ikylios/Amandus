# Summary documentation

## Language server

### Status

Robot Framework language server was briefly tested during sprint 0. The repository has a branch named “lang-server-test” that has a prototype for running a language server and the monaco editor together. The instructions on how to get started are in the README of that branch. 
The initial discovery was that the language server responded with some suggestions to the typed content in Monaco Editor but we had no idea how it would link to syntax highlighting. The responses were in JSON format and could be logged to console. No further investigation was done after this and no parts of the prototype were used.

### Future considerations

If the language server is to be integrated to the existing structure, we feel that it should be a separate service that is somehow connected with the current frontend. 

## Robot syntax highlighting

### Status 

Syntax highlighting for the robot framework was implemented during sprint 6 and it was heavily influenced by an existing [open-source repository](https://github.com/bolinfest/monaco-tm). The version of Monaco Editor we use is different from this example repository and requires no webpack configuration. The original Monaco Editor dependency is included for typing the functions needed in setting up the language rules. Syntax highlighting is implemented with [vscode-textmate](https://github.com/microsoft/vscode-textmate) and [vscode-oniguruma](https://github.com/microsoft/vscode-oniguruma).

* Oniguruma is a regex library and it’s loaded to our frontend in WebAssembly. The vscode-oniguruma handles all the loading of the WASM file but our frontend has to fetch it from our backend first
* Textmate requires a language configuration file in json or plist format. We got the language token rules in json format for the robot framework from the [official robocorp repository](https://github.com/robocorp/robotframework-lsp).

### Future considerations

Adding a new syntax highlighting ruleset should be possible by composing a valid token rules file and applying it similarly. The [previously mentioned repository](https://github.com/bolinfest/monaco-tm) has a setup for python but the monaco-editor package used also contains many common languages by default. Information regarding default languages can be found [here](https://github.com/suren-atoyan/monaco-react).  

## Authentication and authorization 

### Status

At this moment, **all users have to register & login to the application in order to use the editor**. 

* When a user has logged in to the application and saves their changes, these changes will be automatically committed to a local repository on our server.
* If a user wants to push changes into a remote repository, they have to first authorize the application with that external service. See [Authorizing with external Git services](#authorizing-with-external-git-services).

**Note**: Users are not able to clone any repositories or create repositories of their own; the application simply clones one and the same repository from GitHub for all users to use, no matter whether they have connected to GitHub or not. 

When a user logs in to the application, the following happens:

1. The given username and password are sent as parameters to backend GraphQL with mutation login.
2. Backend queries the database for a user with the given username and if a user is returned, it checks if given password matches with the one saved in the database with the `bcryptjs` library. 
2. If a user is found and the password matches, a token is created with `jsonwebtoken` library. The token is encoded with fields 
    * **id**: user's id in the database, 
    * **username**: username and 
    * **githubToken**: value undefined at this point. 
3. This token is then returned with the response to the frontend, where the token is saved to LocalStorage. 
4. The token is read from LocalStorage and added to authorization header with each request made to the backend. 
5. The backend checks for a token with each incoming request in the context. If a token is found, 
    * The database is queried for a user with the id in the decoded token. If a user is found, it is attached to context in field `currentUser`.
    * The field `githubToken`is also decoded from the token and attached to context, whether it is undefined or not. 

## Authorizing with external Git services

### Status

As explained in the [previous section](#authentication-and-authorization), if a user wants to push changes into a remote repository, they have to first authorize the application with that external service. 

**Note**: 
* For now, the application supports Github, Gitlab and Bitbucket.
* Currently, users are not able to clone any repositories or create repositories of their own; the application simply clones one and the same repository for all users to use. 

From the user's point of view, authorizing the application with an external service means that the user has to click on the **Connect Github** (or Gitlab / Bitbucket) button in frontend and give our application the permission to perform operations on their behalf. After this, when the user saves their changes, those changes will be automatically committed and pushed to the remote repository as well.

## Enabling users to connect onto multiple external Git services 

### Status

Previously the users were able to authenticate only with Github. Having received an update, Amandus now accepts Bitbucket and Gitlab services too as a way of authentication. 

### Future considerations

In case other version control platform services emerge and if they are relevant for the Amandus userbase, they should be considered as potential additions to the ways of authentication in Amandus. 

## Git operations with SimpleGit library

### Status

Git operations in the backend are done with [SimpleGit library](https://github.com/elastic/simple-git). The features we have managed to implement are the following:

* Cloning a repository with an URL
* Checking out a local branch
* Writing to file (not a git operation but related), adding and committing changes
* Pushing with a remote token that acts as a password
* Checking for a merge conflict in a push operation and catching the error

Cloning a repository and committing changes seem to work as is. 

However, *commit operation sets the username and password to global Git config*, which will probably lead to problems as discussed in “support for multiple users”. We feel that the Git config should be set in the cloning repository phase when the users have unique repository folders. 

The commit operations are also always made with the details that the user provided when registering to the application. The original idea was to clone only repositories from a connected git service (such as GitHub) and thus, the username and email should be the ones from GitHub (or other service). The implementation is now like this for simplicity while working with the example repository.

Pushing operation is done by first creating a new git remote with a random id. The remote address is the same as origin, but with the added credentials (token) in the url that act as an authentication. After the push is done, the newly created random remote address is deleted so that the token is not saved to the repository git config details. Another approach would be to just set the git credentials to the repository config but this would need some configuration and thinking when to actually set it. Safety might also be a concern because the token acts as a password.

Merge conflict solving is handled in the push operation by first fetching the latest remote changes with git fetch and then trying to do a merge commit. If the automatic merge is impossible, the backend throws an error with a message: “merge conflict”. When any error in this step is caught, the commit is deleted and the repository is checked out to the previous branch, if changed (git reset and git checkout). The frontend catches this error and informs that the merge conflict was detected.
Checking out a branch works for local branches and the list in frontend only includes the ones created in the application because of this. Checking out to remote branches is not supported at this time.

### Future considerations

Future work on git operations could be started by first having a user specific repositories and making sure the git config is always set correctly. It would also be important to think when to do git pull operations to update the repository. Doing git pull at the wrong time will lead to issues with either conflicting files or missing git config details for automatic merge commits. Checking out to remote repositories could be supported by creating local branches that are set to track remote branches.

We have built our product to do the pulling, committing and pushing all through a git package for NPM, but another way to handle may be to handle pushing through the different account service providers' APIs. This was the plan we had in the beginning, but later changed to only use git in order to make the code more modular and eventually usable for other things as well. This may not be the best solution though.


## Concept design

### Status
Version 1 of the concept design is done and covers the general feel, features and rough look we have in mind for the project. All of the concept art were made in <a href="https://www.figma.com/">Figma</a>, and future concept art and prototyping work could continue off of what has been done already. A link to the Figma document, with edit access is in the Google Drive concept design folder.

### Future considerations
Future concept design work could revolve around thinking about usability and intuitiveness. Not all parts of the application have been prototyped 100%, but a good bit of the main functionality is done. This probably is part of the question of what functionality should be available as well, and many of the menus for example are quite lackluster to allow for restructuring with new feature ideas. Although revised, discussed and polished multiple times, our version is still v1 and for us served the purpose of feature list as well as a visual guide of what we were building. As the determined direction of the UI grows more sure, some more hi-fi prototypes could be in place.

## Deployment to production

### Status

GitHub Actions runs all the testing and deployment. This repository has a `staging` branch and `master` acts as a production branch. Our server runs two `docker-compose` files, one for staging and one for production. GitHub Actions builds and deploys the staging version when `staging` branch is updated. The image is tagged as `application-latest`. When the `master` branch is updated, an image tagged as `application-production` is pushed. Our Docker Hub repository is [here](https://hub.docker.com/repository/docker/ohtuprojekti/wevc).

The two `docker-compose` files in our server are set to track these images with [Docker watchtower](https://github.com/containrrr/watchtower). The watchtower interval is set to 15 minutes because an unregistered docker user has a limit of 100 pulls per 6 hours. Further information regarding on what is required to setup our application can be found in the [general documentation](general.md)


### Future considerations

* The GitHub Actions user credentials to Docker Hub are in GitHub secrets. These will be removed after the course is over and new configuration is required to keep using the pipeline.
  * `DOCKER_REPO` is the link to our current [repository](https://hub.docker.com/repository/docker/ohtuprojekti/wevc). Maybe next users will create a new one.
  * `DOCKER_USER` should be a valid Docker user
  * `DOCKER_TOKEN` should be a valid Docker token for the user
* The watchtower tracking of new images might not be an optimal solution unless docker credentials are also setup at the server side
* Maybe more specific image tags should be built instead of just `application-latest`

## Testing

### Status

Most of the application testing is integration testing in backend. We tested all of the important graphql mutations that handle saving a file and registering and logging in to our application. We also had some simple unit tests for functions that sanitize user inputs and define repository locations. We also have E2E-tests written in cypress that test registering and logging in to our application. 

### Future considerations

The most difficult part of testing our application is that it relies so heavily on external services. Testing things like saving file contents or connecting a GitHub user seemed to be very hard in E2E testing because they all relied on connection to GitHub. Even in the integration testing we did not get proper mocking working to test the saving to remote and connecting to GitHub. The monaco editor syntax highlighting is also completely untested because we had very little idea how it could be tested. We feel that this was somewhat acceptable for an MVP application but definitely more thinking on testing is required.

