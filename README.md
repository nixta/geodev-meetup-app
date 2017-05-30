# GeoDev Meetup App

This app provides three components:

1. An Event Management page.
2. An Attendee Registration page.
3. An Attendee Raffle page.

## Event Management Page
Use this page to create a new Feature that represents a meetup event.

**This page doesn't exist yet :)**

This will collect the following information:
* Location (use can use Search to find the address, or move the meetup on the map).
* Name
* Date

Once you have created an event, you can register attendees using the Attendee Registration page.

## Attendee Registration Page
The admin will set the current event.

The app will then allow people to enter their information (name, company, email, etc.) which will be written to a FeatureTable along with the key to the Meetup Feature.

Once all attendees have been registered, they can be considered for the raffle using the Attendee Raffle page.

## Attendee Raffle Page
The Attendee Raffle Page will pick users registered as attending the current meetup at random, keeping track of who has been picked so as to prevent the same name appearing twice.