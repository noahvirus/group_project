-- insert dummy data if needed

-- Mainly for idea of formatting right now
INSERT INTO users(username, password, bithday, location1, location2, location3)
VALUES
    ('test1234', '123456789', '1999-05-12', 'Paris', 'Tokyo', 'Berlin');


INSERT INTO locations(locationName, high, low, weatherCondition, humidity)
VALUES
    ('Paris', 23.2, 12.5, 'Sunny', 0.87),
    ('Tokyo', 24.6, 11.3, 'Cloudy', 0.65),
    ('Berlin', 22.3, 10.9, 'Rainy', 0.99);

INSERT INTO usersToLocations(userID, locationID)
VALUES
    (1,1),
    (1,2),
    (1,3);