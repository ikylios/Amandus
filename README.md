# WEVC

Web application to edit Robot Framework files remotely

[Application in production](http://135.181.89.96:4000/)

## How to run locally

* Requirements: `docker`

1. Create the `.env` file in `/backend` with the proper values (see `backend/.env.dist`)
     1. Check [Backend documentation](/documentation/backend.md) for more details on environment values if needed
2. Run `sudo docker-compose build`
3. Run `sudo docker-compose up`
4. The application should be viewable in `localhost:3000`


## Documentation

[General](documentation/general.md)

[Frontend documentation](/documentation/frontend.md)

[Backend documentation](/documentation/backend.md)

[Working hours](https://docs.google.com/spreadsheets/d/1YDC3QcxFgtNw_KvYTQlDE8rA0DA7rvMYv_ZlsHXdvww)

### Definition of done

- Feature is implemented
- Tests are passed
- Code is reviewed: at least 2 persons have accepted changes in the pull request
- Feature is merged to staging and staging environment works as expected
- Documentation is updated to match the state of the application
