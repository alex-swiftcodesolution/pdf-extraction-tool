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

// Utility function to format field names for display
const formatFieldName = (field: string): string => {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [tables, setTables] = useState<TableData[]>([]);
  const [fields, setFields] = useState<ApiResponse["fields"] | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError("");
      setTables([]);
      setFields(null);
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
        "https://iul-calculator-pro-production.up.railway.app/upload-pdf/",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.tables) {
        setTables(response.data.tables);
        setFields(response.data.fields || null);
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
    <div className="w-full p-6 mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-xl font-bold mb-6 text-center">
          PDF Table Extractor
        </h1>

        <Card className="mb-8">
          <CardContent>
            <div className="flex flex-col space-y-4">
              <Label htmlFor="pdf-upload">PDF File</Label>
              <Input
                id="pdf-upload"
                type="file"
                accept="application/pdf"
                onChange={handleFileChange}
              />

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

        {/* Fields Display Card */}
        <AnimatePresence>
          {fields && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <h2 className="text-xl font-semibold">Extracted Fields</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.entries(fields).map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <span className="font-medium">
                          {formatFieldName(key)}:
                        </span>
                        <span className="text-gray-600">
                          {value !== null ? value : "null"}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {tables.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="flex flex-wrap gap-0"
          >
            {tables.map((table, index) => {
              const columns = Object.keys(table.data[0] || {}).filter(
                (key) => key !== "Source_Text" && key !== "Page_Number"
              );

              if (!columns.length) {
                return (
                  <motion.div
                    key={index}
                    className={`mb-8 ${
                      index === 0
                        ? "w-[80%]"
                        : index === 1
                        ? "w-[20%]"
                        : "w-full"
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  ></motion.div>
                );
              }

              return (
                <motion.div
                  key={index}
                  className={`mb-8 ${
                    index === 0 ? "w-[85%]" : index === 1 ? "w-[15%]" : "w-full"
                  }`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200 table-fixed">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                          {columns.map((header) => (
                            <th
                              key={header}
                              className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-center text-xs font-medium"
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
                                className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-wrap text-right"
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
