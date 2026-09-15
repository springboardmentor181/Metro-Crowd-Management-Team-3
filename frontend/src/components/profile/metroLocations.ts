export type MetroCity = {
  state: string;
  city: string;
  network: string;
  stations: string[];
};

export const metroCities: MetroCity[] = [
  {
    state: "Delhi NCR",
    city: "Delhi",
    network: "Delhi Metro",
    stations: [
      "Rajiv Chowk",
      "Kashmere Gate",
      "Central Secretariat",
      "Hauz Khas",
      "Dwarka Sector 21",
      "Botanical Garden",
    ],
  },
  {
    state: "West Bengal",
    city: "Kolkata",
    network: "Kolkata Metro",
    stations: [
      "Esplanade",
      "Howrah Maidan",
      "Park Street",
      "Dum Dum",
      "Rabindra Sadan",
      "Salt Lake Sector V",
    ],
  },
  {
    state: "Telangana",
    city: "Hyderabad",
    network: "Hyderabad Metro",
    stations: [
      "Ameerpet",
      "HITEC City",
      "Miyapur",
      "Secunderabad East",
      "Raidurg",
      "LB Nagar",
    ],
  },
  {
    state: "Tamil Nadu",
    city: "Chennai",
    network: "Chennai Metro",
    stations: [
      "Chennai Central",
      "Airport",
      "Guindy",
      "Washermanpet",
      "Thirumangalam",
      "Anna Nagar East",
    ],
  },
  {
    state: "Karnataka",
    city: "Bengaluru",
    network: "Namma Metro",
    stations: [
      "Majestic",
      "MG Road",
      "Indiranagar",
      "Yeshwanthpur",
      "Nagasandra",
      "Kengeri",
    ],
  },
  {
    state: "Maharashtra",
    city: "Mumbai",
    network: "Mumbai Metro",
    stations: [
      "Andheri",
      "Ghatkopar",
      "Versova",
      "Dahisar East",
      "Gundavali",
      "Aarey JVLR",
    ],
  },
  {
    state: "Uttar Pradesh",
    city: "Lucknow",
    network: "Lucknow Metro",
    stations: [
      "Charbagh",
      "Hazratganj",
      "Munshipulia",
      "Alambagh",
      "Transport Nagar",
      "Indira Nagar",
    ],
  },
  {
    state: "Rajasthan",
    city: "Jaipur",
    network: "Jaipur Metro",
    stations: [
      "Mansarovar",
      "Civil Lines",
      "Chandpole",
      "Badi Chaupar",
      "Railway Station",
      "Vivek Vihar",
    ],
  },
  {
    state: "Gujarat",
    city: "Ahmedabad",
    network: "Ahmedabad Metro",
    stations: [
      "Apparel Park",
      "Kalupur",
      "Thaltej",
      "Motera Stadium",
      "Vastral Gam",
      "Gujarat University",
    ],
  },
  {
    state: "Kerala",
    city: "Kochi",
    network: "Kochi Metro",
    stations: [
      "Aluva",
      "Edappally",
      "MG Road",
      "Vyttila",
      "Maharaja's College",
      "Tripunithura Terminal",
    ],
  },
  {
    state: "Madhya Pradesh",
    city: "Bhopal",
    network: "Bhopal Metro",
    stations: [
      "AIIMS Bhopal",
      "DB City",
      "Rani Kamlapati",
      "Subhash Nagar",
      "MP Nagar",
      "Karond Circle",
    ],
  },
  {
    state: "Maharashtra",
    city: "Pune",
    network: "Pune Metro",
    stations: [
      "PCMC",
      "Civil Court",
      "Vanaz",
      "Garware College",
      "Ruby Hall Clinic",
      "Ramwadi",
    ],
  },
];
