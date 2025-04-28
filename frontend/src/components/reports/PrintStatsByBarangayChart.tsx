import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { BarangayPrintStatistics, getPrintStatisticsByBarangay } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Define status colors for percentage bars
const STATUS_COLORS = {
  high: "bg-green-500", // Green for high percentages (>70%)
  medium: "bg-amber-500", // Amber/Yellow for medium percentages (40-70%)
  low: "bg-red-500" // Red for low percentages (<40%)
};

// Helper function to determine status based on percentage
const getStatusColor = (percentage: number) => {
  if (percentage >= 70) return STATUS_COLORS.high;
  if (percentage >= 40) return STATUS_COLORS.medium;
  return STATUS_COLORS.low;
};

// Helper function to determine status label
const getStatusLabel = (percentage: number) => {
  if (percentage >= 70) return "High";
  if (percentage >= 40) return "Medium";
  return "Low";
};

// Component for the percentage bar
const PercentageBar = ({ percentage }: { percentage: number }) => {
  const statusColor = getStatusColor(percentage);
  return (
    <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 overflow-hidden">
      <div 
        className={`${statusColor} h-2.5 rounded-full`} 
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

interface PrintStatsByBarangayChartProps {
  title?: string;
  description?: string;
}

export function PrintStatsByBarangayChart({ 
  title = "Print Status by Barangay", 
  description = "Percentage of printed records by barangay for each print type"
}: PrintStatsByBarangayChartProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<BarangayPrintStatistics[]>([]);
  const [municipality, setMunicipality] = useState<string>("all");
  const [municipalities, setMunicipalities] = useState<{municipality: string}[]>([]);
  const [activeTab, setActiveTab] = useState<string>("households");

  // Fetch municipalities for the filter
  useEffect(() => {
    const fetchMunicipalities = async () => {
      try {
        // Reuse the existing API endpoint that returns municipalities
        const response = await fetch('/api/reports/ward-leaders?page=1&limit=1');
        const data = await response.json();
        if (data.filterOptions && data.filterOptions.municipalities) {
          setMunicipalities(data.filterOptions.municipalities);
        }
      } catch (error) {
        console.error('Error fetching municipalities:', error);
      }
    };

    fetchMunicipalities();
  }, []);

  // Fetch print statistics by barangay
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const filters = municipality !== 'all' ? { municipality } : {};
        const stats = await getPrintStatisticsByBarangay(filters);
        setData(stats);
      } catch (error: any) {
        console.error('Error fetching print statistics by barangay:', error);
        setError(error.message || 'Failed to fetch print statistics');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [municipality]);

  // Render loading state
  if (loading) {
    return (
      <Card className="rounded-2xl shadow-sm border-border/40">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card className="rounded-2xl shadow-sm border-border/40">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-red-500">
          <p>{error}</p>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (data.length === 0) {
    return (
      <Card className="rounded-2xl shadow-sm border-border/40">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
          <p>No data available</p>
        </CardContent>
      </Card>
    );
  }

  // Status legend
  const statusLegend = [
    { label: "High (>70%)", color: STATUS_COLORS.high },
    { label: "Medium (40-70%)", color: STATUS_COLORS.medium },
    { label: "Low (<40%)", color: STATUS_COLORS.low }
  ];
  
  // Table component for Households
  const HouseholdsTable = () => (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">Barangay</th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3">Total Households</th>
            <th scope="col" className="px-6 py-3">Printed Households</th>
            <th scope="col" className="px-6 py-3">Not Printed</th>
            <th scope="col" className="px-6 py-3 w-64">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const statusLabel = getStatusLabel(item.households.percentage);
            
            return (
              <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {item.barangay}
                </th>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusLabel === 'High' ? 'bg-green-100 text-green-800' : 
                    statusLabel === 'Medium' ? 'bg-amber-100 text-amber-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {statusLabel}
                  </span>
                </td>
                <td className="px-6 py-4">{item.households.total}</td>
                <td className="px-6 py-4">{item.households.printed}</td>
                <td className="px-6 py-4">{item.households.not_printed}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <PercentageBar percentage={item.households.percentage} />
                    <span className="text-xs font-medium">{item.households.percentage.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Table component for Ward Leaders
  const WardLeadersTable = () => (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">Barangay</th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3">Total Ward Leaders</th>
            <th scope="col" className="px-6 py-3">Printed</th>
            <th scope="col" className="px-6 py-3">Not Printed</th>
            <th scope="col" className="px-6 py-3 w-64">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const statusLabel = getStatusLabel(item.wardLeaders.percentage);
            
            return (
              <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {item.barangay}
                </th>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusLabel === 'High' ? 'bg-green-100 text-green-800' : 
                    statusLabel === 'Medium' ? 'bg-amber-100 text-amber-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {statusLabel}
                  </span>
                </td>
                <td className="px-6 py-4">{item.wardLeaders.total}</td>
                <td className="px-6 py-4">{item.wardLeaders.printed}</td>
                <td className="px-6 py-4">{item.wardLeaders.not_printed}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <PercentageBar percentage={item.wardLeaders.percentage} />
                    <span className="text-xs font-medium">{item.wardLeaders.percentage.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Table component for Barangay Coordinators
  const CoordinatorsTable = () => (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">Barangay</th>
            <th scope="col" className="px-6 py-3">Status</th>
            <th scope="col" className="px-6 py-3">Total Coordinators</th>
            <th scope="col" className="px-6 py-3">Printed</th>
            <th scope="col" className="px-6 py-3">Not Printed</th>
            <th scope="col" className="px-6 py-3 w-64">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const statusLabel = getStatusLabel(item.coordinators.percentage);
            
            return (
              <tr key={index} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                  {item.barangay}
                </th>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    statusLabel === 'High' ? 'bg-green-100 text-green-800' : 
                    statusLabel === 'Medium' ? 'bg-amber-100 text-amber-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {statusLabel}
                  </span>
                </td>
                <td className="px-6 py-4">{item.coordinators.total}</td>
                <td className="px-6 py-4">{item.coordinators.printed}</td>
                <td className="px-6 py-4">{item.coordinators.not_printed}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <PercentageBar percentage={item.coordinators.percentage} />
                    <span className="text-xs font-medium">{item.coordinators.percentage.toFixed(1)}%</span>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <Card className="rounded-2xl shadow-sm border-border/40">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center gap-4">
              {statusLegend.map((status, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-sm ${status.color}`}></div>
                  <span className="text-xs text-muted-foreground">{status.label}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Label htmlFor="municipality" className="whitespace-nowrap">Municipality:</Label>
              <Select
                value={municipality}
                onValueChange={setMunicipality}
              >
                <SelectTrigger id="municipality" className="w-[180px]">
                  <SelectValue placeholder="Select Municipality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Municipalities</SelectItem>
                  {municipalities.map((m) => (
                    <SelectItem key={m.municipality} value={m.municipality}>
                      {m.municipality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="households">Households</TabsTrigger>
            <TabsTrigger value="wardLeaders">Ward Leaders</TabsTrigger>
            <TabsTrigger value="coordinators">Barangay Coordinators</TabsTrigger>
          </TabsList>
          <TabsContent value="households" className="mt-4">
            <HouseholdsTable />
          </TabsContent>
          <TabsContent value="wardLeaders" className="mt-4">
            <WardLeadersTable />
          </TabsContent>
          <TabsContent value="coordinators" className="mt-4">
            <CoordinatorsTable />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
