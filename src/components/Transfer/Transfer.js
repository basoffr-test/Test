import React from "react";
import AirdropMain from "../Airdrop";
import "./Transfer.css";

/**
 * Transfer Component - Replaced with AirdropMain
 * This component now provides the complete airdrop functionality
 * while maintaining backward compatibility with existing props
 */
const Transfer = (props) => {
  // Extract any existing props for backward compatibility
  const { quantity, setQuantity, totalQuantity, balanceAmount, ...otherProps } = props;

  return (
    <div className="eth_transfer">
      {/* Legacy props display for backward compatibility */}
      {quantity !== undefined && (
        <div className="legacy-info mb-3">
          <div className="alert alert-info">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Legacy Mode:</strong> This component has been upgraded to the new Airdrop system.
            {quantity && (
              <div className="mt-2">
                <small>
                  Previous quantity: {quantity} | 
                  Total: {totalQuantity} | 
                  Balance: {balanceAmount}
                </small>
              </div>
            )}
          </div>
        </div>
      )}

      {/* New AirdropMain Component */}
      <AirdropMain {...otherProps} />
    </div>
  );
};

export default Transfer;
