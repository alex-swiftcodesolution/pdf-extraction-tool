export interface TableRow {
  [key: string]: string | number | null;
  Source_Text: string | null; // Optional, only in pdfplumber tables
  Page_Number: number | null; // Optional, only in pdfplumber tables
}

export interface TableData {
  source: string;
  page: number;
  keyword: string;
  extractor: "PyMuPDF" | "pdfplumber";
  data: TableRow[];
}

export interface ApiResponse {
  tables?: TableData[];
  message?: string;
}
