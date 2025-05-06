"use client";

import { useState } from "react";
import axios, { AxiosError } from "axios";
import { ApiResponse, TableData } from "@/lib/types";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [tables, setTables] = useState<TableData[]>([]);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setTables([]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post<ApiResponse>(
        "pdf-extraction-tool-backend-production.up.railway.app/upload-pdf/",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.tables) {
        console.log(
          "Received tables:",
          JSON.stringify(response.data.tables, null, 2)
        );
        setTables(response.data.tables);
      } else {
        setError(response.data.message || "No tables found.");
      }
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>;
      setError(error.response?.data?.detail || "Error uploading PDF.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6">
      <h1 className="text-2xl font-bold mb-4">PDF Table Extractor</h1>

      {/* File Upload */}
      <div className="mb-6">
        <input
          type="file"
          accept="application/pdf"
          onChange={handleFileChange}
          className="mb-2 p-2 border rounded"
        />
        <button
          onClick={handleUpload}
          disabled={loading}
          className={`px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed`}
        >
          {loading ? "Processing..." : "Upload PDF"}
        </button>
      </div>

      {/* Error Message */}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Tables Display */}
      {tables.length > 0 && (
        <div>
          {tables.map((table, index) => {
            // Get column headers, excluding metadata
            const columns = Object.keys(table.data[0] || {}).filter(
              (key) => key !== "Source_Text" && key !== "Page_Number"
            );
            console.log(`Table ${index + 1} columns:`, columns);

            if (!columns.length) {
              return (
                <div key={index} className="mb-8">
                  <h2 className="text-xl font-semibold mb-2">
                    Table from {table.source_text} (Page {table.page_number})
                  </h2>
                  <p className="text-red-600">
                    No columns found for this table.
                  </p>
                </div>
              );
            }

            return (
              <div key={index} className="mb-8 w-full">
                <h2 className="text-xl font-semibold mb-2">
                  Table from {table.source_text} (Page {table.page_number})
                </h2>
                <div className="w-full">
                  <table className="w-full border-collapse border border-gray-400 table-fixed">
                    <thead>
                      <tr className="bg-gray-100">
                        {columns.map((header) => (
                          <th
                            key={header}
                            className="border border-gray-400 px-4 py-2 text-left text-sm font-medium"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {table.data.map((row, rowIdx) => (
                        <tr key={rowIdx} className="even:bg-gray-50">
                          {columns.map((col) => (
                            <td
                              key={col}
                              className="border border-gray-400 px-4 py-2 text-sm text-wrap"
                            >
                              {row[col] ?? ""}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
