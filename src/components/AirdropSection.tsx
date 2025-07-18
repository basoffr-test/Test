import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import WorkflowSteps from "./WorkflowSteps";
import CSVUpload from "./CSVUpload";
import { 
  Settings, 
  Coins, 
  Network, 
  Play, 
  Pause, 
  RotateCcw,
  ExternalLink,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CSVData {
  address: string;
  amount: string;
}

interface AirdropStatus {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  processed: number;
  total: number;
  currentBatch: number;
  totalBatches: number;
  successfulTransfers: number;
  failedTransfers: number;
  txHashes: string[];
  errors: string[];
}

const AirdropSection = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedToken, setSelectedToken] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState("");
  const [csvData, setCsvData] = useState<CSVData[]>([]);
  const [batchSize, setBatchSize] = useState("50");
  const [gasBuffer, setGasBuffer] = useState("20");
  const [airdropStatus, setAirdropStatus] = useState<AirdropStatus>({
    status: 'idle',
    processed: 0,
    total: 0,
    currentBatch: 0,
    totalBatches: 0,
    successfulTransfers: 0,
    failedTransfers: 0,
    txHashes: [],
    errors: []
  });
  const { toast } = useToast();

  const networks = [
    { value: "ethereum", label: "Ethereum Mainnet", chain: "ETH" },
    { value: "polygon", label: "Polygon", chain: "MATIC" },
    { value: "sepolia", label: "Sepolia Testnet", chain: "ETH" },
    { value: "mumbai", label: "Mumbai Testnet", chain: "MATIC" },
  ];

  const commonTokens = [
    { value: "usdc", label: "USDC", address: "0xA0b86a33E6B7dF8B8D4c2F2C1E6E7A9E5B8C7D6F" },
    { value: "usdt", label: "USDT", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" },
    { value: "link", label: "LINK", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA" },
    { value: "custom", label: "Custom Token...", address: "" },
  ];

  const handleNextStep = () => {
    if (currentStep === 1 && (!selectedToken || !selectedNetwork)) {
      toast({
        title: "Selectie Incomplete",
        description: "Selecteer eerst een token en netwerk",
        variant: "destructive",
      });
      return;
    }
    
    if (currentStep === 2 && csvData.length === 0) {
      toast({
        title: "CSV Required",
        description: "Upload eerst een CSV bestand",
        variant: "destructive",
      });
      return;
    }
    
    setCurrentStep(Math.min(currentStep + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep(Math.max(currentStep - 1, 1));
  };

  const startAirdrop = () => {
    if (csvData.length === 0) return;

    const totalBatches = Math.ceil(csvData.length / parseInt(batchSize));
    
    setAirdropStatus({
      status: 'running',
      processed: 0,
      total: csvData.length,
      currentBatch: 1,
      totalBatches,
      successfulTransfers: 0,
      failedTransfers: 0,
      txHashes: [],
      errors: []
    });

    // Simulate airdrop progress
    simulateAirdrop();

    toast({
      title: "Airdrop Gestart",
      description: `Verwerken van ${csvData.length} transfers in ${totalBatches} batches`,
    });
  };

  const simulateAirdrop = () => {
    const totalBatches = Math.ceil(csvData.length / parseInt(batchSize));
    let currentBatch = 1;
    let processed = 0;
    
    const processNextBatch = () => {
      if (currentBatch > totalBatches) {
        setAirdropStatus(prev => ({
          ...prev,
          status: 'completed',
          processed: csvData.length,
        }));
        toast({
          title: "Airdrop Voltooid",
          description: `Alle ${csvData.length} transfers succesvol uitgevoerd`,
        });
        return;
      }

      const batchStart = (currentBatch - 1) * parseInt(batchSize);
      const batchEnd = Math.min(batchStart + parseInt(batchSize), csvData.length);
      const batchSize_actual = batchEnd - batchStart;
      
      // Simulate processing time
      setTimeout(() => {
        processed += batchSize_actual;
        
        setAirdropStatus(prev => ({
          ...prev,
          currentBatch,
          processed,
          successfulTransfers: processed - Math.floor(Math.random() * 2), // Random failures
          failedTransfers: Math.floor(Math.random() * 2),
          txHashes: [...prev.txHashes, `0x${Math.random().toString(16).substr(2, 64)}`]
        }));
        
        currentBatch++;
        processNextBatch();
      }, 2000 + Math.random() * 1000); // Random delay 2-3 seconds
    };
    
    processNextBatch();
  };

  const pauseAirdrop = () => {
    setAirdropStatus(prev => ({ ...prev, status: 'paused' }));
    toast({
      title: "Airdrop Gepauzeerd",
      description: "De airdrop is gepauzeerd en kan worden hervat",
    });
  };

  const resumeAirdrop = () => {
    setAirdropStatus(prev => ({ ...prev, status: 'running' }));
    toast({
      title: "Airdrop Hervat",
      description: "De airdrop wordt hervat",
    });
  };

  const resetAirdrop = () => {
    setAirdropStatus({
      status: 'idle',
      processed: 0,
      total: 0,
      currentBatch: 0,
      totalBatches: 0,
      successfulTransfers: 0,
      failedTransfers: 0,
      txHashes: [],
      errors: []
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'bg-primary text-primary-foreground';
      case 'paused': return 'bg-orange-500 text-white';
      case 'completed': return 'bg-accent text-accent-foreground';
      case 'error': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <Play className="w-4 h-4" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'error': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <section id="airdrop-section" className="py-20 px-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Start Your <span className="text-primary">Token Airdrop</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Volg de eenvoudige 4-stap workflow om uw tokens efficiënt te distribueren naar duizenden ontvangers
          </p>
        </div>

        {/* Workflow Steps */}
        <WorkflowSteps currentStep={currentStep} />

        {/* Step Content */}
        <div className="mt-12">
          {/* Step 1: Token Selection */}
          {currentStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="w-5 h-5 text-primary" />
                    Token Selectie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="token-select">ERC-20 Token</Label>
                    <Select value={selectedToken} onValueChange={setSelectedToken}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecteer een token" />
                      </SelectTrigger>
                      <SelectContent>
                        {commonTokens.map((token) => (
                          <SelectItem key={token.value} value={token.value}>
                            {token.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedToken === "custom" && (
                    <div>
                      <Label htmlFor="custom-token">Token Contract Adres</Label>
                      <Input
                        id="custom-token"
                        placeholder="0x..."
                        className="mt-2 font-mono"
                      />
                    </div>
                  )}

                  {selectedToken && selectedToken !== "custom" && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Contract Adres:</p>
                      <p className="font-mono text-xs break-all">
                        {commonTokens.find(t => t.value === selectedToken)?.address}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="card-glow">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-secondary" />
                    Netwerk Selectie
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="network-select">Blockchain Netwerk</Label>
                    <Select value={selectedNetwork} onValueChange={setSelectedNetwork}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Selecteer een netwerk" />
                      </SelectTrigger>
                      <SelectContent>
                        {networks.map((network) => (
                          <SelectItem key={network.value} value={network.value}>
                            <div className="flex items-center gap-2">
                              <span>{network.label}</span>
                              <Badge variant="outline" className="text-xs">
                                {network.chain}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {selectedNetwork && (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium">
                        {networks.find(n => n.value === selectedNetwork)?.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Native Token: {networks.find(n => n.value === selectedNetwork)?.chain}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: CSV Upload */}
          {currentStep === 2 && (
            <CSVUpload onDataUpload={setCsvData} data={csvData} />
          )}

          {/* Step 3: Preview */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle>Airdrop Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-primary mb-1">
                        {csvData.length.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Ontvangers</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-secondary mb-1">
                        {csvData.reduce((sum, item) => sum + parseFloat(item.amount), 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Totaal Tokens</div>
                    </div>
                    <div className="text-center p-4 bg-muted/30 rounded-lg">
                      <div className="text-2xl font-bold text-accent mb-1">
                        {Math.ceil(csvData.length / parseInt(batchSize))}
                      </div>
                      <div className="text-sm text-muted-foreground">Batches</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="batch-size">Batch Grootte</Label>
                      <Input
                        id="batch-size"
                        type="number"
                        value={batchSize}
                        onChange={(e) => setBatchSize(e.target.value)}
                        min="1"
                        max="100"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Aanbevolen: 20-50 voor optimale gas efficiency
                      </p>
                    </div>
                    <div>
                      <Label htmlFor="gas-buffer">Gas Buffer (%)</Label>
                      <Input
                        id="gas-buffer"
                        type="number"
                        value={gasBuffer}
                        onChange={(e) => setGasBuffer(e.target.value)}
                        min="10"
                        max="50"
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Extra gas voor netwerk fluctuaties
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Execution */}
          {currentStep === 4 && (
            <Card className="card-glow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Airdrop Uitvoering</span>
                  <Badge className={getStatusColor(airdropStatus.status)}>
                    {getStatusIcon(airdropStatus.status)}
                    {airdropStatus.status.charAt(0).toUpperCase() + airdropStatus.status.slice(1)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{airdropStatus.processed} / {airdropStatus.total}</span>
                  </div>
                  <Progress 
                    value={airdropStatus.total > 0 ? (airdropStatus.processed / airdropStatus.total) * 100 : 0}
                    className="progress-glow"
                  />
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg font-bold text-primary">
                      {airdropStatus.currentBatch}/{airdropStatus.totalBatches}
                    </div>
                    <div className="text-xs text-muted-foreground">Batch</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg font-bold text-accent">
                      {airdropStatus.successfulTransfers}
                    </div>
                    <div className="text-xs text-muted-foreground">Succesvol</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg font-bold text-destructive">
                      {airdropStatus.failedTransfers}
                    </div>
                    <div className="text-xs text-muted-foreground">Gefaald</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-lg font-bold text-secondary">
                      {airdropStatus.txHashes.length}
                    </div>
                    <div className="text-xs text-muted-foreground">Transacties</div>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex gap-4 justify-center">
                  {airdropStatus.status === 'idle' && (
                    <Button variant="hero" onClick={startAirdrop} disabled={csvData.length === 0}>
                      <Play className="w-4 h-4" />
                      Start Airdrop
                    </Button>
                  )}
                  
                  {airdropStatus.status === 'running' && (
                    <Button variant="outline" onClick={pauseAirdrop}>
                      <Pause className="w-4 h-4" />
                      Pauzeren
                    </Button>
                  )}
                  
                  {airdropStatus.status === 'paused' && (
                    <>
                      <Button variant="hero" onClick={resumeAirdrop}>
                        <Play className="w-4 h-4" />
                        Hervatten
                      </Button>
                      <Button variant="outline" onClick={resetAirdrop}>
                        <RotateCcw className="w-4 h-4" />
                        Reset
                      </Button>
                    </>
                  )}
                  
                  {airdropStatus.status === 'completed' && (
                    <Button variant="outline" onClick={resetAirdrop}>
                      <RotateCcw className="w-4 h-4" />
                      Nieuwe Airdrop
                    </Button>
                  )}
                </div>

                {/* Transaction Hashes */}
                {airdropStatus.txHashes.length > 0 && (
                  <div className="border border-border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Recente Transacties</h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {airdropStatus.txHashes.slice(-5).map((hash, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="font-mono">{hash.slice(0, 10)}...{hash.slice(-8)}</span>
                          <Button variant="ghost" size="sm">
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button 
              variant="outline" 
              onClick={handlePrevStep}
              disabled={currentStep === 1}
            >
              Vorige
            </Button>
            
            {currentStep < 4 ? (
              <Button 
                variant="hero" 
                onClick={handleNextStep}
              >
                Volgende
              </Button>
            ) : (
              <div /> // Placeholder for alignment
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default AirdropSection;