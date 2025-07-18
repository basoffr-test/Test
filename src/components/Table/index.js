/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-hooks/rules-of-hooks */
import Table from "react-bootstrap/Table";
import Button from "react-bootstrap/Button";
import { useEffect, useState } from "react";
import "./style.css";

const SenderTable = (props) => {
  const { wallets, setWallets, isConnected } = props;
  const { currentPage, setCurrentPage } = useState(1);
  const [itemPerPage] = useState(5);

  useEffect(() => {
    // This effect is kept for potential future pagination implementation
  }, [wallets, currentPage]);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };
  const uploadWallet = async (e) => {
    // setWallets(dummy);
    const response = await fetch(process.env.PUBLIC_URL + "/wallets.csv");
    const data = await response.text();
    const dataArray = data.replace(/\s/g, "").split(",");
    const resultArr = dataArray.filter((item) => item !== "");
    setWallets(resultArr);
  };

  return (
    <div>
      <Table responsive>
        <thead>
          <tr>
            <th>No</th>
            <th>Wallet Address</th>
          </tr>
        </thead>
        <tbody>
          {wallets && wallets.length > 0
            ? wallets.map((e, idx) => {
                return (
                  <tr>
                    <td>{idx + 1}</td>
                    <td>{e}</td>
                  </tr>
                );
              })
            : "No data"}
        </tbody>
      </Table>

      {/* <Pagination>
        {[
          ...Array(Math.ceil(wallets && wallets.length / itemPerPage)).key(),
        ].map(
          // eslint-disable-next-line array-callback-return
          (number) => {
            <Pagination.Item
              key={number + 1}
              active={number + 1 === currentPage}
              onClick={() => handlePageChange(number + 1)}
            >
              {number + 1}
            </Pagination.Item>;
          }
        )}
      </Pagination> */}

      <div className="tableButton">
        <Button
          className="uploadButton"
          disabled={!isConnected}
          onClick={uploadWallet}
        >
          Upload file
        </Button>
        {/* <InputGroup className="addButton">
          <Form.Control
            placeholder="New Wallet Address"
            aria-label="Recipient's username"
            aria-describedby="basic-addon2"
            aria-disabled={!isConnected}
          />
          <Button variant="primary" id="button-addon2" disabled={!isConnected}>
            Add
          </Button>
        </InputGroup> */}
      </div>
    </div>
  );
};

export default SenderTable;
