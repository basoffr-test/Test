import Button from "react-bootstrap/Button";
import { Spinner, Badge } from "react-bootstrap";

const ConnectWallet = (props) => {
  const { 
    handleConnect, 
    isConnected, 
    isConnecting,
    account,
    currentNetwork,
    isSupportedNetwork,
    isLoading
  } = props;

  // Determine button state and content
  const getButtonContent = () => {
    if (isLoading || isConnecting) {
      return (
        <>
          <Spinner animation="border" size="sm" className="me-2" />
          {isConnecting ? 'Connecting...' : 'Loading...'}
        </>
      );
    }

    if (isConnected) {
      return (
        <>
          <span>✅ Connected</span>
          {account && (
            <div style={{ fontSize: '12px', marginTop: '4px' }}>
              {account.substring(0, 6)}...{account.substring(38)}
            </div>
          )}
        </>
      );
    }

    return 'Connect Wallet';
  };

  // Determine button styling
  const getButtonStyle = () => {
    if (isLoading || isConnecting) {
      return "btn btn-secondary";
    }
    
    if (isConnected) {
      return "btn btn-success";
    }
    
    return "btn btn-primary";
  };

  return (
    <div className="text-center">
      <Button
        className={getButtonStyle()}
        onClick={handleConnect}
        disabled={isLoading || isConnecting}
        style={{ minWidth: '200px', minHeight: '60px' }}
      >
        <h3>{getButtonContent()}</h3>
      </Button>
      
      {/* Network status display */}
      {isConnected && currentNetwork && (
        <div className="mt-2">
          <Badge 
            bg={isSupportedNetwork ? "success" : "warning"}
            className="me-2"
          >
            {currentNetwork.name}
          </Badge>
          <small className="text-muted">
            {isSupportedNetwork ? "Supported Network" : "Unsupported Network"}
          </small>
        </div>
      )}
    </div>
  );
};

export default ConnectWallet;



