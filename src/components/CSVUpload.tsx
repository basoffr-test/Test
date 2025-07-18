import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, X, CheckCircle, AlertCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CSVData {
  address: string;
  amount: string;
}

interface CSVUploadProps {
  onDataUpload: (data: CSVData[]) => void;
  data: CSVData[];
}

const CSVUpload = ({ onDataUpload, data }: CSVUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [duplicates, setDuplicates] = useState<string[]>([]);
  const { toast } = useToast();

  const validateAddress = (address: string): boolean => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const validateAmount = (amount: string): boolean => {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  };

  const processCSV = useCallback((csvText: string) => {
    setIsProcessing(true);
    setValidationErrors([]);
    setDuplicates([]);

    try {
      const lines = csvText.trim().split('\n');
      const errors: string[] = [];
      const duplicateAddresses: string[] = [];
      const addressSeen = new Set<string>();
      const processedData: CSVData[] = [];

      // Skip header if it exists
      const startIndex = lines[0].toLowerCase().includes('address') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const parts = line.split(',').map(part => part.trim().replace(/"/g, ''));
        
        if (parts.length < 2) {
          errors.push(`Regel ${i + 1}: Onvoldoende kolommen`);
          continue;
        }

        const [address, amount] = parts;

        // Validate address
        if (!validateAddress(address)) {
          errors.push(`Regel ${i + 1}: Ongeldig Ethereum adres: ${address}`);
          continue;
        }

        // Check for duplicates
        if (addressSeen.has(address.toLowerCase())) {
          duplicateAddresses.push(address);
          continue;
        }
        addressSeen.add(address.toLowerCase());

        // Validate amount
        if (!validateAmount(amount)) {
          errors.push(`Regel ${i + 1}: Ongeldig bedrag: ${amount}`);
          continue;
        }

        processedData.push({ address, amount });
      }

      setValidationErrors(errors);
      setDuplicates(duplicateAddresses);

      if (errors.length === 0 && processedData.length > 0) {
        onDataUpload(processedData);
        toast({
          title: "CSV Upload Succesvol",
          description: `${processedData.length} ontvangers geladen`,
        });
      } else if (errors.length > 0) {
        toast({
          title: "Validatie Fouten",
          description: `${errors.length} fouten gevonden in CSV`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Fout bij verwerken CSV",
        description: "Controleer of het bestand correct geformatteerd is",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  }, [onDataUpload, toast]);

  const handleFileUpload = (file: File) => {
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Ongeldig bestand",
        description: "Upload alleen CSV bestanden",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const csvText = e.target?.result as string;
      processCSV(csvText);
    };
    reader.readAsText(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const downloadTemplate = () => {
    const csvContent = "address,amount\n0x742d35Cc6634C0532925a3b8D1c8b4fa74e0d8fa,100\n0x8ba1f109551bD432803012645Hac136c,50";
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'airdrop-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const clearData = () => {
    onDataUpload([]);
    setValidationErrors([]);
    setDuplicates([]);
  };

  return (
    <Card className="card-glow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary" />
          CSV Upload
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="space-y-4">
            {/* Upload Zone */}
            <div
              className={`upload-zone ${isDragOver ? 'upload-zone-active' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('csv-input')?.click()}
            >
              <div className="space-y-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium mb-2">
                    Sleep CSV bestand hier of klik om te uploaden
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Formaat: address,amount (max 10MB)
                  </p>
                </div>
              </div>
            </div>

            <input
              id="csv-input"
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
            />

            {/* Template Download */}
            <div className="flex justify-center">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="w-4 h-4" />
                Download Template
              </Button>
            </div>

            {/* Processing State */}
            {isProcessing && (
              <div className="text-center py-4">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Verwerken van CSV...</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Success State */}
            <div className="flex items-center justify-between p-4 bg-accent/10 border border-accent/20 rounded-lg">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-accent" />
                <div>
                  <p className="font-medium">CSV Succesvol Geladen</p>
                  <p className="text-sm text-muted-foreground">
                    {data.length} ontvangers • Totaal: {data.reduce((sum, item) => sum + parseFloat(item.amount), 0).toLocaleString()} tokens
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={clearData}>
                <X className="w-4 h-4" />
                Clear
              </Button>
            </div>

            {/* Preview Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="bg-muted/50 px-4 py-2 border-b border-border">
                <h4 className="font-medium text-sm">Preview (eerste 5 rijen)</h4>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/30">
                    <tr>
                      <th className="text-left p-3 font-medium">Adres</th>
                      <th className="text-right p-3 font-medium">Bedrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 5).map((row, index) => (
                      <tr key={index} className="border-t border-border/50">
                        <td className="p-3 font-mono text-xs">
                          {row.address.slice(0, 6)}...{row.address.slice(-4)}
                        </td>
                        <td className="p-3 text-right font-medium">
                          {parseFloat(row.amount).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <h4 className="font-medium text-destructive">Validatie Fouten</h4>
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {validationErrors.slice(0, 10).map((error, index) => (
                <p key={index} className="text-sm text-destructive">{error}</p>
              ))}
              {validationErrors.length > 10 && (
                <p className="text-sm text-muted-foreground">
                  +{validationErrors.length - 10} meer fouten...
                </p>
              )}
            </div>
          </div>
        )}

        {/* Duplicates Warning */}
        {duplicates.length > 0 && (
          <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-orange-500" />
              <h4 className="font-medium text-orange-500">Duplicate Adressen Gevonden</h4>
            </div>
            <p className="text-sm text-orange-600">
              {duplicates.length} duplicate adressen werden overgeslagen
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CSVUpload;