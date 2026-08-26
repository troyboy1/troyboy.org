(() => {
  'use strict';

  const STORAGE_KEY = 'weddingSeatingPlanner.v1';
  const ACCESS_CODE_KEY = 'weddingSeatingPlanner.accessCode.v1';
  const ZOOM_KEY = 'weddingSeatingPlanner.zoom.v2';
  const CLOUD_SAVE_DELAY = 650;
  const GRID = 10;

  // V2 layout: larger ballroom drawing + substantially smaller round tables.
  // This lets each room comfortably display roughly 9–12 round tables instead of ~4.
  const CANVAS_W = 1480;
  const CANVAS_H = 850;
  const ROUND_W = 112;
  const ROUND_H = 112;
  const HEAD_W = 520;
  const HEAD_H = 128;
  const ROUND_GAP = 115;

  const ROOM_BOUNDS = {
    east:   { x: 30,   y: 185, w: 445, h: 520 },
    center: { x: 470,  y: 90,  w: 540, h: 520 },
    west:   { x: 1005, y: 185, w: 445, h: 520 }
  };

  const OLD_ROOM_BOUNDS = {
    east:   { x: 35,  y: 170, w: 370, h: 420 },
    center: { x: 399, y: 92,  w: 430, h: 410 },
    west:   { x: 823, y: 170, w: 360, h: 420 }
  };

  const GUEST_SEED_VERSION = 1;
  const OFFICIAL_GUESTS = [
  {
    "sourceId": "withjoy-2026-08-25-001",
    "name": "Sharon Opiela",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-002",
    "name": "Terry Banfield",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-003",
    "name": "Jim Biskupski",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-004",
    "name": "Bev Biskupski",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-005",
    "name": "Monica Blumenkrants",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-006",
    "name": "Dmitry Blumenkrants",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-007",
    "name": "Camilla Blumenkrants",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-008",
    "name": "Declan Blumenkrants",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-009",
    "name": "Connor Blumenkrants",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-010",
    "name": "Rachel Bono",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-011",
    "name": "Rachel Bono's Guest",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-012",
    "name": "Kelly Brueggen",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-013",
    "name": "Ben Brueggen",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-014",
    "name": "Glen Carwell",
    "rsvp": "attending",
    "meal": "Lemon Chicken (GF) w/ Lemon Caper Sauce, Yukon Gold Potatoes, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-015",
    "name": "Anne Carwell",
    "rsvp": "attending",
    "meal": "Lemon Chicken (GF) w/ Lemon Caper Sauce, Yukon Gold Potatoes, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-016",
    "name": "Michael Dziedzic",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-017",
    "name": "Noelle Dziedzic",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-018",
    "name": "Lydia Dziedzic",
    "rsvp": "attending",
    "meal": "Kids Meal (Please select this for children 10 and under)",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-019",
    "name": "Carol Elliott",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-020",
    "name": "Gerry Elliott",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-021",
    "name": "Carly Fair",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-022",
    "name": "Chad Fair",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-023",
    "name": "Finley Fair",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-024",
    "name": "Toben Fair",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-025",
    "name": "Afton Fair",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-026",
    "name": "Julie Finan",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-027",
    "name": "Holly Finan",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-028",
    "name": "Joan Vercillo",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-029",
    "name": "Tim Fitzgerald",
    "rsvp": "attending",
    "meal": "Lemon Chicken (GF) w/ Lemon Caper Sauce, Yukon Gold Potatoes, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-030",
    "name": "Lisa Fugett",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-031",
    "name": "Danny Fugett",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-032",
    "name": "Ryan Fugett",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-033",
    "name": "Jay Fugett",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-034",
    "name": "John Green",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-035",
    "name": "Nancy Green",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-036",
    "name": "Megan Gundy",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": "No meat/poultry or juices/broths of these please."
  },
  {
    "sourceId": "withjoy-2026-08-25-037",
    "name": "Kyle Gundy",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-038",
    "name": "Madison Gundy",
    "rsvp": "attending",
    "meal": "Kids Meal (Please select this for children 10 and under)",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-039",
    "name": "Travis Gundy",
    "rsvp": "attending",
    "meal": "Kids Meal (Please select this for children 10 and under)",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-040",
    "name": "Brittany Heinchon",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-041",
    "name": "Corbin Heinchon",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-042",
    "name": "Juniper Heinchon",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-043",
    "name": "Matt Hejnar",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-044",
    "name": "Caitlin Hejnar",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-045",
    "name": "Sylvia Hejnar",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-046",
    "name": "Abigail Hejnar",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-047",
    "name": "Michelle Hevesy",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-048",
    "name": "Nicholas Hevesy",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-049",
    "name": "CeCe Hevesy",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-050",
    "name": "Pastor Marty Hufford",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-051",
    "name": "Jennifer Glassey",
    "rsvp": "attending",
    "meal": "Lemon Chicken (GF) w/ Lemon Caper Sauce, Yukon Gold Potatoes, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-052",
    "name": "Roy Glassey III",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-053",
    "name": "Kevin Jamison",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-054",
    "name": "Mandy Jamison",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-055",
    "name": "Calvin Jamison",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-056",
    "name": "Sarah Johnson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-057",
    "name": "Mike Benson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-058",
    "name": "Grayson Johnson",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-059",
    "name": "Max Johnson",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-060",
    "name": "Sammy Knighton",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-061",
    "name": "Sammy Knighton's Guest",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-062",
    "name": "Nisha Choksi",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": "Tree nut allergy"
  },
  {
    "sourceId": "withjoy-2026-08-25-063",
    "name": "Guneev Lamba",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-064",
    "name": "Annette Lapinski",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-065",
    "name": "Czeslawa Lapinski",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-066",
    "name": "Emily Lapinski",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-067",
    "name": "Emily Lapinski's Guest",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-068",
    "name": "Mark Lapinski",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": "no"
  },
  {
    "sourceId": "withjoy-2026-08-25-069",
    "name": "Lisa Lapinski",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": "no"
  },
  {
    "sourceId": "withjoy-2026-08-25-070",
    "name": "Roman Lapinski",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-071",
    "name": "Will Lapinski",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-072",
    "name": "Will Lapinski's Guest",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-073",
    "name": "Mason Manden",
    "rsvp": "attending",
    "meal": "Lattice (Vegan) w/ Ratatouille, Tomato Coulis, Almond-flour Puff Pastry",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-074",
    "name": "Jess Manden",
    "rsvp": "attending",
    "meal": "Lattice (Vegan) w/ Ratatouille, Tomato Coulis, Almond-flour Puff Pastry",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-075",
    "name": "Poppy Manden",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-076",
    "name": "Ruby Manden",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-077",
    "name": "Blake Markham",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-078",
    "name": "Amber Markham",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-079",
    "name": "Cliff Mitcheff",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-080",
    "name": "Kim Mitcheff",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-081",
    "name": "Jennifer Mitcheff",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-082",
    "name": "Spencer Kettler",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-083",
    "name": "Lorraine Mitcheff",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-084",
    "name": "Michael Mitcheff",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-085",
    "name": "Mahsa Mitcheff",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-086",
    "name": "Michael Mitcheff",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-087",
    "name": "Rita Mitcheff",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-088",
    "name": "Patrick Mitcheff",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-089",
    "name": "Michelle Mitcheff",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-090",
    "name": "Robert Mitcheff",
    "rsvp": "attending",
    "meal": "Lemon Chicken (GF) w/ Lemon Caper Sauce, Yukon Gold Potatoes, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-091",
    "name": "Margaret Mitcheff",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-092",
    "name": "Troy Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-093",
    "name": "Melanie Mitcheff",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": "Allergic to walnuts and pecans"
  },
  {
    "sourceId": "withjoy-2026-08-25-094",
    "name": "Andy Mou",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-095",
    "name": "Andy Mou's Guest",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-096",
    "name": "Mike Duffy",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-097",
    "name": "Ciara Nally",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-098",
    "name": "Kara Nedvar",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-099",
    "name": "Connor O'Brien",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-100",
    "name": "Sue Nedvar",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-101",
    "name": "Tom Nedvar",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-102",
    "name": "Colin Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-103",
    "name": "Bethany Nelson",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-104",
    "name": "Sadie Nelson",
    "rsvp": "attending",
    "meal": "Kids Meal (Please select this for children 10 and under)",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-105",
    "name": "Weston Nelson",
    "rsvp": "attending",
    "meal": "Kids Meal (Please select this for children 10 and under)",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-106",
    "name": "Lyla Nelson",
    "rsvp": "attending",
    "meal": "Kids Meal (Please select this for children 10 and under)",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-107",
    "name": "Connor Nelson",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-108",
    "name": "Connie Nelson",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-109",
    "name": "Edie Nelson",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-110",
    "name": "Josie Nelson",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-111",
    "name": "Jim Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": "Fish Allergy"
  },
  {
    "sourceId": "withjoy-2026-08-25-112",
    "name": "Sheila Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": "Fish Allergy"
  },
  {
    "sourceId": "withjoy-2026-08-25-113",
    "name": "Joe Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-114",
    "name": "Joe Nelson's Guest",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-115",
    "name": "Kurt Nelson",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-116",
    "name": "Carly Nelson",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-117",
    "name": "Sloane Nelson",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-118",
    "name": "Collins Nelson",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-119",
    "name": "Kyle Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-120",
    "name": "Janna Hann",
    "rsvp": "attending",
    "meal": "Lemon Chicken (GF) w/ Lemon Caper Sauce, Yukon Gold Potatoes, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-121",
    "name": "Stella Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-122",
    "name": "Mac Nelson",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-123",
    "name": "Anne Nelson",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-124",
    "name": "Patrick Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-125",
    "name": "Erin Nelson",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-126",
    "name": "Grace Nelson",
    "rsvp": "attending",
    "meal": "Kids Meal (Please select this for children 10 and under)",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-127",
    "name": "Addie Nelson",
    "rsvp": "attending",
    "meal": "Kids Meal (Please select this for children 10 and under)",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-128",
    "name": "Randy Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-129",
    "name": "Ryan Nelson",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-130",
    "name": "Ty Nelson",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-131",
    "name": "Gavyn Nelson",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-132",
    "name": "Ryan Nelson's Guest",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-133",
    "name": "Terry Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-134",
    "name": "Ellie Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-135",
    "name": "Tom Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-136",
    "name": "Lori Nelson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-137",
    "name": "Dan Nguyen",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-138",
    "name": "Jam Nguyen",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-139",
    "name": "Jo Anne Norton",
    "rsvp": "attending",
    "meal": "Lemon Chicken (GF) w/ Lemon Caper Sauce, Yukon Gold Potatoes, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-140",
    "name": "Brad Norton",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-141",
    "name": "Jessica O'Brien",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": "GF"
  },
  {
    "sourceId": "withjoy-2026-08-25-142",
    "name": "Connor O'Brien",
    "rsvp": "attending",
    "meal": "Lemon Chicken (GF) w/ Lemon Caper Sauce, Yukon Gold Potatoes, and Asparagus",
    "dietary": "GF"
  },
  {
    "sourceId": "withjoy-2026-08-25-143",
    "name": "Dawson O'Brien",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-144",
    "name": "Keegan O'Brien",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-145",
    "name": "Scott Opiela",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": "gluten free"
  },
  {
    "sourceId": "withjoy-2026-08-25-146",
    "name": "Kelly Opiela",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-147",
    "name": "Alex Opiela",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-148",
    "name": "Kira Opiela",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-149",
    "name": "Mark Pan",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-150",
    "name": "Yvonne Pan",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-151",
    "name": "Jim Remke",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-152",
    "name": "Robyn Remke",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": "Gluten free"
  },
  {
    "sourceId": "withjoy-2026-08-25-153",
    "name": "Joann Remke",
    "rsvp": "attending",
    "meal": "Lemon Chicken (GF) w/ Lemon Caper Sauce, Yukon Gold Potatoes, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-154",
    "name": "Joann Remke's Guest",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-155",
    "name": "Mike Remke",
    "rsvp": "attending",
    "meal": "Lemon Chicken (GF) w/ Lemon Caper Sauce, Yukon Gold Potatoes, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-156",
    "name": "Brandie Remke",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-157",
    "name": "Doug Rio",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-158",
    "name": "Jackie Rio",
    "rsvp": "attending",
    "meal": "Lemon Chicken (GF) w/ Lemon Caper Sauce, Yukon Gold Potatoes, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-159",
    "name": "John Schroeder",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-160",
    "name": "Rick Vercillo",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-161",
    "name": "Lisa Shabez",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-162",
    "name": "Chris Tumminaro",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-163",
    "name": "Chris Tumminaro's Guest",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-164",
    "name": "John Tumminaro",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-165",
    "name": "John Tumminaro's Guest",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-166",
    "name": "Matt Tumminaro",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-167",
    "name": "Jess Tumminaro",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-168",
    "name": "Ashley Federman",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-169",
    "name": "Zach Ducksizzle Federman",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-170",
    "name": "Jonna Gravina",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-171",
    "name": "Jeff Vercillo",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-172",
    "name": "Jennifer Vercillo",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-173",
    "name": "Juliana Vercillo",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-174",
    "name": "Juliana Vercillo's Guest",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-175",
    "name": "Randy Vercillo",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-176",
    "name": "Laura Vercillo",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-177",
    "name": "Samantha Vercillo",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-178",
    "name": "Samantha Vercillo's Guest",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-179",
    "name": "Tyler Vercillo",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-180",
    "name": "Tyler Vercillo's Guest",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-181",
    "name": "Zach Vercillo",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-182",
    "name": "Zach Vercillo's Guest",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-183",
    "name": "Brian Wasielewski",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-184",
    "name": "Marie Wasielewski",
    "rsvp": "not_attending",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-185",
    "name": "Eleanor Wasielewski",
    "rsvp": "awaiting",
    "meal": "",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-186",
    "name": "Brittany Willson",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-187",
    "name": "Tom Willson",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-188",
    "name": "Kaeden Hainsworth",
    "rsvp": "attending",
    "meal": "Bourbon-Glazed Salmon w/ Bourbon Barbecue Glaze, Onion Hay, Whipped Garlic Potatoes, Red Sweet Drop Peppers, and Asparagus",
    "dietary": ""
  },
  {
    "sourceId": "withjoy-2026-08-25-189",
    "name": "Evelyn Hainsworth",
    "rsvp": "attending",
    "meal": "Kids Meal (Please select this for children 10 and under)",
    "dietary": "She is a chicken nugget / chicken tender / chicken strip addict."
  },
  {
    "sourceId": "withjoy-2026-08-25-190",
    "name": "Tom Zabkiewicz",
    "rsvp": "attending",
    "meal": "Filet Mignon (GF) w/ Balsamic Demi-glace, Potato Galette, Green Beans, and Red Peppers",
    "dietary": "No tomatoes or raw veggies or fruit"
  },
  {
    "sourceId": "withjoy-2026-08-25-191",
    "name": "Shauna Zabkiewicz",
    "rsvp": "attending",
    "meal": "Lemon Chicken (GF) w/ Lemon Caper Sauce, Yukon Gold Potatoes, and Asparagus",
    "dietary": ""
  }
];

  const els = {
    floorCanvas: document.getElementById('floorCanvas'),
    canvasScroll: document.getElementById('canvasScroll'),
    tableLayer: document.getElementById('tableLayer'),
    guestList: document.getElementById('guestList'),
    guestSearch: document.getElementById('guestSearch'),
    guestFilter: document.getElementById('guestFilter'),
    quickAddForm: document.getElementById('quickAddForm'),
    quickAddName: document.getElementById('quickAddName'),
    targetRoom: document.getElementById('targetRoom'),
    saveStatus: document.getElementById('saveStatus'),
    totalGuests: document.getElementById('totalGuests'),
    attendingGuests: document.getElementById('attendingGuests'),
    awaitingGuests: document.getElementById('awaitingGuests'),
    declinedGuests: document.getElementById('declinedGuests'),
    seatedGuests: document.getElementById('seatedGuests'),
    unseatedGuests: document.getElementById('unseatedGuests'),
    syncGuestListBtn: document.getElementById('syncGuestListBtn'),
    add8Btn: document.getElementById('add8Btn'),
    add10Btn: document.getElementById('add10Btn'),
    addHeadBtn: document.getElementById('addHeadBtn'),
    autoPlaceBtn: document.getElementById('autoPlaceBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importFile: document.getElementById('importFile'),
    resetBtn: document.getElementById('resetBtn'),
    openBulkBtn: document.getElementById('openBulkBtn'),
    bulkDialog: document.getElementById('bulkDialog'),
    bulkForm: document.getElementById('bulkForm'),
    bulkGuestText: document.getElementById('bulkGuestText'),
    cancelBulkBtn: document.getElementById('cancelBulkBtn'),
    tableDialog: document.getElementById('tableDialog'),
    tableForm: document.getElementById('tableForm'),
    editingTableId: document.getElementById('editingTableId'),
    tableDialogTitle: document.getElementById('tableDialogTitle'),
    tableNameInput: document.getElementById('tableNameInput'),
    tableRoomInput: document.getElementById('tableRoomInput'),
    deleteTableBtn: document.getElementById('deleteTableBtn'),
    cancelTableBtn: document.getElementById('cancelTableBtn'),
    guestDialog: document.getElementById('guestDialog'),
    guestForm: document.getElementById('guestForm'),
    editingGuestId: document.getElementById('editingGuestId'),
    guestDialogTitle: document.getElementById('guestDialogTitle'),
    guestAssignmentSummary: document.getElementById('guestAssignmentSummary'),
    guestNameInput: document.getElementById('guestNameInput'),
    guestGroupInput: document.getElementById('guestGroupInput'),
    guestRsvpInput: document.getElementById('guestRsvpInput'),
    guestMealInput: document.getElementById('guestMealInput'),
    guestDietaryInput: document.getElementById('guestDietaryInput'),
    guestNotesInput: document.getElementById('guestNotesInput'),
    unseatGuestBtn: document.getElementById('unseatGuestBtn'),
    deleteGuestBtn: document.getElementById('deleteGuestBtn'),
    cancelGuestBtn: document.getElementById('cancelGuestBtn'),
    assignDialog: document.getElementById('assignDialog'),
    assignDialogTitle: document.getElementById('assignDialogTitle'),
    assignSeatSummary: document.getElementById('assignSeatSummary'),
    assignGuestSearch: document.getElementById('assignGuestSearch'),
    assignGuestList: document.getElementById('assignGuestList'),
    closeAssignBtn: document.getElementById('closeAssignBtn'),
    zoomRange: document.getElementById('zoomRange'),
    zoomValue: document.getElementById('zoomValue'),
    canvasZoom: document.getElementById('canvasZoom'),
    fitRoomBtn: document.getElementById('fitRoomBtn')
  };

  let dragPayload = null;
  let movingTable = null;
  let pointerGuestDrag = null;
  let highlightedDropSeat = null;
  let saveFlashTimer = null;
  let cloudSaveTimer = null;
  let cloudClient = null;
  let cloudReady = false;
  let pendingSeat = null;
  let accessCode = localStorage.getItem(ACCESS_CODE_KEY) || '';
  let state = loadLocalState() || emptyState();
  let uiZoom = clamp(Number(localStorage.getItem(ZOOM_KEY)) || Number(state?.settings?.zoom) || 100, 45, 140);

  normalizeState();
  bindEvents();
  renderAll();
  bootstrapCloud();

  function emptyState() {
    return {
      version: 2,
      guests: [],
      tables: [],
      counters: { table: 1 },
      settings: { zoom: 100, guestSeedVersion: 0 }
    };
  }

  function uid(prefix) {
    if (window.crypto?.randomUUID) return `${prefix}_${window.crypto.randomUUID()}`;
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  }

  function normalizeState() {
    const previousVersion = Number(state.version) || 1;
    state.guests = Array.isArray(state.guests) ? state.guests : [];
    state.tables = Array.isArray(state.tables) ? state.tables : [];
    state.counters = state.counters || { table: state.tables.length + 1 };
    state.settings = state.settings || { zoom: 100 };

    state.guests.forEach(guest => {
      guest.name = guest.name || 'Unnamed Guest';
      guest.group = guest.group || '';
      guest.rsvp = normalizeRsvp(guest.rsvp);
      guest.meal = guest.meal || '';
      guest.dietary = guest.dietary || '';
      guest.notes = guest.notes || '';
      guest.sourceId = guest.sourceId || '';
    });
    state.settings.guestSeedVersion = Number(state.settings.guestSeedVersion) || 0;

    state.tables.forEach(table => {
      table.capacity = Number(table.capacity) || 10;
      table.room = ROOM_BOUNDS[table.room] ? table.room : 'center';
      table.type = table.type === 'head' ? 'head' : 'round';
      table.seats = Array.isArray(table.seats) ? table.seats : Array(table.capacity).fill(null);
      while (table.seats.length < table.capacity) table.seats.push(null);
      if (table.seats.length > table.capacity) table.seats = table.seats.slice(0, table.capacity);
    });

    if (previousVersion < 2 && state.tables.length) migrateLegacyTablePositions();
    state.version = 2;
  }

  function migrateLegacyTablePositions() {
    state.tables.forEach(table => {
      const oldBounds = OLD_ROOM_BOUNDS[table.room] || OLD_ROOM_BOUNDS.center;
      const newBounds = ROOM_BOUNDS[table.room] || ROOM_BOUNDS.center;
      const oldW = table.type === 'head' ? 460 : 164;
      const oldH = table.type === 'head' ? 150 : 164;
      const newW = table.type === 'head' ? HEAD_W : ROUND_W;
      const newH = table.type === 'head' ? HEAD_H : ROUND_H;
      const centerX = (Number(table.x) || oldBounds.x) + oldW / 2;
      const centerY = (Number(table.y) || oldBounds.y) + oldH / 2;
      const fx = clamp((centerX - oldBounds.x) / oldBounds.w, 0, 1);
      const fy = clamp((centerY - oldBounds.y) / oldBounds.h, 0, 1);
      table.x = snap(clamp(newBounds.x + fx * newBounds.w - newW / 2, 0, CANVAS_W - newW));
      table.y = snap(clamp(newBounds.y + fy * newBounds.h - newH / 2, 0, CANVAS_H - newH));
    });
  }

  function loadLocalState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (err) {
      console.warn('Could not load local seating chart backup', err);
      return null;
    }
  }

  function setSaveStatus(message, flash = false) {
    const target = els.saveStatus.querySelector('span:last-child');
    if (target) target.textContent = message;
    if (flash) {
      els.saveStatus.classList.add('saved-flash');
      clearTimeout(saveFlashTimer);
      saveFlashTimer = setTimeout(() => els.saveStatus.classList.remove('saved-flash'), 600);
    }
  }

  function saveState(message = 'Saved') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('Could not save local backup', err);
    }

    if (!cloudReady) {
      const now = new Date();
      setSaveStatus(`${message} locally · ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`, true);
      return;
    }

    setSaveStatus('Saving to Supabase…');
    clearTimeout(cloudSaveTimer);
    cloudSaveTimer = setTimeout(() => saveCloudState(message), CLOUD_SAVE_DELAY);
  }

  async function bootstrapCloud() {
    const cfg = window.SEATING_SUPABASE_CONFIG || {};
    if (!cfg.url || !cfg.key || !window.supabase?.createClient) {
      setSaveStatus('Local mode · add Supabase config to sync devices');
      maybeSyncOfficialGuestList();
      return;
    }

    try {
      cloudClient = window.supabase.createClient(cfg.url, cfg.key, {
        auth: { persistSession: false, autoRefreshToken: false }
      });

      if (!accessCode) {
        accessCode = prompt('Enter the wedding seating chart access code:') || '';
        if (!accessCode) {
          setSaveStatus('Local mode · cloud access code not entered');
          return;
        }
        localStorage.setItem(ACCESS_CODE_KEY, accessCode);
      }

      setSaveStatus('Loading seating chart from Supabase…');
      const { data, error } = await cloudClient.rpc('wedding_seating_load', {
        p_slug: cfg.chartSlug || 'troy-wedding-2026',
        p_secret: accessCode
      });
      if (error) throw error;
      if (data === null) {
        localStorage.removeItem(ACCESS_CODE_KEY);
        accessCode = '';
        setSaveStatus('Supabase access denied · reload to try again');
        alert('The Supabase seating chart could not be opened. The access code may be incorrect.');
        return;
      }

      let migratedCloudLayout = false;
      if (data && Array.isArray(data.guests) && Array.isArray(data.tables)) {
        const cloudVersion = Number(data.version) || 1;
        state = data;
        normalizeState();
        migratedCloudLayout = cloudVersion < 2;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        renderAll();
      }

      cloudReady = true;
      const guestListChanged = maybeSyncOfficialGuestList();
      if (migratedCloudLayout && !guestListChanged) saveState('Layout upgraded');
      if (!guestListChanged) {
        const now = new Date();
        setSaveStatus(`Synced with Supabase · ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`, true);
      }
    } catch (err) {
      console.error('Supabase startup failed', err);
      setSaveStatus('Supabase unavailable · using local backup');
    }
  }

  async function saveCloudState(message = 'Saved') {
    const cfg = window.SEATING_SUPABASE_CONFIG || {};
    if (!cloudClient || !cloudReady || !accessCode) return;
    try {
      const { data, error } = await cloudClient.rpc('wedding_seating_save', {
        p_slug: cfg.chartSlug || 'troy-wedding-2026',
        p_secret: accessCode,
        p_state: state
      });
      if (error) throw error;
      if (data !== true) {
        setSaveStatus('Cloud save rejected · check access code');
        return;
      }
      const now = new Date();
      setSaveStatus(`${message} to Supabase · ${now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`, true);
    } catch (err) {
      console.error('Supabase save failed', err);
      setSaveStatus('Cloud save failed · local backup is safe');
    }
  }

  function commit({ tables = true, guests = true, message } = {}) {
    if (guests) renderGuests();
    if (tables) renderTables();
    renderStats();
    saveState(message);
  }

  function bindEvents() {
    els.add8Btn.addEventListener('click', () => addTable('round', 8, els.targetRoom.value));
    els.add10Btn.addEventListener('click', () => addTable('round', 10, els.targetRoom.value));
    els.addHeadBtn.addEventListener('click', () => addTable('head', 22, els.targetRoom.value));
    els.autoPlaceBtn.addEventListener('click', autoPlaceTables);

    els.quickAddForm.addEventListener('submit', e => {
      e.preventDefault();
      const name = els.quickAddName.value.trim();
      if (!name) return;
      addGuest({ name });
      els.quickAddName.value = '';
      els.quickAddName.focus();
    });

    els.guestSearch.addEventListener('input', renderGuests);
    els.guestFilter.addEventListener('change', renderGuests);
    els.syncGuestListBtn?.addEventListener('click', () => {
      if (!confirm('Sync the saved RSVP list into the planner? Existing tables and seat assignments are preserved. Matching guests are updated and missing guests are added.')) return;
      syncOfficialGuestList({ force: true });
    });

    els.openBulkBtn.addEventListener('click', () => els.bulkDialog.showModal());
    els.cancelBulkBtn.addEventListener('click', () => els.bulkDialog.close());
    els.bulkForm.addEventListener('submit', e => {
      e.preventDefault();
      const lines = els.bulkGuestText.value.split(/\r?\n/).map(v => v.trim()).filter(Boolean);
      if (!lines.length) return;
      let added = 0;
      lines.forEach(line => {
        const [name, group = '', meal = '', rsvp = 'Awaiting Reply', dietary = ''] = line.split('|').map(v => v.trim());
        if (name) {
          state.guests.push({
            id: uid('guest'),
            name,
            group,
            rsvp: normalizeRsvp(rsvp),
            meal,
            dietary,
            notes: '',
            sourceId: ''
          });
          added++;
        }
      });
      els.bulkGuestText.value = '';
      els.bulkDialog.close();
      commit({ message: `Added ${added} guests` });
    });

    els.tableForm.addEventListener('submit', e => {
      e.preventDefault();
      const table = getTable(els.editingTableId.value);
      if (!table) return;
      table.name = els.tableNameInput.value.trim() || table.name;
      const newRoom = els.tableRoomInput.value;
      if (newRoom !== table.room) {
        table.room = newRoom;
        const pos = getDefaultPosition(newRoom, table.type);
        table.x = pos.x;
        table.y = pos.y;
      }
      els.tableDialog.close();
      commit({ guests: false, message: 'Table updated' });
    });

    els.cancelTableBtn.addEventListener('click', () => els.tableDialog.close());
    els.deleteTableBtn.addEventListener('click', () => {
      const table = getTable(els.editingTableId.value);
      if (table) deleteTable(table.id);
    });

    els.guestForm.addEventListener('submit', e => {
      e.preventDefault();
      const guest = getGuest(els.editingGuestId.value);
      if (!guest) return;
      const name = els.guestNameInput.value.trim();
      if (!name) return;
      guest.name = name;
      guest.group = els.guestGroupInput.value.trim();
      const previousRsvp = guest.rsvp;
      guest.rsvp = normalizeRsvp(els.guestRsvpInput.value);
      guest.meal = els.guestMealInput.value.trim();
      guest.dietary = els.guestDietaryInput.value.trim();
      guest.notes = els.guestNotesInput.value.trim();

      if (guest.rsvp === 'not_attending') {
        const assignment = findGuestSeat(guest.id);
        if (assignment) assignment.table.seats[assignment.seatIndex] = null;
      }

      els.guestDialog.close();
      commit({ message: previousRsvp !== guest.rsvp ? 'Guest RSVP updated' : 'Guest profile saved' });
    });

    els.cancelGuestBtn.addEventListener('click', () => els.guestDialog.close());
    els.unseatGuestBtn.addEventListener('click', () => {
      const guest = getGuest(els.editingGuestId.value);
      if (!guest) return;
      const assignment = findGuestSeat(guest.id);
      if (!assignment) return;
      assignment.table.seats[assignment.seatIndex] = null;
      els.guestDialog.close();
      commit({ message: 'Guest unseated' });
    });
    els.deleteGuestBtn.addEventListener('click', () => {
      const guest = getGuest(els.editingGuestId.value);
      if (!guest) return;
      if (removeGuest(guest.id)) els.guestDialog.close();
    });

    els.closeAssignBtn.addEventListener('click', () => els.assignDialog.close());
    els.assignGuestSearch.addEventListener('input', renderAssignGuestList);

    els.exportBtn.addEventListener('click', exportBackup);
    els.importFile.addEventListener('change', importBackup);
    els.resetBtn.addEventListener('click', resetAll);

    els.zoomRange.addEventListener('input', () => {
      uiZoom = clamp(Number(els.zoomRange.value), 45, 140);
      localStorage.setItem(ZOOM_KEY, String(uiZoom));
      applyZoom();
    });
    els.fitRoomBtn.addEventListener('click', fitSelectedRoom);

    document.querySelectorAll('[data-jump-room]').forEach(button => {
      button.addEventListener('click', () => {
        const room = button.dataset.jumpRoom;
        els.targetRoom.value = room;
        scrollToRoom(room);
      });
    });

    window.addEventListener('beforeunload', () => {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
    });
    window.addEventListener('pointermove', onTablePointerMove);
    window.addEventListener('pointerup', onTablePointerUp);
    window.addEventListener('pointercancel', onTablePointerUp);
    window.addEventListener('pointermove', onGuestPointerMove, { passive: false });
    window.addEventListener('pointerup', onGuestPointerUp);
    window.addEventListener('pointercancel', cancelGuestPointerDrag);
  }

  function addGuest({ name, group = '', rsvp = 'awaiting', meal = '', dietary = '', notes = '' }) {
    const clean = name.trim();
    if (!clean) return;
    state.guests.push({
      id: uid('guest'),
      name: clean,
      group,
      rsvp: normalizeRsvp(rsvp),
      meal,
      dietary,
      notes,
      sourceId: ''
    });
    commit({ message: 'Guest added' });
  }

  function removeGuest(guestId) {
    const guest = getGuest(guestId);
    if (!guest) return false;
    if (!confirm(`Remove ${guest.name} from the guest list?`)) return false;
    state.tables.forEach(t => { t.seats = t.seats.map(id => id === guestId ? null : id); });
    state.guests = state.guests.filter(g => g.id !== guestId);
    commit({ message: 'Guest removed' });
    return true;
  }

  function addTable(type, capacity, room) {
    if (type === 'head' && state.tables.some(t => t.type === 'head')) {
      if (!confirm('A head table already exists. Add another one anyway?')) return;
    }

    const position = getDefaultPosition(room, type);
    const number = state.counters.table++;
    state.tables.push({
      id: uid('table'),
      type,
      capacity,
      room,
      name: type === 'head' ? 'Head Table' : `Table ${number}`,
      x: position.x,
      y: position.y,
      seats: Array(capacity).fill(null)
    });
    commit({ guests: false, message: 'Table added' });
  }

  function deleteTable(tableId) {
    const table = getTable(tableId);
    if (!table) return;
    const occupied = table.seats.filter(Boolean).length;
    const warning = occupied ? ` This will unseat ${occupied} guest${occupied === 1 ? '' : 's'}.` : '';
    if (!confirm(`Delete ${table.name}?${warning}`)) return;
    state.tables = state.tables.filter(t => t.id !== table.id);
    if (els.tableDialog.open) els.tableDialog.close();
    commit({ message: 'Table deleted' });
  }

  function getDefaultPosition(room, type) {
    const bounds = ROOM_BOUNDS[room];
    const isHead = type === 'head';
    const w = isHead ? HEAD_W : ROUND_W;
    const h = isHead ? HEAD_H : ROUND_H;
    const sameRoom = state.tables.filter(t => t.room === room && t.type === type);

    if (isHead) {
      const x = clamp(bounds.x + (bounds.w - w) / 2, 0, CANVAS_W - w);
      const y = clamp(bounds.y + 54 + sameRoom.length * (HEAD_H + 10), 0, CANVAS_H - h);
      return { x: snap(x), y: snap(y) };
    }

    const cols = Math.max(1, Math.floor((bounds.w - 24) / ROUND_GAP));
    const index = state.tables.filter(t => t.room === room && t.type !== 'head').length;
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = clamp(bounds.x + 14 + col * ROUND_GAP, 0, CANVAS_W - w);
    const y = clamp(bounds.y + 55 + row * ROUND_GAP, 0, CANVAS_H - h);
    return { x: snap(x), y: snap(y) };
  }

  function autoPlaceTables() {
    ['east', 'center', 'west'].forEach(room => {
      const bounds = ROOM_BOUNDS[room];
      const tables = state.tables.filter(t => t.room === room);
      const heads = tables.filter(t => t.type === 'head');
      const rounds = tables.filter(t => t.type !== 'head');
      let startY = bounds.y + 55;

      heads.forEach((table, i) => {
        table.x = snap(clamp(bounds.x + (bounds.w - HEAD_W) / 2, 0, CANVAS_W - HEAD_W));
        table.y = snap(clamp(bounds.y + 48 + i * (HEAD_H + 10), 0, CANVAS_H - HEAD_H));
        startY = Math.max(startY, table.y + HEAD_H + 8);
      });

      const cols = Math.max(1, Math.floor((bounds.w - 24) / ROUND_GAP));
      rounds.forEach((table, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        table.x = snap(bounds.x + 14 + col * ROUND_GAP);
        table.y = snap(startY + row * ROUND_GAP);
        table.x = clamp(table.x, 0, CANVAS_W - ROUND_W);
        table.y = clamp(table.y, 0, CANVAS_H - ROUND_H);
      });
    });

    commit({ guests: false, message: 'Tables auto-placed' });
    toast('Tables arranged with the new compact spacing.');
  }

  function renderAll() {
    applyZoom();
    renderGuests();
    renderTables();
    renderStats();
  }

  function renderStats() {
    const seated = new Set();
    state.tables.forEach(t => t.seats.forEach(id => id && seated.add(id)));

    const attending = state.guests.filter(g => g.rsvp === 'attending').length;
    const awaiting = state.guests.filter(g => g.rsvp === 'awaiting').length;
    const declined = state.guests.filter(g => g.rsvp === 'not_attending').length;
    const activeIds = new Set(state.guests.filter(isSeatableGuest).map(g => g.id));
    const seatedActive = [...seated].filter(id => activeIds.has(id)).length;
    const unseatedActive = Math.max(0, activeIds.size - seatedActive);

    els.totalGuests.textContent = state.guests.length;
    els.attendingGuests.textContent = attending;
    els.awaitingGuests.textContent = awaiting;
    els.declinedGuests.textContent = declined;
    els.seatedGuests.textContent = seatedActive;
    els.unseatedGuests.textContent = unseatedActive;
  }

  function renderGuests() {
    const query = els.guestSearch.value.trim().toLowerCase();
    const filter = els.guestFilter.value;
    const assignments = getAssignments();

    const guests = [...state.guests]
      .filter(guest => {
        const a = assignments.get(guest.id);
        if (filter === 'seated' && !a) return false;
        if (filter === 'unseated' && (a || !isSeatableGuest(guest))) return false;
        if (filter === 'attending' && guest.rsvp !== 'attending') return false;
        if (filter === 'awaiting' && guest.rsvp !== 'awaiting') return false;
        if (filter === 'declined' && guest.rsvp !== 'not_attending') return false;
        if (!query) return true;
        const haystack = `${guest.name} ${guest.group || ''} ${rsvpLabel(guest.rsvp)} ${guest.meal || ''} ${guest.dietary || ''} ${guest.notes || ''} ${a ? a.table.name : ''}`.toLowerCase();
        return haystack.includes(query);
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    els.guestList.innerHTML = '';
    if (!guests.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.innerHTML = state.guests.length
        ? 'No guests match this search/filter.'
        : '<strong>No guests yet.</strong><br>Use “Add one guest” or the + button to paste the full list.';
      els.guestList.appendChild(empty);
      return;
    }

    const template = document.getElementById('guestTemplate');
    guests.forEach(guest => {
      const node = template.content.firstElementChild.cloneNode(true);
      const assignment = assignments.get(guest.id);
      node.dataset.guestId = guest.id;
      node.querySelector('.guest-name').textContent = guest.name;
      const statusBadge = node.querySelector('.guest-rsvp');
      statusBadge.textContent = rsvpShortLabel(guest.rsvp);
      statusBadge.dataset.status = guest.rsvp;

      const meal = mealShort(guest.meal);
      node.querySelector('.guest-meta').textContent = assignment
        ? `${assignment.table.name} · Seat ${assignment.seatIndex + 1}`
        : guest.rsvp === 'not_attending'
          ? 'Not attending'
          : [guest.group, meal].filter(Boolean).join(' · ') || 'Unseated';

      node.classList.toggle('is-seated', !!assignment);
      node.classList.toggle('is-declined', guest.rsvp === 'not_attending');
      node.draggable = isSeatableGuest(guest);

      if (isSeatableGuest(guest)) {
        node.addEventListener('dragstart', e => startGuestDrag(e, guest.id));
        node.addEventListener('dragend', endGuestDrag);
      }

      node.querySelector('.guest-open').addEventListener('click', () => openGuestDialog(guest.id));
      const grip = node.querySelector('.guest-drag-grip');
      grip.disabled = !isSeatableGuest(guest);
      grip.title = isSeatableGuest(guest) ? 'Drag to a seat' : 'Guest is not attending';
      if (isSeatableGuest(guest)) {
        grip.addEventListener('pointerdown', e => startGuestPointerDrag(e, guest.id));
      }
      node.querySelector('.guest-remove').addEventListener('click', e => {
        e.stopPropagation();
        removeGuest(guest.id);
      });
      els.guestList.appendChild(node);
    });
  }

  function renderTables() {
    els.tableLayer.innerHTML = '';
    state.tables.forEach(table => {
      const wrapper = document.createElement('div');
      wrapper.className = `table-item ${table.type === 'head' ? 'head-table' : 'round-table'} room-${table.room}`;
      wrapper.dataset.tableId = table.id;
      wrapper.style.left = `${table.x}px`;
      wrapper.style.top = `${table.y}px`;

      const surface = document.createElement('div');
      surface.className = 'table-surface';
      wrapper.appendChild(surface);

      const handle = document.createElement('div');
      handle.className = 'table-drag-handle';
      const count = table.seats.filter(Boolean).length;
      const name = document.createElement('strong');
      name.textContent = table.name;
      const seated = document.createElement('span');
      seated.textContent = `${count}/${table.capacity}`;
      const actions = document.createElement('div');
      actions.className = 'table-inline-actions';

      const edit = document.createElement('button');
      edit.type = 'button';
      edit.className = 'table-mini-btn';
      edit.textContent = 'Edit';
      edit.title = `Edit ${table.name}`;
      edit.addEventListener('pointerdown', e => e.stopPropagation());
      edit.addEventListener('click', e => { e.stopPropagation(); openTableDialog(table.id); });

      const del = document.createElement('button');
      del.type = 'button';
      del.className = 'table-mini-btn table-mini-delete';
      del.textContent = '×';
      del.title = `Delete ${table.name}`;
      del.setAttribute('aria-label', `Delete ${table.name}`);
      del.addEventListener('pointerdown', e => e.stopPropagation());
      del.addEventListener('click', e => { e.stopPropagation(); deleteTable(table.id); });

      actions.append(edit, del);
      handle.append(name, seated, actions);
      handle.addEventListener('pointerdown', e => startTableMove(e, table.id));
      handle.addEventListener('dragover', e => {
        if (dragPayload?.type !== 'guest') return;
        e.preventDefault();
        wrapper.classList.add('table-drop-target');
      });
      handle.addEventListener('dragleave', () => wrapper.classList.remove('table-drop-target'));
      handle.addEventListener('drop', e => {
        if (dragPayload?.type !== 'guest') return;
        e.preventDefault();
        wrapper.classList.remove('table-drop-target');
        assignGuestToFirstEmpty(dragPayload.guestId, table.id);
      });
      wrapper.appendChild(handle);

      if (table.type === 'head') renderHeadSeats(wrapper, table);
      else renderRoundSeats(wrapper, table);

      els.tableLayer.appendChild(wrapper);
    });
  }

  function renderRoundSeats(wrapper, table) {
    const centerX = ROUND_W / 2;
    const centerY = ROUND_H / 2;
    const seatSize = 24;
    const radius = 44;
    for (let i = 0; i < table.capacity; i++) {
      const angle = -Math.PI / 2 + (i * 2 * Math.PI / table.capacity);
      const x = centerX + Math.cos(angle) * radius - seatSize / 2;
      const y = centerY + Math.sin(angle) * radius - seatSize / 2;
      wrapper.appendChild(createSeat(table, i, x, y));
    }
  }

  function renderHeadSeats(wrapper, table) {
    const topXs = Array.from({ length: 12 }, (_, i) => 8 + i * 44);
    const bottomXs = [8, 58, 108, 158, 208, 288, 338, 388, 438, 488];

    topXs.forEach((x, i) => {
      const special = i === 5 ? 'Bride' : i === 6 ? 'Groom' : '';
      wrapper.appendChild(createSeat(table, i, x, 0, special));
    });
    bottomXs.forEach((x, i) => {
      wrapper.appendChild(createSeat(table, 12 + i, x, 104));
    });
  }

  function createSeat(table, seatIndex, x, y, specialLabel = '') {
    const seat = document.createElement('button');
    const guestId = table.seats[seatIndex];
    const guest = guestId ? getGuest(guestId) : null;

    seat.type = 'button';
    seat.className = 'seat';
    seat.dataset.tableId = table.id;
    seat.dataset.seatIndex = String(seatIndex);
    seat.dataset.occupied = guest ? 'true' : 'false';
    if (specialLabel) seat.dataset.special = 'true';
    seat.style.left = `${x}px`;
    seat.style.top = `${y}px`;
    seat.title = guest
      ? `${guest.name} — ${table.name}, seat ${seatIndex + 1}. Click for profile.`
      : `${table.name}, seat ${seatIndex + 1}. Click to assign.`;

    const num = document.createElement('span');
    num.className = 'seat-number';
    num.textContent = seatIndex + 1;
    seat.appendChild(num);

    if (specialLabel) {
      const badge = document.createElement('span');
      badge.className = 'special-badge';
      badge.textContent = specialLabel;
      seat.appendChild(badge);
    }

    if (guest) {
      const label = document.createElement('span');
      label.className = 'seat-name';
      label.textContent = shortName(guest.name);
      seat.appendChild(label);
      seat.draggable = true;
      seat.addEventListener('dragstart', e => startGuestDrag(e, guest.id));
      seat.addEventListener('dragend', endGuestDrag);
    }

    seat.addEventListener('dragover', e => {
      if (dragPayload?.type !== 'guest') return;
      e.preventDefault();
      e.stopPropagation();
      seat.classList.add('drag-over');
    });
    seat.addEventListener('dragleave', () => seat.classList.remove('drag-over'));
    seat.addEventListener('drop', e => {
      if (dragPayload?.type !== 'guest') return;
      e.preventDefault();
      e.stopPropagation();
      seat.classList.remove('drag-over');
      assignGuestToSeat(dragPayload.guestId, table.id, seatIndex);
    });

    seat.addEventListener('click', () => {
      const currentGuestId = getTable(table.id)?.seats?.[seatIndex];
      if (currentGuestId) openGuestDialog(currentGuestId);
      else openAssignDialog(table.id, seatIndex);
    });

    return seat;
  }

  function startGuestDrag(event, guestId) {
    const guest = getGuest(guestId);
    if (!guest || !isSeatableGuest(guest)) {
      event.preventDefault();
      return toast('This guest is marked Not Attending.');
    }
    dragPayload = { type: 'guest', guestId };
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', guestId);
    }
    event.currentTarget.classList.add('dragging');
  }

  function endGuestDrag(event) {
    event.currentTarget.classList.remove('dragging');
    clearDropHighlights();
    dragPayload = null;
  }

  function startGuestPointerDrag(event, guestId) {
    if (event.button !== undefined && event.button !== 0) return;
    event.preventDefault();
    event.stopPropagation();
    cancelGuestPointerDrag();

    const guest = getGuest(guestId);
    if (!guest || !isSeatableGuest(guest)) return;

    const ghost = document.createElement('div');
    ghost.className = 'guest-drag-ghost';
    ghost.textContent = guest.name;
    document.body.appendChild(ghost);

    pointerGuestDrag = {
      guestId,
      pointerId: event.pointerId,
      source: event.currentTarget,
      ghost
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    positionGuestGhost(event.clientX, event.clientY);
    document.body.classList.add('guest-pointer-dragging');
  }

  function onGuestPointerMove(event) {
    if (!pointerGuestDrag || event.pointerId !== pointerGuestDrag.pointerId) return;
    event.preventDefault();
    positionGuestGhost(event.clientX, event.clientY);

    pointerGuestDrag.ghost.style.display = 'none';
    const target = document.elementFromPoint(event.clientX, event.clientY);
    pointerGuestDrag.ghost.style.display = '';
    const seat = target?.closest?.('.seat');

    if (highlightedDropSeat && highlightedDropSeat !== seat) highlightedDropSeat.classList.remove('drag-over');
    highlightedDropSeat = seat || null;
    if (highlightedDropSeat) highlightedDropSeat.classList.add('drag-over');
  }

  function onGuestPointerUp(event) {
    if (!pointerGuestDrag || event.pointerId !== pointerGuestDrag.pointerId) return;
    pointerGuestDrag.ghost.style.display = 'none';
    const target = document.elementFromPoint(event.clientX, event.clientY);
    pointerGuestDrag.ghost.style.display = '';

    const seat = target?.closest?.('.seat');
    const tableItem = target?.closest?.('.table-item');
    const guestId = pointerGuestDrag.guestId;

    if (seat) {
      assignGuestToSeat(guestId, seat.dataset.tableId, Number(seat.dataset.seatIndex));
    } else if (tableItem) {
      assignGuestToFirstEmpty(guestId, tableItem.dataset.tableId);
    }
    cancelGuestPointerDrag();
  }

  function cancelGuestPointerDrag() {
    if (pointerGuestDrag?.ghost) pointerGuestDrag.ghost.remove();
    pointerGuestDrag = null;
    clearDropHighlights();
    document.body.classList.remove('guest-pointer-dragging');
  }

  function positionGuestGhost(clientX, clientY) {
    if (!pointerGuestDrag) return;
    pointerGuestDrag.ghost.style.left = `${clientX + 14}px`;
    pointerGuestDrag.ghost.style.top = `${clientY + 14}px`;
  }

  function clearDropHighlights() {
    highlightedDropSeat = null;
    document.querySelectorAll('.drag-over, .table-drop-target').forEach(el => el.classList.remove('drag-over', 'table-drop-target'));
  }

  function assignGuestToFirstEmpty(guestId, tableId) {
    const table = getTable(tableId);
    if (!table) return;
    const firstEmpty = table.seats.findIndex(v => !v);
    if (firstEmpty === -1) return toast(`${table.name} is full.`);
    assignGuestToSeat(guestId, table.id, firstEmpty);
  }

  function assignGuestToSeat(guestId, destinationTableId, destinationSeatIndex) {
    const destTable = getTable(destinationTableId);
    const guest = getGuest(guestId);
    if (!destTable || !guest || destinationSeatIndex < 0 || destinationSeatIndex >= destTable.capacity) return;
    if (!isSeatableGuest(guest)) return toast(`${guest.name} is marked Not Attending.`);

    const current = findGuestSeat(guestId);
    const displacedGuestId = destTable.seats[destinationSeatIndex];

    if (current && current.table.id === destinationTableId && current.seatIndex === destinationSeatIndex) return;

    if (displacedGuestId && current) {
      current.table.seats[current.seatIndex] = displacedGuestId;
      destTable.seats[destinationSeatIndex] = guestId;
    } else {
      if (current) current.table.seats[current.seatIndex] = null;
      destTable.seats[destinationSeatIndex] = guestId;
    }

    commit({ message: 'Seat assignment saved' });
  }

  function findGuestSeat(guestId) {
    for (const table of state.tables) {
      const seatIndex = table.seats.indexOf(guestId);
      if (seatIndex >= 0) return { table, seatIndex };
    }
    return null;
  }

  function getAssignments() {
    const map = new Map();
    state.tables.forEach(table => {
      table.seats.forEach((guestId, seatIndex) => {
        if (guestId) map.set(guestId, { table, seatIndex });
      });
    });
    return map;
  }

  function startTableMove(event, tableId) {
    if (event.button !== 0) return;
    const table = getTable(tableId);
    const el = event.currentTarget.closest('.table-item');
    if (!table || !el) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const scale = uiZoom / 100;
    movingTable = {
      table,
      el,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      startClientY: event.clientY,
      startX: table.x,
      startY: table.y,
      scale,
      moved: false
    };
    el.classList.add('is-moving');
  }

  function onTablePointerMove(event) {
    if (!movingTable || event.pointerId !== movingTable.pointerId) return;
    const { table, el, startClientX, startClientY, startX, startY, scale } = movingTable;
    const rawDx = event.clientX - startClientX;
    const rawDy = event.clientY - startClientY;
    if (Math.hypot(rawDx, rawDy) > 4) movingTable.moved = true;
    if (!movingTable.moved) return;

    const dx = rawDx / scale;
    const dy = rawDy / scale;
    const w = table.type === 'head' ? HEAD_W : ROUND_W;
    const h = table.type === 'head' ? HEAD_H : ROUND_H;
    table.x = snap(clamp(startX + dx, 0, CANVAS_W - w));
    table.y = snap(clamp(startY + dy, 0, CANVAS_H - h));
    el.style.left = `${table.x}px`;
    el.style.top = `${table.y}px`;
    highlightRoomForTable(table);
  }

  function onTablePointerUp(event) {
    if (!movingTable || (event.pointerId !== undefined && event.pointerId !== movingTable.pointerId)) return;
    const { table, moved } = movingTable;
    movingTable.el.classList.remove('is-moving');
    document.querySelectorAll('.room').forEach(r => r.classList.remove('drag-over'));

    if (moved) {
      const detected = detectRoom(table);
      if (detected) table.room = detected;
      movingTable = null;
      commit({ guests: false, message: 'Table position saved' });
    } else {
      movingTable = null;
      openTableDialog(table.id);
    }
  }

  function detectRoom(table) {
    const w = table.type === 'head' ? HEAD_W : ROUND_W;
    const h = table.type === 'head' ? HEAD_H : ROUND_H;
    const cx = table.x + w / 2;
    const cy = table.y + h / 2;
    let bestRoom = null;
    let bestDist = Infinity;

    Object.entries(ROOM_BOUNDS).forEach(([name, b]) => {
      if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
        bestRoom = name;
        bestDist = -1;
        return;
      }
      if (bestDist === -1) return;
      const rcx = b.x + b.w / 2;
      const rcy = b.y + b.h / 2;
      const dist = Math.hypot(cx - rcx, cy - rcy);
      if (dist < bestDist) { bestDist = dist; bestRoom = name; }
    });
    return bestRoom;
  }

  function highlightRoomForTable(table) {
    const room = detectRoom(table);
    document.querySelectorAll('.room').forEach(el => el.classList.toggle('drag-over', el.dataset.room === room));
  }

  function openTableDialog(tableId) {
    const table = getTable(tableId);
    if (!table) return;
    els.editingTableId.value = table.id;
    els.tableDialogTitle.textContent = `Edit ${table.name}`;
    els.tableNameInput.value = table.name;
    els.tableRoomInput.value = table.room;
    els.tableDialog.showModal();
    setTimeout(() => els.tableNameInput.select(), 0);
  }

  function openGuestDialog(guestId) {
    const guest = getGuest(guestId);
    if (!guest) return;
    const assignment = findGuestSeat(guest.id);
    els.editingGuestId.value = guest.id;
    els.guestDialogTitle.textContent = guest.name;
    els.guestNameInput.value = guest.name;
    els.guestGroupInput.value = guest.group || '';
    els.guestRsvpInput.value = guest.rsvp || 'awaiting';
    els.guestMealInput.value = guest.meal || '';
    els.guestDietaryInput.value = guest.dietary || '';
    els.guestNotesInput.value = guest.notes || '';
    els.guestAssignmentSummary.textContent = assignment
      ? `${assignment.table.name} · ${roomLabel(assignment.table.room)} · Seat ${assignment.seatIndex + 1}`
      : 'Currently unseated';
    els.unseatGuestBtn.disabled = !assignment;
    els.guestDialog.showModal();
  }

  function openAssignDialog(tableId, seatIndex) {
    const table = getTable(tableId);
    if (!table) return;
    pendingSeat = { tableId, seatIndex };
    els.assignDialogTitle.textContent = `Assign ${table.name} · Seat ${seatIndex + 1}`;
    els.assignSeatSummary.textContent = `Choose a guest below, or close this window and drag a guest directly onto seat ${seatIndex + 1}.`;
    els.assignGuestSearch.value = '';
    renderAssignGuestList();
    els.assignDialog.showModal();
    setTimeout(() => els.assignGuestSearch.focus(), 0);
  }

  function renderAssignGuestList() {
    if (!pendingSeat) return;
    const query = els.assignGuestSearch.value.trim().toLowerCase();
    const assignments = getAssignments();
    const matches = [...state.guests]
      .filter(isSeatableGuest)
      .filter(g => !query || `${g.name} ${g.group || ''} ${rsvpLabel(g.rsvp)} ${g.meal || ''} ${g.dietary || ''}`.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name));

    els.assignGuestList.innerHTML = '';
    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No guests match that search.';
      els.assignGuestList.appendChild(empty);
      return;
    }

    matches.forEach(guest => {
      const assignment = assignments.get(guest.id);
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'assign-guest-option';
      const strong = document.createElement('strong');
      strong.textContent = guest.name;
      const meta = document.createElement('span');
      meta.textContent = assignment
        ? `${assignment.table.name} · Seat ${assignment.seatIndex + 1} (will move)`
        : `${rsvpShortLabel(guest.rsvp)}${mealShort(guest.meal) ? ` · ${mealShort(guest.meal)}` : ''}`;
      button.append(strong, meta);
      button.addEventListener('click', () => {
        if (!pendingSeat) return;
        assignGuestToSeat(guest.id, pendingSeat.tableId, pendingSeat.seatIndex);
        els.assignDialog.close();
        pendingSeat = null;
      });
      els.assignGuestList.appendChild(button);
    });
  }


  function maybeSyncOfficialGuestList() {
    if ((Number(state.settings?.guestSeedVersion) || 0) >= GUEST_SEED_VERSION) return false;
    return syncOfficialGuestList({ force: false });
  }

  function syncOfficialGuestList({ force = false } = {}) {
    if (!Array.isArray(OFFICIAL_GUESTS) || !OFFICIAL_GUESTS.length) return false;

    const bySource = new Map(
      state.guests
        .filter(g => g.sourceId)
        .map(g => [g.sourceId, g])
    );

    const unmatchedByName = new Map();
    state.guests.forEach(guest => {
      if (guest.sourceId) return;
      const key = normalizeName(guest.name);
      if (!unmatchedByName.has(key)) unmatchedByName.set(key, []);
      unmatchedByName.get(key).push(guest);
    });

    let added = 0;
    let updated = 0;

    OFFICIAL_GUESTS.forEach(seed => {
      let guest = bySource.get(seed.sourceId) || null;

      if (!guest) {
        const bucket = unmatchedByName.get(normalizeName(seed.name)) || [];
        guest = bucket.shift() || null;
      }

      if (guest) {
        guest.sourceId = seed.sourceId;
        guest.name = seed.name;
        guest.rsvp = seed.rsvp;
        guest.meal = seed.meal || '';
        guest.dietary = seed.dietary || '';
        guest.group = guest.group || '';
        guest.notes = guest.notes || '';
        updated++;
      } else {
        state.guests.push({
          id: uid('guest'),
          sourceId: seed.sourceId,
          name: seed.name,
          group: '',
          rsvp: seed.rsvp,
          meal: seed.meal || '',
          dietary: seed.dietary || '',
          notes: ''
        });
        added++;
      }
    });

    state.settings.guestSeedVersion = GUEST_SEED_VERSION;

    // If a guest was changed to Not Attending, do not leave them assigned to a seat.
    const declinedIds = new Set(state.guests.filter(g => g.rsvp === 'not_attending').map(g => g.id));
    state.tables.forEach(table => {
      table.seats = table.seats.map(id => declinedIds.has(id) ? null : id);
    });

    renderAll();
    saveState(force ? `RSVP list synced · ${added} added, ${updated} updated` : 'Official guest list loaded');
    if (force) toast(`RSVP list synced: ${added} added, ${updated} updated.`);
    return added > 0 || updated > 0;
  }

  function normalizeName(name) {
    return String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');
  }

  function normalizeRsvp(value) {
    const raw = String(value || '').trim().toLowerCase().replace(/[_-]+/g, ' ');
    if (raw === 'attending' || raw === 'yes') return 'attending';
    if (raw === 'not attending' || raw === 'declined' || raw === 'no') return 'not_attending';
    return 'awaiting';
  }

  function rsvpLabel(value) {
    return value === 'attending' ? 'Attending'
      : value === 'not_attending' ? 'Not Attending'
      : 'Awaiting Reply';
  }

  function rsvpShortLabel(value) {
    return value === 'attending' ? 'Attending'
      : value === 'not_attending' ? 'Declined'
      : 'Awaiting';
  }

  function isSeatableGuest(guest) {
    return guest && guest.rsvp !== 'not_attending';
  }

  function mealShort(meal) {
    const value = String(meal || '').trim();
    if (!value) return '';
    if (/filet mignon/i.test(value)) return 'Filet';
    if (/lemon chicken/i.test(value)) return 'Chicken';
    if (/bourbon-glazed salmon/i.test(value)) return 'Salmon';
    if (/lattice/i.test(value) || /vegan/i.test(value)) return 'Vegan';
    if (/kids meal/i.test(value)) return 'Kids Meal';
    return value.length > 28 ? `${value.slice(0, 25)}…` : value;
  }

  function fitSelectedRoom() {
    const room = els.targetRoom.value || 'center';
    const bounds = ROOM_BOUNDS[room];
    const available = Math.max(240, els.canvasScroll.clientWidth - 28);
    uiZoom = clamp(Math.floor((available / (bounds.w + 40)) * 100 / 5) * 5, 45, 140);
    localStorage.setItem(ZOOM_KEY, String(uiZoom));
    applyZoom();
    requestAnimationFrame(() => scrollToRoom(room));
  }

  function scrollToRoom(room) {
    const bounds = ROOM_BOUNDS[room];
    if (!bounds) return;
    const scale = uiZoom / 100;
    const targetLeft = Math.max(0, (bounds.x - 20) * scale - 8);
    const targetTop = Math.max(0, (bounds.y - 45) * scale - 8);
    els.canvasScroll.scrollTo({ left: targetLeft, top: targetTop, behavior: 'smooth' });
  }

  function exportBackup() {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `wedding-seating-backup-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Backup downloaded.');
  }

  async function importBackup(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!imported || !Array.isArray(imported.guests) || !Array.isArray(imported.tables)) throw new Error('Invalid backup');
      if (!confirm('Replace the current seating chart with this backup?')) return;
      state = imported;
      normalizeState();
      renderAll();
      saveState('Backup imported');
      toast('Backup imported successfully.');
    } catch (err) {
      alert('That file does not look like a valid seating planner backup.');
      console.error(err);
    }
  }

  function resetAll() {
    if (!confirm('Reset the entire seating chart? This removes all guests and tables from the shared Supabase chart too. Export a backup first if you may need it.')) return;
    state = emptyState();
    renderAll();
    saveState('Chart reset');
  }

  function applyZoom() {
    uiZoom = clamp(Number(uiZoom) || 100, 45, 140);
    els.zoomRange.value = String(uiZoom);
    els.zoomValue.textContent = `${uiZoom}%`;
    els.canvasZoom.style.transform = `scale(${uiZoom / 100})`;
    els.canvasZoom.style.width = `${CANVAS_W * uiZoom / 100}px`;
    els.canvasZoom.style.height = `${CANVAS_H * uiZoom / 100}px`;
  }

  function getGuest(id) { return state.guests.find(g => g.id === id); }
  function getTable(id) { return state.tables.find(t => t.id === id); }
  function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }
  function snap(v) { return Math.round(v / GRID) * GRID; }

  function shortName(name) {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 5);
    return `${parts[0].slice(0, 3)} ${parts.at(-1).charAt(0)}.`;
  }

  function roomLabel(room) {
    return room === 'east' ? 'East Room' : room === 'west' ? 'West Room' : 'Center Room';
  }

  function toast(message) {
    document.querySelector('.toast')?.remove();
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = message;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2400);
  }
})();
