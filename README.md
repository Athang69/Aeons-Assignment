# Quiz Application 

This is a quiz application for Aeons SDE Intern Project 

### Building

This project uses Turborepo which is used here to optimize build times during testing as this caches the previous builds. 

```sh
npx create-turbo@latest
```

## Backend

It consists of 6 EndPoints
- `signup`: User can Signup using email, username, password and it will be stored in DB
- `signin`: User can Signin using the email and password, DB will verify it and return a JWT to the user
- `auth middleware`: It consists of validating the user based on the JWT provided in headers and assigning its userId in req model of express
- `dashboard`: It shows the users all quizes they created and attempted and their maxScore
- `/quiz/create`: It is used to create a quiz (only for logged in users i.e passed through auth middleware)
- `/quiz/:id`: It is a public EP (i.e. doesnt require user to be logged in (auth)) Anyone can attempt the quiz based on its Id as a path params
- `/quiz/:id/attempt`: It is authenticated EP and user can attempt the questions and the backend will return pointsAwarded, score and maxScore for that particular question 




