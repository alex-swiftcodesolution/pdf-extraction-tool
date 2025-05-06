export interface TableRow {
  [key: string]: string | number | null;
  Source_Text: string;
  Page_Number: number;
}

export interface TableData {
  source_text: string;
  page_number: number;
  data: TableRow[];
}

export interface ApiResponse {
  tables?: TableData[];
  message?: string;
}
