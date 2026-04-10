// Defensemen across all 16 playoff teams.
// Every player NOT in this Set is treated as a forward (F).
export const DEFENSEMEN = new Set([
  // ANA
  'John Carlson', 'Jackson LaCombe', 'Jacob Trouba', 'Pavel Mintyukov',
  'Olen Zellweger', 'Drew Helleson', 'Radko Gudas', 'Ian Moore',

  // BOS
  'Charlie McAvoy', 'Hampus Lindholm', 'Mason Lohrei', 'Jordan Harris',
  'Henri Jokiharju', 'Nikita Zadorov', 'Jonathan Aspirot',
  'Vladislav Kolyachonok', 'Andrew Peeke', 'Victor Soderstrom',

  // BUF
  'Rasmus Dahlin', 'Mattias Samuelsson', 'Bowen Byram', 'Owen Power',
  'Logan Stanley', 'Conor Timmins', 'Zach Metsa', 'Luke Schenn',
  'Michael Kesselring', 'Ryan Johnson', 'Mason Geertsen',

  // CAR
  'Shayne Gostisbehere', "K'Andre Miller", 'Alexander Nikishin', 'Sean Walker',
  'Jalen Chatfield', 'Mike Reilly', 'Jaccob Slavin', 'Domenick Fensore',

  // COL
  'Cale Makar', 'Sam Malinski', 'Brent Burns', 'Josh Manson',
  'Nick Blankenburg', 'Devon Toews', 'Keaton Middleton', 'Jack Ahcan',
  'Brett Kulak', 'Taylor Makar',

  // DAL
  'Miro Heiskanen', 'Thomas Harley', 'Esa Lindell', 'Justin Hryckowian',
  'Nils Lundkvist', 'Alexander Petrovic', 'Ilya Lyubushkin',
  'Kyle Capobianco', 'Lian Bichsel', 'Tyler Myers',

  // EDM
  'Evan Bouchard', 'Mattias Ekholm', 'Jake Walman', 'Darnell Nurse',
  'Connor Murphy', 'Ty Emberson', 'Josh Samanski', 'Spencer Stastney',
  'Alec Regula', 'Riley Stillman',

  // LAK
  'Brandt Clarke', 'Drew Doughty', 'Joel Edmundson', 'Brian Dumoulin',
  'Mikey Anderson', 'Cody Ceci', 'Jacob Moverare',

  // MIN
  'Quinn Hughes', 'Brock Faber', 'Jonas Brodin', 'Jared Spurgeon',
  'Matt Kiersted', 'Jake Middleton', 'Daemon Hunt', 'Zach Bogosian',
  'Jeff Petry', 'David Jiricek', 'Carson Lambos', 'David Spacek',

  // MTL
  'Lane Hutson', 'Noah Dobson', 'Mike Matheson', 'Alexandre Carrier',
  'Kaiden Guhle', 'Jayden Struble', 'Florian Xhekaj', 'Arber Xhekaj',
  'Adam Engstrom',

  // OTT
  'Jake Sanderson', 'Thomas Chabot', 'Nick Jensen',

  // PHI
  'Jamie Drysdale',

  // PIT
  'Erik Karlsson', 'Kris Letang', 'Jack St. Ivany', 'Ryan Shea',
  'Parker Wotherspoon', 'Samuel Girard', 'Ilya Solovyov', 'Mathew Dumba',
  'Caleb Jones', 'Connor Clifton', 'Harrison Brunicke', 'Ryan Graves',
  'Owen Pickering',

  // TBL
  'Darren Raddysh', 'Victor Hedman', "Charle-Edouard D'Astous", 'Ryan McDonagh',
  'J.J. Moser', 'Max Crozier', 'Emil Lilleberg', 'Erik Cernak',
  'Steven Santini', 'Declan Carlile', 'Simon Lundmark',

  // UTA
  'Mikhail Sergachev', 'John Marino', 'Sean Durzi', 'MacKenzie Weegar',
  'Ian Cole', 'Nate Schmidt', 'Maveric Lamoureux', 'Nick DeSimone',
  'Dmitri Simashev',

  // VGK
  'Shea Theodore', 'Noah Hanifin', 'Ben Hutton', 'Kaedan Korczak',
  'Jeremy Lauzon', 'Rasmus Andersson', 'Brayden McNabb', 'Zach Whitecloud',
  'Dylan Coghlan', 'Jaycob Megna',
]);

export function getPosition(name) {
  return DEFENSEMEN.has(name) ? 'D' : 'F';
}
