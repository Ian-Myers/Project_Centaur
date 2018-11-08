# Project_Centaur
Project Centaur is a cross-platform mobile application that is used to collect addresses and geo-coordinates (latitude and longitude) in areas with underdeveloped addressing systems and poor data and internet connectivity.

As part of a two-man team at TomTom, I was tasked with creating a mobile application that was requested by the United States Census Bureau in preparation for census 2020. This is part of an effort to create a National Address Database (https://www.transportation.gov/nad) headed by the Department of Transportation by congregating all state and local addresses into one national database.

Most physical addresses in the United States are geo-coded, meaning they have a latitude and longitude assigned to them, but many physical addresses in more remote regions of the nation do not. Puerto Rico, for example, has a very poor address system in place, and very few of the physical addresses they have on record are geo-coded. In addition, many addresses do not actually have a house or street number. To combat this, census has asked several private companies to create an easy-to-use mobile app that can be used in the field to collect the latitude and longitude using GPS satellites and manually record the physical address's attributes.
To take this one step further, we were tasked with converting the latitude and longitude into a more compact format. Latitude and longitude are lengthy and difficult to remember, and even the National Grid Zone (the coordinate system used by census) is cumbersome. There exists an open source project called Mapcode (http://www.mapcode.com/) that strives to give every possible location on the planet a compact and easy to remember code. These are short, highly accurate, and could very easily change the way we record and navigate to physical addresses.

The prerequisites set forth by census were:
 - Record a physical address's attributes (house number, street, city, etc).
 - Record a latitude/longitude and convert this to the National Grid Zone and a Mapcode.
 - Upload the data to a remote database.
 - Run entirely offline except to upload the data to the remote database.

We designed the mobile application to be cross-platform using Visual Studio, Apache-Cordova, JavaScript, and just a sprinkle of jQuery. It uses the local device's GPS chip to acquire a latitude and longitude if there is no internet or data connection. After a geolocation is recorded, the user is prompted to manually enter any physical address attributes in an input field. When there is internet connectivity, the application automatically uploads recorded addresses and geocoordinates to Amazon Web Services DynamoDB, but they can also be manually uploaded with the click of a button. In addition, we included a history page that shows all the addresses collected on the local device with functionality to delete, search, and edit the entries. These new entries are then re-uploaded to AWS to override the previous entries. Lastly, we added offline functionality to randomly generate a UUID since the Department of Transportation uses unique IDs to identify addresses in the National Address Database.

In addition to the mobile application, we also built a small web page that can query information from the AWS database and export it to a CSV file for excel. That way, users can access the address data but can't alter the database.

Due to a NDA with TomTom, I can't share any code, but below you'll find screenshots of the app and the web page in action.

![Alt text](/screenshots/HomeScreen.PNG)    ![Alt text](/screenshots/NeedLogin.PNG)

![Alt text](/screenshots/CurrentLocation.PNG)    ![Alt text](/screenshots/ConfirmCoordinates.PNG)

![Alt text](/screenshots/EmptyLog.PNG)    ![Alt text](/screenshots/FilledOutLog.PNG)

![Alt text](/screenshots/NotUploadedHistory.PNG)    ![Alt text](/screenshots/Synced.PNG)

![Alt text](/screenshots/UploadedHistory.PNG)    ![Alt text](/screenshots/Search.PNG)

![Alt text](/screenshots/Editor.PNG)    ![Alt text](/screenshots/Login.PNG)

![Alt text](/screenshots/WebPageHomeScreen.PNG)
