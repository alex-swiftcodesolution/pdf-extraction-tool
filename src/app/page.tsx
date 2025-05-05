"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type TableData = {
  name: string;
  columns: string[];
  data: Record<string, string>[];
};

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [tables, setTables] = useState<TableData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: false,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a PDF file.");
      return;
    }

    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(
        "https://pdf-extraction-tool-backend-production.up.railway.app/extract-tables",
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Failed to extract tables.");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.error);
      }
      setTables(data.tables);
      setFile(null);
      // Reset file input value manually
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError("Error extracting tables. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = (table: TableData, index: number) => {
    const headers = table.columns.join(",");
    const rows = table.data.map((row) =>
      table.columns.map((col) => `"${row[col] || ""}"`).join(",")
    );
    const csvContent = [headers, ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `table_${index + 1}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main className="container mx-auto p-6 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-8 text-center">
          PDF Table Extractor
        </h1>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload PDF</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/10"
                  : "border-gray-300"
              }`}
            >
              {/* <input {...getInputProps()} /> */}
              <p className="text-gray-500 mb-4">
                {isDragActive
                  ? "Drop the PDF here"
                  : "Drag & drop a PDF or click to select"}
              </p>
              <div className="flex items-center justify-center gap-4 flex-wrap">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  className="max-w-md"
                  ref={fileInputRef}
                  aria-label="Select PDF file"
                />
                <Button
                  onClick={handleUpload}
                  disabled={loading || !file}
                  className="flex items-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Processing...
                    </>
                  ) : (
                    "Extract Tables"
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <Alert variant="destructive" className="mb-8">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {tables.length > 0 ? (
            tables.map((table, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="mb-8">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>
                      Table {index + 1}: {table.name}
                    </CardTitle>
                    <Button
                      variant="outline"
                      onClick={() => downloadCSV(table, index)}
                    >
                      Download CSV
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-scroll border rounded-lg">
                      <Table className="min-w-full text-sm">
                        <TableHeader className="sticky top-0 bg-gray-100 z-10">
                          <TableRow>
                            {table.columns.map((col, colIdx) => (
                              <TableHead
                                key={colIdx}
                                className="p-2 text-center font-semibold whitespace-normal break-words min-w-[150px] max-w-[300px]"
                              >
                                {col || "Unnamed"}
                              </TableHead>
                            ))}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {table.data.length > 0 ? (
                            table.data.map((row, rowIdx) => (
                              <TableRow key={rowIdx}>
                                {table.columns.map((col, colIdx) => (
                                  <TableCell
                                    key={colIdx}
                                    className="p-2 text-center whitespace-pre-wrap break-words max-w-[300px]"
                                  >
                                    {row[col] || ""}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell
                                colSpan={table.columns.length}
                                className="text-center"
                              >
                                No data available
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : !loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <p className="text-gray-500 text-lg">
                No tables extracted yet. Upload a PDF to begin.
              </p>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>
    </main>
  );
}
