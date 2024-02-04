# thunder-replay-server

Node Server for replaying war thunder localhost data

## Database

The database is a PostgreSQL database. The database is hosted on an internal server.

Table names are as follows:

- `sessions` - Contains the session data this is used to relate the data to a specific game session
- `states` - Contains the response data from the game for the `/state` endpoint
- `indicators` - Contains the response data from the game for the `/indicators` endpoint
- `hudmsg` - Contains the response data from the game for the `/hudmsg` endpoint
- `gamechat` - Contains the response data from the game for the `/gamechat` endpoint

### Sessions Table

| Column Name | Data Type | Description                            |
| ----------- | --------- | -------------------------------------- |
| id          | SERIAL    | Unique `primary key` for the session   |
| length      | INTEGER   | Length of the session in seconds       |
| date        | TIMESTAMP | Date and time the session was recorded |

### States Table

| Column Name | Data Type | Description                                               |
| ----------- | --------- | --------------------------------------------------------- |
| id          | SERIAL    | Unique `primary key` for the state                        |
| session_id  | INTEGER   | `foreign key` to the `sessions` table                     |
| data        | JSONB     | The response data from the game for the `/state` endpoint |
| timestamp   | TIMESTAMP | Date and time the state was recorded                      |

### Indicators Table

| Column Name | Data Type | Description                                                    |
| ----------- | --------- | -------------------------------------------------------------- |
| id          | SERIAL    | Unique `primary key` for the indicator                         |
| session_id  | INTEGER   | `foreign key` to the `sessions` table `indexed`                |
| data        | JSONB     | The response data from the game for the `/indicators` endpoint |
| timestamp   | TIMESTAMP | Date and time the indicator was recorded                       |

### Hudmsg Table

| Column Name | Data Type | Description                                                |
| ----------- | --------- | ---------------------------------------------------------- |
| id          | SERIAL    | Unique `primary key` for the hudmsg                        |
| session_id  | INTEGER   | `foreign key` to the `sessions` table                      |
| data        | JSONB     | The response data from the game for the `/hudmsg` endpoint |
| timestamp   | TIMESTAMP | Date and time the hudmsg was recorded                      |

### Gamechat Table

| Column Name | Data Type | Description                                                  |
| ----------- | --------- | ------------------------------------------------------------ |
| id          | SERIAL    | Unique `primary key` for the gamechat                        |
| session_id  | INTEGER   | `foreign key` to the `sessions` table                        |
| data        | JSONB     | The response data from the game for the `/gamechat` endpoint |
| timestamp   | TIMESTAMP | Date and time the gamechat was recorded                      |

Connecting to the database can be done using the following command:

```
psql -U postgres -h 10.10.0.216
```
