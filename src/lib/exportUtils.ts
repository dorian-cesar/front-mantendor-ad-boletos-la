/**
 * Convierte un array de objetos a CSV y lo descarga como archivo en el navegador.
 * @param data - Array de objetos con las filas a exportar
 * @param filename - Nombre del archivo sin extensión
 */
export function exportToCSV(data: Record<string, any>[], filename: string): void {
  if (!data || data.length === 0) return;

  // Extraer cabeceras del primer objeto
  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Fila de cabeceras
  csvRows.push(headers.join(","));

  // Filas de datos
  for (const row of data) {
    const values = headers.map((header) => {
      const val = row[header];
      // Escapar comillas dobles internas y envolver en comillas
      const escaped = ("" + (val ?? "")).replace(/"/g, '""');
      return `"${escaped}"`;
    });
    csvRows.push(values.join(","));
  }

  // Añadir BOM UTF-8 para que Excel lo abra correctamente con tildes y caracteres especiales
  const BOM = "\uFEFF";
  const csvString = BOM + csvRows.join("\n");

  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();

  // Limpieza
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
