import { forwardRef } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { PrintWardLeaderData } from "@/lib/api";

type WardLeaderPrintTemplateProps = {
  wardLeaders?: PrintWardLeaderData[];
  receivedBy?: {
    name: string;
    signature: string;
    position: string;
    timeSigned: string;
  };
};

// This component will be invisible in normal view but will be shown when printed
// We use forwardRef to forward the ref to the DOM node
export const WardLeaderPrintTemplate = forwardRef<HTMLDivElement, WardLeaderPrintTemplateProps>(
  ({ 
    wardLeaders = []
  }, ref) => {
    
    // If no ward leaders provided, return empty template
    if (!wardLeaders || wardLeaders.length === 0) {
      return <div ref={ref} className="hidden print:block">No data to print</div>;
    }

    // Group ward leaders into sets of 3 for printing (3 per sheet)
    const leaderGroups = [];
    for (let i = 0; i < wardLeaders.length; i += 3) {
      leaderGroups.push(wardLeaders.slice(i, i + 3));
    }

    // Function to generate QR code data
    const getQrCodeData = (leader: PrintWardLeaderData) => {
      return JSON.stringify({
        L_ID: leader.leaderId,
        L_Name: leader.name,
        V_ID: leader.v_id
      });
    };

    const renderWardLeaderTemplate = (leader: PrintWardLeaderData, index: number, isLastInGroup: boolean) => {
      return (
        <div key={`leader-${leader.leaderId}-${index}`} className="template-section">
          <div className="print-layout">
            {/* Left Column - Ward Leader Information */}
            <div className="print-left-column">
              {/* Ward Leader Number Header */}
              <h1 className="text-lg font-bold mb-3">Ward Leader ID: #{leader.v_id}</h1>
              
              {/* Voting Preference Table */}
              <div className="print-voting-table-container mt-3">
                <table className="print-voting-table">
                  <thead>
                    <tr>
                      <th className="print-voting-header">NAME</th>
                      <th className="print-voting-header">POSITION</th>
                      <th className="print-voting-header">REMARKS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="print-voting-cell">{leader.votingPreference?.name || leader.name.toUpperCase()}</td>
                      <td className="print-voting-cell">{leader.votingPreference?.position || "WARD LEADER"}</td>
                      <td className="print-voting-cell">
                        {leader.votingPreference?.remarks || 
                         (leader.politicsData?.congressman === 660 && 
                          leader.politicsData?.governor === 662 && 
                          leader.politicsData?.vicegov === 676) ? "STRAIGHT" :
                         (leader.politicsData?.isUndecided ? "UNDECIDED(ALL 3)" : 
                          leader.politicsData?.supportedCandidates || "NO PREFERENCE")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              {/* Additional text at bottom */}
              <div className="ward-leader-info">
                2025 Elections
              </div>
            </div>
            
            {/* Right Column - Received By Section */}
            <div className="print-right-column">
              <h1 className="text-lg font-bold mb-3">Received by:</h1>
              
              <div className="print-signature-section mt-4">
                <div className="print-signature-line">
                  <div className="print-signature-underline"></div>
                  <p className="print-signature-label">Name</p>
                </div>
                
                <div className="print-signature-line mt-1">
                  <div className="print-signature-underline"></div>
                  <p className="print-signature-label">Signature</p>
                </div>
                
                <div className="print-signature-line">
                  <p className="position-legend">
                    WL | BC | AC/DC | MC
                  </p>
                  <div className="print-signature-underline"></div>
                  <p className="print-signature-label">Position</p>
                </div>
                
                <div className="print-signature-line mt-1">
                  <div className="print-signature-underline"></div>
                  <p className="print-signature-label">Time signed</p>
                </div>
                
                {/* QR Code */}
                <div className="print-qr-code">
                  <div className="qr-placeholder">
                    <QRCodeSVG 
                      value={getQrCodeData(leader)}
                      size={60}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"H"}
                      marginSize={3}
                      title={`QR Code for Ward Leader ID: ${leader.leaderId}`}
                    />
                  </div>
                  <div className="leader-number-qr">
                    Ward Leader ID: {leader.v_id}
                  </div>
                </div>
              </div>
            </div>
          </div>
          {!isLastInGroup && <div className="template-divider"></div>}
        </div>
      );
    };

    return (
      <div ref={ref} className="hidden print:block">
        {/* Special print styles */}
        <style type="text/css" media="print">{`
          @page { 
            size: 8.5in 13in; 
            margin: 0mm; /* Remove browser margins to prevent headers/footers */
          }
          html, body { 
            margin: 0 !important; 
            padding: 0 !important; 
            font-family: Arial, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
            height: 100%;
          }
          /* Create our own margin within the page content */
          .print-page { 
            page-break-after: always; 
            height: 100%;
            width: 100%;
            padding: 0.5cm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .template-section {
            height: calc(33.33% - 0.6cm);
            margin-bottom: 0.3cm;
          }
          .template-divider {
            border-top: 1px dashed #000;
            margin: 0.3cm 0;
            width: 100%;
          }
          .print-layout {
            display: flex;
            width: 100%;
            gap: 1rem;
            height: 100%;
          }
          .print-left-column {
            flex: 2;
            padding-right: 1rem;
            border-right: 1px solid #000;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .print-right-column {
            flex: 1;
            padding-left: 0.5rem;
            display: flex;
            flex-direction: column;
          }
          .print-table-container {
            width: 100%;
          }
          .print-table-header {
            display: flex;
            font-weight: bold;
            font-size: 0.5rem;
            margin-bottom: 0.3rem;
            justify-content: space-around;
          }
          .header-column {
            flex: 1;
            text-align: center;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
          }
          .print-table td {
            border: 1px solid #000;
            padding: 0.25rem;
            height: 1.5rem;
            font-size: 0.5rem;
          }
          .print-label {
            width: 30%;
            font-weight: bold;
            text-align: right;
            padding-right: 0.5rem;
          }
          .print-value {
            width: 70%;
            font-weight: normal;
            text-align: left;
          }
          /* Styles for voting preference table */
          .print-voting-table-container {
            width: 100%;
          }
          .print-voting-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.5rem;
            table-layout: fixed;
          }
          .print-voting-table th:nth-child(1) {
            width: 40%;
          }
          .print-voting-table th:nth-child(2) {
            width: 20%;
          }
          .print-voting-table th:nth-child(3) {
            width: 35%;
          }
          .print-voting-header {
            border: 1px solid #000;
            background-color: #f0f0f0;
            padding: 0.25rem;
            text-align: center;
            font-weight: bold;
          }
          .print-voting-cell {
            border: 1px solid #000;
            padding: 0.25rem;
            height: 1.5rem;
            text-align: center;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: normal;
          }
          .print-signature-section {
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .print-signature-line {
            margin-bottom: 0.8rem;
          }
          .print-signature-underline {
            border-bottom: 1px solid #000;
            margin-bottom: 0.1rem;
          }
          .print-signature-label {
            font-size: 0.7rem;
            text-align: center;
            margin: 0;
          }
          .ward-leader-info {
            font-size: 0.9rem;
            font-weight: bold;
            margin-top: 0.7rem;
          }
          .position-legend {
            font-size: 0.6rem;
            text-align: center;
            margin-bottom: 0.2rem;
          }
          .print-qr-code {
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .qr-placeholder {
            width: 75px;
            height: 75px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 0.3rem;
          }
          .leader-number-qr {
            font-size: 0.75rem;
            font-weight: bold;
            text-align: center;
          }
          /* Only adding page break class for multiple sheets */
          .sheet-page-break {
            page-break-after: always;
            height: 0;
          }
        `}</style>
        
        {/* Render each group of 3 ward leaders on a separate sheet */}
        {leaderGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="print-page">
            {group.map((leader, index) => 
              renderWardLeaderTemplate(leader, index, index === group.length - 1)
            )}
            {groupIndex < leaderGroups.length - 1 && <div className="sheet-page-break"></div>}
          </div>
        ))}
      </div>
    );
  }
);

export default WardLeaderPrintTemplate; 