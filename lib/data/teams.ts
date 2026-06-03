// WM 2026 - Teams und Gruppen
// Quelle: FIFA-Auslosung vom 5. Dezember 2025

export const GROUPS: Record<string, string[]> = {
  A: ["Mexiko", "Südkorea", "Südafrika", "Tschechien"],
  B: ["Kanada", "Schweiz", "Katar", "Bosnien-Herzegowina"],
  C: ["Brasilien", "Marokko", "Schottland", "Haiti"],
  D: ["USA", "Paraguay", "Australien", "Türkei"],
  E: ["Deutschland", "Ecuador", "Elfenbeinküste", "Curaçao"],
  F: ["Niederlande", "Japan", "Tunesien", "Schweden"],
  G: ["Belgien", "Iran", "Ägypten", "Neuseeland"],
  H: ["Spanien", "Uruguay", "Saudi-Arabien", "Kap Verde"],
  I: ["Frankreich", "Senegal", "Norwegen", "Irak"],
  J: ["Argentinien", "Österreich", "Algerien", "Jordanien"],
  K: ["Portugal", "Kolumbien", "Usbekistan", "DR Kongo"],
  L: ["England", "Kroatien", "Panama", "Ghana"],
};

export const ALL_TEAMS: string[] = Object.values(GROUPS).flat();

export const FLAGS: Record<string, string> = {
  Mexiko: "🇲🇽", Südkorea: "🇰🇷", Südafrika: "🇿🇦", Tschechien: "🇨🇿",
  Kanada: "🇨🇦", Schweiz: "🇨🇭", Katar: "🇶🇦", "Bosnien-Herzegowina": "🇧🇦",
  Brasilien: "🇧🇷", Marokko: "🇲🇦", Schottland: "🏴󠁧󠁢󠁳󠁣󠁴󠁿", Haiti: "🇭🇹",
  USA: "🇺🇸", Paraguay: "🇵🇾", Australien: "🇦🇺", Türkei: "🇹🇷",
  Deutschland: "🇩🇪", Ecuador: "🇪🇨", Elfenbeinküste: "🇨🇮", Curaçao: "🇨🇼",
  Niederlande: "🇳🇱", Japan: "🇯🇵", Tunesien: "🇹🇳", Schweden: "🇸🇪",
  Belgien: "🇧🇪", Iran: "🇮🇷", Ägypten: "🇪🇬", Neuseeland: "🇳🇿",
  Spanien: "🇪🇸", Uruguay: "🇺🇾", "Saudi-Arabien": "🇸🇦", "Kap Verde": "🇨🇻",
  Frankreich: "🇫🇷", Senegal: "🇸🇳", Norwegen: "🇳🇴", Irak: "🇮🇶",
  Argentinien: "🇦🇷", Österreich: "🇦🇹", Algerien: "🇩🇿", Jordanien: "🇯🇴",
  Portugal: "🇵🇹", Kolumbien: "🇨🇴", Usbekistan: "🇺🇿", "DR Kongo": "🇨🇩",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Kroatien: "🇭🇷", Panama: "🇵🇦", Ghana: "🇬🇭",
};

export const EN_TO_DE: Record<string, string> = {
  "Mexico": "Mexiko", "South Korea": "Südkorea", "Korea Republic": "Südkorea",
  "South Africa": "Südafrika", "Czech Republic": "Tschechien", "Czechia": "Tschechien",
  "Canada": "Kanada", "Switzerland": "Schweiz", "Qatar": "Katar",
  "Bosnia and Herzegovina": "Bosnien-Herzegowina", "Brazil": "Brasilien",
  "Morocco": "Marokko", "Scotland": "Schottland", "Haiti": "Haiti",
  "United States": "USA", "USA": "USA", "Paraguay": "Paraguay",
  "Australia": "Australien", "Türkiye": "Türkei", "Turkey": "Türkei",
  "Germany": "Deutschland", "Ecuador": "Ecuador",
  "Côte d'Ivoire": "Elfenbeinküste", "Ivory Coast": "Elfenbeinküste",
  "Curaçao": "Curaçao", "Curacao": "Curaçao",
  "Netherlands": "Niederlande", "Japan": "Japan", "Tunisia": "Tunesien",
  "Sweden": "Schweden", "Belgium": "Belgien", "Iran": "Iran", "IR Iran": "Iran",
  "Egypt": "Ägypten", "New Zealand": "Neuseeland", "Spain": "Spanien",
  "Uruguay": "Uruguay", "Saudi Arabia": "Saudi-Arabien",
  "Cape Verde": "Kap Verde", "Cabo Verde": "Kap Verde",
  "France": "Frankreich", "Senegal": "Senegal", "Norway": "Norwegen",
  "Iraq": "Irak", "Argentina": "Argentinien", "Austria": "Österreich",
  "Algeria": "Algerien", "Jordan": "Jordanien", "Portugal": "Portugal",
  "Colombia": "Kolumbien", "Uzbekistan": "Usbekistan",
  "DR Congo": "DR Kongo", "Congo DR": "DR Kongo", "Democratic Republic of the Congo": "DR Kongo",
  "England": "England", "Croatia": "Kroatien", "Panama": "Panama", "Ghana": "Ghana",
};

export function flagOf(team: string): string {
  return FLAGS[team] || "🏳️";
}

export function groupOf(team: string): string | null {
  for (const [key, teams] of Object.entries(GROUPS)) {
    if (teams.includes(team)) return key;
  }
  return null;
}

// ISO-3166-1 alpha-2 Codes (für flagcdn.com Bild-Flaggen; gb-eng/gb-sct als Sonderfall)
export const CODES: Record<string, string> = {
  Mexiko: "mx", Südkorea: "kr", Südafrika: "za", Tschechien: "cz",
  Kanada: "ca", Schweiz: "ch", Katar: "qa", "Bosnien-Herzegowina": "ba",
  Brasilien: "br", Marokko: "ma", Schottland: "gb-sct", Haiti: "ht",
  USA: "us", Paraguay: "py", Australien: "au", Türkei: "tr",
  Deutschland: "de", Ecuador: "ec", Elfenbeinküste: "ci", Curaçao: "cw",
  Niederlande: "nl", Japan: "jp", Tunesien: "tn", Schweden: "se",
  Belgien: "be", Iran: "ir", Ägypten: "eg", Neuseeland: "nz",
  Spanien: "es", Uruguay: "uy", "Saudi-Arabien": "sa", "Kap Verde": "cv",
  Frankreich: "fr", Senegal: "sn", Norwegen: "no", Irak: "iq",
  Argentinien: "ar", Österreich: "at", Algerien: "dz", Jordanien: "jo",
  Portugal: "pt", Kolumbien: "co", Usbekistan: "uz", "DR Kongo": "cd",
  England: "gb-eng", Kroatien: "hr", Panama: "pa", Ghana: "gh",
};

export function flagCode(team: string): string | null {
  return CODES[team] || null;
}
