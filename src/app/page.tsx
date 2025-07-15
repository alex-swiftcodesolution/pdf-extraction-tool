/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import axios, { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { ApiResponse, TableData } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, UploadCloud, X } from "lucide-react";
import { toast } from "sonner";

// Utility function to format field names for display
const formatFieldName = (field: string): string => {
  return field
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

// Utility function to determine text alignment based on content
const getTextAlignment = (value: any): string => {
  return typeof value === "number" ? "text-right" : "text-left";
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [tables, setTables] = useState<TableData[]>([]);
  const [fields, setFields] = useState<ApiResponse["fields"] | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a valid PDF file.");
        toast.error("Please select a valid PDF file.");
        return;
      }
      setFile(selectedFile);
      setError("");
      setTables([]);
      setFields(null);
      toast.success(`Selected: ${selectedFile.name}`);
    }
  };

  const clearFile = () => {
    setFile(null);
    setError("");
    setTables([]);
    setFields(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      toast.error("Please select a PDF file.");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await axios.post<ApiResponse>(
        "http://127.0.0.1:8000/upload-pdf/",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      if (response.data.tables) {
        setTables(response.data.tables);
        setFields(response.data.fields || null);
        toast.success(
          `Extracted ${response.data.tables.length} tables from PDF.`
        );
      } else {
        setError(response.data.message || "No tables found.");
        toast.error(
          response.data.message ||
            "The PDF didn't contain any extractable tables."
        );
      }
    } catch (err) {
      const error = err as AxiosError<{ detail?: string }>;
      const errorMessage =
        error.response?.data?.detail || "Error uploading PDF.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-7xl p-4 sm:p-6 mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-center">
          PDF Table Extractor
        </h1>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-4">
              <Label htmlFor="pdf-upload" className="text-lg font-semibold">
                Upload PDF File
              </Label>
              <div className="relative">
                <Input
                  id="pdf-upload"
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  ref={fileInputRef}
                  className={`w-full ${error ? "border-red-500" : ""}`}
                  aria-describedby="file-error"
                  aria-invalid={!!error}
                />
                {file && (
                  <div className="mt-2 text-sm text-gray-600 flex items-center justify-between">
                    <span>{file.name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearFile}
                      aria-label="Clear selected file"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Button
                onClick={handleUpload}
                disabled={loading || !file}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
              <p className="text-red-600 text-sm" id="file-error">
                {error}
              </p>
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
                  <h2 className="text-xl sm:text-2xl font-semibold">
                    Extracted Fields
                  </h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                    {Object.entries(fields).map(([key, value]) => (
                      <div key={key} className="flex flex-col">
                        <span className="font-medium text-sm">
                          {formatFieldName(key)}:
                        </span>
                        <span className="text-gray-600 text-sm">
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
            className="flex"
          >
            {tables.map((table, index) => {
              const columns = Object.keys(table.data[0] || {}).filter(
                (key) => key !== "Source_Text" && key !== "Page_Number"
              );

              if (!columns.length) {
                return null;
              }

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <div className="w-full overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                          {columns.map((header) => (
                            <th
                              key={header}
                              className="border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium min-w-[120px]"
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
                                className={`border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm ${getTextAlignment(
                                  row[col]
                                )}`}
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
