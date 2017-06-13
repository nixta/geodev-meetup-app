# GeoDev Meetup/Hackerlab Apps

This repository contains all the apps for the GeoDev Meetup and Hackerlab events. The purpose of these apps is to ensure that we are effectively capturing attendees information.  There are four components:

1. An Event Management app.
2. A GeoDev Registration app.
3. A GeoDev Name Picker app.
4. An Attendee Viewer app. 

## Event Management
Use this [Event Management app](http://edn1.esri.com/eventmanagement/index.html) to create a new Feature that represents a meetup or hackerlab event.

This will collect the following information:
* Event Name
* Date (by default the timestamp is 12 am to ensure we record the event on the current date)
* Event Type (e.g., meetup or hackerlab)
* Voucher Code
* Location (use can use the Search tab to find the address, the Lat/Lon tab or click on the map to add a point)

Once you have created an event, you can register attendees using the GeoDev Registration app.

## GeoDev Registration
The individual handling the check in will set the event by selecting it from the list of meetups or hackerlabs created via the Event Management app.
The [GeoDev Registration app](http://edn1.esri.com/meetup/register.html) will then allow people to enter their information (name, company, email, etc.) which will be written to a FeatureTable along with the key to the Meetup Feature.

Once all attendees have been registered, they can be considered for the giveaway using the GeoDev Name Picker.

## GeoDev Name Picker
The individual running the meetup will set the event by selecting it from the list created via the Event Management app.
The [GeoDev Name Picker](http://edn1.esri.com/meetup/winner.html#) will pick a random attendee for the giveaway. It also allows the removal of an attendee in case the winner is not present or cannot attend DevSummit.

## Attendee Viewer
The [Attendee Viewer](http://edn.maps.arcgis.com/apps/webappviewer/index.html?id=028e1ab825ab4b30bb8dea1bfd4ac5b9) allows the view of all attendees associated with an event using related tables. These records can filtered using a filter expression by the event key (e.g., Tucson GDMU 2017-04-14 or Tucson HL 2017-04-14) and they can also be exported. 