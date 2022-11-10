-- insert dummy data if needed

-- Mainly for idea of formatting right now
INSERT INTO users(username, password, bithday, location1, location2, location3)
VALUES
    ('test1234', '123456789', '1999-05-12');


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

INSERT INTO cities(city, country)
VALUES
    ('Paris', 'France'),
    ('New York', 'USA'),
    ('Rome', 'Italy'),
    ('London', 'UK'),
    ('Tokyo', 'Japan'),
    ('Lisbon', 'Portugal'),
    ('Barcelona', 'Spain'),
    ('Honolulu', 'Hawaii'),
    ('Istanbul', 'Turkey'),
    ('Bangkok', 'Thailand'),
    ('Agra', 'India'),
    ('Cairo', 'Egypt'),
    ('Helsinki', 'Finland'),
    ('Ubud, Bali', 'Indonesia'),
    ('Berlin', 'Germany'),
    ('Shanghai', 'China'),
    ('Las Vegas', 'USA'),
    ('Jerusalem', 'Israel'),
    ('Venice', 'Italy'),
    ('Cape Town', 'South Africa'),
    ('Rio de Janerio', 'Brazil'),
    ('Singapore', 'Singapore'),
    ('Toronto', 'Canada'),
    ('Seoul', 'South Korea'),
    ('Casablanca', 'Morocco'),
    ('Mosco', 'Russia'),
    ('Sydney', 'Australia'),
    ('Lima', 'Peru'),
    ('Beijing', 'China'),
    ('Buenos Aires', 'Argentina'),
    