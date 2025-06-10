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
  fields?: {
    illustration_date: string | null;
    insured_name: string | null;
    initial_death_benefit: string | null;
    assumed_ror: string | null;
    minimum_initial_pmt: string | null;
  };
  message?: string;
}

// "https://pdf-extraction-tool-backend-production.up.railway.app/upload-pdf/",
