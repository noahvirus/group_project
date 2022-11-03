-- Create a user table
CREATE TABLE IF NOT EXISTS users 
(
    userID SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(60) NOT NULL,
    birthday DATE,
    location1 VARCHAR(50),
    location2 VARCHAR(50),
    location3 VARCHAR(50)
)



-- create some kind of table to store API calls
CREATE TABLE IF NOT EXISTS locations
(
    locationID SERIAL PRIMARY KEY,
    locationName VARCHAR(50) NOT NULL,
    high DECIMAL(5,2),
    low DECIMAL(5,2),
    weatherCondition VARCHAR(50),
    humidity DECIMAL(2,2)
)
-- will create when I know what we need from a API call



-- create table to link users and locations as it is many to many
CREATE TABLE IF NOT EXISTS usersToLocations
(
    userToLocationID SERIAL PRIMARY KEY,
    userID INTEGER NOT NULL,
    locationID INTEGER NOT NULL,
    FOREIGN KEY (userID) REFERENCES users(userID) ON UPDATE CASCADE,
    FOREIGN KEY (locationID) REFERENCES locations(locationID) ON UPDATE CASCADE,
)