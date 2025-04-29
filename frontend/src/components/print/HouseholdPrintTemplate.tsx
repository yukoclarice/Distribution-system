import { forwardRef } from "react";
import { QRCodeSVG } from 'qrcode.react';

type PrintHouseholdData = {
  householdId: number;
  householdNumber: string;
  wardLeader: string;
  members: Array<{
    name: string;
    position: string;
    remarks: string;
    municipality?: string;
    barangay?: string;
    street_address?: string;
  }>;
  receivedBy: {
    name: string;
    signature: string;
    position: string;
    timeSigned: string;
  };
};

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
    const householdGroups: PrintHouseholdData[][] = [];
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

    const renderHouseholdTemplate = (household: PrintHouseholdData, index: number, isLastInGroup: boolean, globalIndex: number) => {
      // Check for different member count thresholds
      const hasExtraLargeMembers = household.members.length > 12;
      const hasLargeMembers = household.members.length > 9;
      const headMember = household.members.find(member => member.position === 'HH Head');

      return (
        <div key={`household-${household.householdId}-${index}`} className="template-section">
          <div className="print-layout relative">
            {/* Item number indicator */}
            <div className="item-number-indicator">{globalIndex + 1}</div>
            
            {/* Left Column - Household Information */}
            <div className="print-left-column">
              {/* Household Number Header */}
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-bold">Household No.:</span> {household.householdNumber}
                </div>
                <div className="text-right text-xs">
                  {headMember?.municipality && headMember?.barangay && headMember?.street_address && (
                    <div>
                      {headMember.municipality}, {headMember.barangay}, Purok {headMember.street_address}
                    </div>
                  )}
                </div>
              </div>
              
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
              <h1 className={`text-lg font-bold mb-5 received-by-header`}>Received by:</h1>
              
              <div className={`print-signature-section mt-4`}>
                <div className="print-signature-line">
                  <div className="print-signature-underline"></div>
                  <p className="print-signature-label">Name</p>
                </div>
                
                <div className="print-signature-line mt-4">
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
                
                <div className="print-signature-line mt-4">
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
            //padding: 0;
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
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            /* 11 inches = 27.94cm, minus 1cm for padding (0.5cm top + 0.5cm bottom) */
            min-height: 28cm;
            max-height: 28cm;
            overflow: hidden;
          }
          .template-section {
            height: calc(33.6%);
            // margin-bottom: 0.3cm;
            /* Set a fixed height to ensure consistency */
            min-height: 9cm;
            max-height: 9cm;
            overflow: visible; /* Changed from hidden to visible to show dividers */
          }
          .template-divider {
            border-top: 1px dashed #000;
            // margin: 0.3cm 0;
            width: 100%;
            display: block; /* Ensure it's displayed as a block */
            position: relative; /* Add positioning context */
            z-index: 10; /* Ensure it appears above other content */
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
            padding-top: 0;
            margin-top: 0;
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
            height: 1rem; /* Set fixed height for all header modes */
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
            font-size: 0.6rem;
            margin-bottom: 0.2rem;
            height: 1rem; /* Maintain the same height */
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
            height: 1rem; /* Maintain the same height */
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
          .extra-compact-signature .position-legend {
            font-size: 0.5rem;
            margin-bottom: 0.1rem;
          }
          .extra-compact-signature .print-qr-code {
            margin-top: 0.2rem;
          }
          
          .ward-leader-info {
            font-size: 0.5rem;
            font-weight: bold;
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
          /* Item number indicator styling */
          .item-number-indicator {
            position: absolute;
            top: 0cm;
            right: 0.2cm;
            font-size: 0.5rem;
            font-weight: bold;
            color: #000;
            z-index: 100;
            background-color: white;
            padding: 0 1px;
          }
          .relative {
            position: relative;
          }
          /* Add new style for the Received by header */
          .received-by-header {
            margin-top: 0;
            padding-top: 0;
            line-height: 1;
          }
        `}</style>
        
        {/* Render each group of 3 households on a separate sheet */}
        {householdGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="print-page">

            {group.map((household, index) => 
              renderHouseholdTemplate(
                household, 
                index, 
                index === group.length - 1, 
                groupIndex * 3 + index
              )
            )}
            {groupIndex < householdGroups.length - 1 && <div className="sheet-page-break"></div>}
          </div>
        ))}
      </div>
    );
  }
);

HouseholdPrintTemplate.displayName = "HouseholdPrintTemplate";

export default HouseholdPrintTemplate; 