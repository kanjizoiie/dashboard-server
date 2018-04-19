# Dashboard

This is a dashboard that will show near realtime data.

## Api-endpoint
This is what provides the api for the gui to fetch data from. \
There is a lot of paths to choose from i will list some of them here below.
### Data
* */api/data/server/:id* 
* */api/data/server/:id/graphs* 
* */api/data/news/* 
* */api/data/news/channel* 
* */api/data/status/* 
* */api/data/* 
### Lights
* */api/light/* 
* */api/light/:id/green* 
* */api/light/:id/yellow* 
* */api/light/:id/red*
## How do you add servers?
1. You will need a **SQLite3** client to access the database at this time. 
    > **NOTE** I recommend https://sqlitestudio.pl/index.rvt?act=download for the database access.
1. Then you will have to search open and search for a file called **database.sqlite** which resides in the folder *src/database/*
1. Open the table called **servers**
1. In here you can find all of the current servers with their corresponding columns .
    * **id** should autoset on insertion.
    * **hostname** the address to the server
    * **viewId** the servers view id in analytics
    * **nagios:** the servers service name in nagios
    > You can leave anyone of these empty, but for the best experience i would suggest that you fill all of the fields 🐱
1. Add a **new row** to the table.
1. Insert the **different values** into the **columns** for the newly added server.
1. Write the changes to the database.
1. The **dashboard** should now show these changes.
    > If this doesn't update on the **dashboard** you may have to restart the **server** and/or the **gui**.


## How do you remove servers?
1. You will need a **SQLite3** client to access the database at this time. 
    > **NOTE** I recommend https://sqlitestudio.pl/index.rvt?act=download for the database access.
1. Then you will have to search open and search for a file called **database.sqlite** which resides in the folder *src/database/*
1. Open the table called **servers**
1. In here you can find all of the current servers with their corresponding columns .
    * **id** should autoset on insertion.
    * **hostname** the address to the server
    * **viewId** the servers view id in analytics
    * **nagios:** the servers service name in nagios
1. Remove the row with the **server** which you want to delete.
1. Write the changes to the database.
1. The **dashboard** should now show these changes.
    > If this doesn't update on the **dashboard** you may have to restart the **server** and/or the **gui**.