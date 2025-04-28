import { forwardRef } from "react";
import { QRCodeSVG } from 'qrcode.react';
import { PrintHouseholdData } from "@/lib/api";

type HouseholdPrintTemplateProps = {
  households?: PrintHouseholdData[];
  receivedBy?: {
    name: string;
    signature: string;
    position: string;
    timeSigned: string;
  };
};

// This component will be invisible in normal view but will be shown when printed
// We use forwardRef to forward the ref to the DOM node
export const HouseholdPrintTemplate = forwardRef<HTMLDivElement, HouseholdPrintTemplateProps>(
  ({ 
    households = []
  }, ref) => {
    
    // If no households provided, return empty template
    if (!households || households.length === 0) {
      return <div ref={ref} className="hidden print:block">No data to print</div>;
    }

    // Group households into sets of 3 for printing (3 per sheet)
    const householdGroups = [];
    for (let i = 0; i < households.length; i += 3) {
      householdGroups.push(households.slice(i, i + 3));
    }

    // Function to generate QR code data
    const getQrCodeData = (household: PrintHouseholdData) => {
      // Find the household head from members array
      const headMember = household.members.find(member => member.position === 'HH Head');
      const headName = headMember ? headMember.name : 'Unknown';
      
      
      return JSON.stringify({
        H_H_ID: household.householdId,
        HH_Name: headName
      });
    };

    const renderHouseholdTemplate = (household: PrintHouseholdData, index: number, isLastInGroup: boolean) => {
      // Check for different member count thresholds
      const hasLargeMembers = household.members.length > 9 && household.members.length <= 12;
      const hasExtraLargeMembers = household.members.length > 12;
      
      return (
        <div key={`household-${household.householdId}-${index}`} className="template-section">
          <div className="print-layout">
            {/* Left Column - Household Information */}
            <div className="print-left-column">
              {/* Household Number Header */}
              <h1 className={`text-lg font-bold ${hasExtraLargeMembers ? 'mb-1' : 'mb-3'}`}>Household #{household.householdNumber}</h1>
              
              {/* Table with fixed columns */}
              <div className="print-table-container">
                {/* Table Header */}
                <div className={`print-table-header ${hasLargeMembers ? 'compact-header' : ''} ${hasExtraLargeMembers ? 'extra-compact-header' : ''}`}>
                  <div className="name-column">NAME</div>
                  <div className="position-column">POSITION</div>
                  <div className="remarks-column">REMARKS</div>
                </div>
                
                {/* Household members table */}
                <table className={`print-table ${hasLargeMembers ? 'compact-table' : ''} ${hasExtraLargeMembers ? 'extra-compact-table' : ''}`}>
                  <tbody>
                    {household.members.length > 0 ? (
                      household.members.map((member, idx) => (
                        <tr key={`member-${idx}`}>
                          <td className="print-row-number">{idx + 1}</td>
                          <td className="print-name-cell">{member.name}</td>
                          <td className="print-position-cell">{member.position}</td>
                          <td className="print-remarks-cell">{member.remarks}</td>
                        </tr>
                      ))
                    ) : (
                      // If no members, show empty rows - reduced to 5 for space
                      Array.from({ length: 5 }).map((_, idx) => (
                        <tr key={`empty-${idx}`}>
                          <td className="print-row-number">{idx + 1}</td>
                          <td className="print-name-cell"></td>
                          <td className="print-position-cell"></td>
                          <td className="print-remarks-cell"></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Ward Leader Information at bottom */}
              <div className="ward-leader-info">
                Ward Leader: {household.wardLeader}
              </div>
            </div>
            
            {/* Right Column - Received By Section */}
            <div className="print-right-column">
              <h1 className={`text-lg font-bold ${hasExtraLargeMembers ? 'mb-1' : 'mb-3'}`}>Received by:</h1>
              
              <div className={`print-signature-section ${hasExtraLargeMembers ? 'mt-2 extra-compact-signature' : 'mt-4'}`}>
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
                    HH Head | HH Member | WL | BC | AC/DC | MC
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
                      value={getQrCodeData(household)}
                      size={hasExtraLargeMembers ? 50 : 60}
                      bgColor={"#ffffff"}
                      fgColor={"#000000"}
                      level={"H"}
                      marginSize={hasExtraLargeMembers ? 2 : 3}
                      title={`QR Code for Household ID: ${household.householdId}`}
                    />
                  </div>
                  <div className="household-number-qr">
                    Household ID: {household.householdId}
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
        {/* Special print styles - KEEPING ORIGINAL STYLING EXACTLY THE SAME */}
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
          .name-column {
            flex: 0 0 40%;
            text-align: center;
          }
          .position-column {
            flex: 0 0 20%;
            text-align: center;
          }
          .remarks-column {
            flex: 0 0 40%;
            text-align: center;
          }
          .print-table {
            width: 100%;
            border-collapse: collapse;
          }
          .print-table td {
            border: 1px solid #000;
            padding: 0.2rem;
            height: 1.5rem;
            font-size: 0.5rem;
          }
          .print-row-number {
            width: 1.5rem;
            text-align: center;
            font-weight: bold;
          }
          .print-name-cell {
            width: 40%;
            font-weight: bold;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: normal;
          }
          .print-position-cell {
            width: 20%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: normal;
          }
          .print-remarks-cell {
            width: 40%;
            font-weight: bold;
            font-size: 0.45rem;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: normal;
          }
          
          /* Compact styles for tables with more than 9 members */
          .compact-header {
            font-size: 0.4rem;
            margin-bottom: 0.2rem;
          }
          .compact-table td {
            padding: 0.1rem;
            height: 1.2rem;
            font-size: 0.4rem;
          }
          .compact-table .print-remarks-cell {
            font-size: 0.35rem;
          }
          
          /* Extra compact styles for tables with more than 12 members */
          .extra-compact-header {
            font-size: 0.35rem;
            margin-bottom: 0.1rem;
          }
          .extra-compact-table td {
            padding: 0.05rem;
            height: 0.9rem;
            font-size: 0.35rem;
          }
          .extra-compact-table .print-row-number {
            width: 1.2rem;
          }
          .extra-compact-table .print-remarks-cell {
            font-size: 0.3rem;
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
          
          /* Extra compact signature styles */
          .extra-compact-signature .print-signature-line {
            margin-bottom: 0.5rem;
          }
          .extra-compact-signature .print-signature-label {
            font-size: 0.6rem;
          }
          .extra-compact-signature .position-legend {
            font-size: 0.5rem;
            margin-bottom: 0.1rem;
          }
          .extra-compact-signature .print-qr-code {
            margin-top: 0.2rem;
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
          .household-number-qr {
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
        
        {/* Render each group of 3 households on a separate sheet */}
        {householdGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="print-page">
            {group.map((household, index) => 
              renderHouseholdTemplate(household, index, index === group.length - 1)
            )}
            {groupIndex < householdGroups.length - 1 && <div className="sheet-page-break"></div>}
          </div>
        ))}
      </div>
    );
  }
);

export default HouseholdPrintTemplate; 