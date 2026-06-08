import Papa from "papaparse";

export function downloadCsv(data, filename) {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename + "_" + new Date().toISOString().slice(0, 10) + ".csv";
  link.click();
  URL.revokeObjectURL(url);
}
