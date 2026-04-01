export const categoryColors = {
  Kyckling:    "#C27B42",
  Kött:        "#8B3A3A",
  Pasta:       "#C4916A",
  Sallad:      "#4E7A52",
  Soppa:       "#3E6E96",
  Pizza:       "#A0522D",
  Vegetariskt: "#5E7A4A",
  Halvfabrikat:"#7A7A6E",
  Asiatiskt:   "#7A4E28",
  Varm:        "#B85C3A",
  Fisk:        "#2E7A7A",
  Långkok:     "#6A4E8A",
};

export const effortColors = {
  Låg:    "#4E7A52",
  Mellan: "#C27B42",
  Hög:    "#8B3A3A",
};

const CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRWPlrQYogjuqAIWvBmN2FmqApdf1NWj5y_3WgUEJzMvoyZ7o1PftiBBGUt4vyKrBkbi1tEpMhOx68P/pub?gid=1296792460&single=true&output=csv";

function parseCSVLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') {
      inQuotes = !inQuotes;
    } else if (line[i] === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += line[i];
    }
  }
  values.push(current.trim());
  return values;
}

export async function fetchDishes() {
  const res = await fetch(CSV_URL);
  const text = await res.text();
  const lines = text.trim().split("\n");
  const headers = parseCSVLine(lines[0]);
  const nameIdx = headers.indexOf("Maträtt");
  const catIdx = headers.indexOf("Kategori");
  const effortIdx = headers.indexOf("Arbetsinsats");
  const ingIdx = headers.indexOf("Ingredienser");

  return lines.slice(1)
    .map(line => {
      const vals = parseCSVLine(line);
      return {
        name: vals[nameIdx] || "",
        category: (vals[catIdx] || "").trim(),
        effort: (vals[effortIdx] || "").trim(),
        ingredients: vals[ingIdx] || "",
      };
    })
    .filter(d => d.name);
}
