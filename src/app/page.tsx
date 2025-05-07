"use client";

import { useState } from "react";
import axios, { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ApiResponse, TableData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

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
      toast("Please select a PDF file.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post<ApiResponse>(
        // "https://pdf-extraction-tool-backend-production.up.railway.app/upload-pdf/",
        "http://localhost:8000/upload-pdf/",
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
        toast(`Extracted ${response.data.tables.length} tables from PDF.`);
      } else {
        setError(response.data.message || "No tables found.");
        toast(
          response.data.message ||
            "The PDF didn't contain any extractable tables."
        );
      }
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>;
      const errorMessage =
        error.response?.data?.detail || "Error uploading PDF.";
      setError(errorMessage);
      toast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full p-6 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6 text-center">
          PDF Table Extractor
        </h1>

        <Card className="mb-8">
          <CardHeader>
            <h2 className="text-xl font-semibold">Upload PDF</h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label htmlFor="pdf-upload">PDF File</Label>
                <Input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                />
              </div>

              <Button
                onClick={handleUpload}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <UploadCloud className="mr-2 h-4 w-4" />
                    Upload PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6"
            >
              <p className="text-red-600">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Tables Display - Kept the same as original but wrapped in animations */}
      <AnimatePresence>
        {tables.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
          >
            {tables.map((table, index) => {
              // Get column headers, excluding metadata
              const columns = Object.keys(table.data[0] || {}).filter(
                (key) => key !== "Source_Text" && key !== "Page_Number"
              );
              console.log(`Table ${index + 1} columns:`, columns);

              if (!columns.length) {
                return (
                  <motion.div
                    key={index}
                    className="mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h2 className="text-xl font-semibold mb-2">
                      Table from {table.source_text} (Page {table.page_number})
                    </h2>
                    <p className="text-red-600">
                      No columns found for this table.
                    </p>
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={index}
                  className="mb-8 w-full"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <h2 className="text-xl font-semibold mb-2">
                    Table from {table.source_text} (Page {table.page_number})
                  </h2>
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200 table-fixed">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                          {columns.map((header) => (
                            <th
                              key={header}
                              className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-left text-sm font-medium"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.data.map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className="even:bg-gray-50 dark:even:bg-gray-900/50"
                          >
                            {columns.map((col) => (
                              <td
                                key={col}
                                className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm text-wrap"
                              >
                                {row[col] ?? ""}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
