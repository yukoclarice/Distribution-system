import { forwardRef } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { PrintWardLeaderData } from "@/lib/api";

type BarangayCoordinatorPrintTemplateProps = {
  coordinators?: PrintWardLeaderData[];
  receivedBy?: {
    name: string;
    signature: string;
    position: string;
    timeSigned: string;
  };
};

// This component will be invisible in normal view but will be shown when printed
// We use forwardRef to forward the ref to the DOM node
export const BarangayCoordinatorPrintTemplate = forwardRef<HTMLDivElement, BarangayCoordinatorPrintTemplateProps>(
  ({ 
    coordinators = []
  }, ref) => {
    
    // If no coordinators provided, return empty template
    if (!coordinators || coordinators.length === 0) {
      return <div ref={ref} className="hidden print:block">No data to print</div>;
    }

    // Group coordinators into sets of 3 for printing (3 per sheet)
    const coordinatorGroups = [];
    for (let i = 0; i < coordinators.length; i += 3) {
      coordinatorGroups.push(coordinators.slice(i, i + 3));
    }

    // Function to generate QR code data
    const getQrCodeData = (coordinator: PrintWardLeaderData) => {
      return JSON.stringify({
        L_ID: coordinator.leaderId,
        L_Name: coordinator.name,
        V_ID: coordinator.v_id
      });
    };

    const renderCoordinatorTemplate = (coordinator: PrintWardLeaderData, index: number, isLastInGroup: boolean, globalIndex: number) => {
      return (
        <div key={`coordinator-${coordinator.leaderId}-${index}`} className="template-section">
          <div className="print-layout relative">
            {/* Item number indicator */}
            <div className="item-number-indicator">{globalIndex + 1}</div>
            
            {/* Left Column - Barangay Coordinator Information */}
            <div className="print-left-column">
              {/* Barangay Coordinator Number Header */}
              <h1 className="text-lg font-bold mb-3">Barangay Coordinator ID: #{coordinator.v_id}</h1>
              
              {/* Address Display */}
              <div className="text-right text-xs mb-2">
                {coordinator.municipality && coordinator.barangay && (
                  <div>
                    {coordinator.municipality}, {coordinator.barangay}
                  </div>
                )}
              </div>
              
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
                      <td className="print-voting-cell">{coordinator.votingPreference?.name || coordinator.name.toUpperCase()}</td>
                      <td className="print-voting-cell">{coordinator.votingPreference?.position || "BARANGAY COORDINATOR"}</td>
                      <td className="print-voting-cell">
                        {coordinator.votingPreference?.remarks || 
                         (coordinator.politicsData?.congressman === 660 && 
                          coordinator.politicsData?.governor === 662 && 
                          coordinator.politicsData?.vicegov === 676) ? "STRAIGHT" :
                         (coordinator.politicsData?.isUndecided ? "UNDECIDED(ALL 3)" : 
                          coordinator.politicsData?.supportedCandidates || "NO PREFERENCE")}
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
                      value={getQrCodeData(coordinator)}
                      size={60}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"H"}
                      marginSize={3}
                      title={`QR Code for Barangay Coordinator ID: ${coordinator.leaderId}`}
                    />
                  </div>
                  <div className="leader-number-qr">
                    Barangay Coordinator ID: {coordinator.v_id}
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
            width: 30%;
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
          /* Item number indicator styling */
          .item-number-indicator {
            position: absolute;
            top: 0cm;
            right: 0.2cm;
            font-size: 0.2rem;
            font-weight: normal;
            color: #000;
            z-index: 100;
            background-color: white;
            padding: 0 1px;
          }
          .relative {
            position: relative;
          }
        `}</style>
        
        {/* Print pages - one for each group of 3 coordinators */}
        {coordinatorGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="print-page">

            {group.map((coordinator, index) => 
              renderCoordinatorTemplate(
                coordinator, 
                index, 
                index === group.length - 1,
                groupIndex * 3 + index
              )
            )}
          </div>
        ))}
      </div>
    );
  }
);

BarangayCoordinatorPrintTemplate.displayName = "BarangayCoordinatorPrintTemplate";

export default BarangayCoordinatorPrintTemplate; 