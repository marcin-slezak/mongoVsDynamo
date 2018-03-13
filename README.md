# Bunch of tests to compare Mongo vs DynamoDB
## Requirements
- Installed:
    - node
    - npm
    - docker
- access to Internet



## Instalation & Run
- download
- install dependencies `npm install`
- set up local MongoDb and DynamoDB services using docker containers
    - `docker docker run -p 8000:8000 --name localDynamoDb dwmkerr/dynamodb`
    - `docker run -p 27017:27017 --name localMongoDb mongo`
- run tests by `npm test`



