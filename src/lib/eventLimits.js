/** Field limits shared by the event forms (maxlength) and server validation. */
export const EVENT_LIMITS = {
  name: 120,
  organizer: 120,
  location: 200,
  description: 5000,
  ticketName: 60,
  ticketDescription: 500,
  ticketQuantityMax: 100000,
  ticketPriceMax: 1000000,
  designConfigBytes: 50000,
  tagsMax: 10,
  tagLength: 30,
  url: 300,
  email: 254,
  maxPerOrderMax: 50,
};
