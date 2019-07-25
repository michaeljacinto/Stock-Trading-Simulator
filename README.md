# [Stock Trading Simulator](https://stocktradingsimulator.herokuapp.com/)

A stock trading application designed to replicate the use of a real stock trading platform. Suited for beginners, risk averse individuals, or experimentalists. https://stocktradingsimulator.herokuapp.com/

## Description 

This application was built on an existing team project with basic features for the class Developing Web Applications (ACIT 2520) from March 30, 2019 to April 10, 2019. It was hosted locally and used MongoDB, a NoSQL database, to store its data. To obtain stock prices the API used was from [IEX Cloud](https://iexcloud.io/). The functions of the original project were:

- Registration/Login
- Administrative Panel
  1. Delete users
  2. View all users in the database
- Stock Interactions
  1. Buying
  2. Selling
  3. Price Checks
  
The project was continued and upgraded from April 23, 2019 to May 24, 2019 for the class Agile Development Project (ACIT 2911). New features that were implemented on top of the original were:
 1. Cloud Implementation
    - Implemented cloud technologies in order to have decentralized access 
 2. Password Security
    - Password hashing
    - Account locks after numerous attempts
 3. Stock History Graph
    - Last 14 week prices for any stock is shown along with a best fit line
 4. News Feed
    - Top news articles relating to stocks is shown on the home page
    - Users may also search articles, search function designed to return stock & business related news 
 5. Stock Leaderboard
    - Shows the top users with the most cash
    - Allows for competition among our users
 6. Account Functions
    - Password recovery - Users can recover their passwords via their registered email
    - Users can change their username, password, email and name
 7. Redesigned UI
 
 ## Technologies Used 
 - NodeJS
 - HTML/CSS
 - MongoDB Atlas
 - Heroku
 - APIs
   - [NewsAPI](https://newsapi.org/)
   - [IEX Cloud](https://iexcloud.io/)
   - [IEX Trading](https://iextrading.com/)
 - Node Modules (refer to package.json)
