import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Printer, Loader2, TrendingUp, Home } from "lucide-react";
import { WardLeadersReport } from "../reports/WardLeadersReport";
import { HouseholdsReport } from "../reports/HouseholdsReport";
import { PrintStatsByBarangayChart } from "../reports/PrintStatsByBarangayChart";
import { useAuth } from "@/lib/AuthContext";
import { Navigate } from "react-router-dom";
import { getPrintStatistics, PrintStatistics } from "@/lib/api";
import { Cell, Label, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

// Define colors for the chart
const CHART_COLORS = {
  printed: "hsl(142.1 76.2% 36.3%)", // Green (same as --chart-1)
  not_printed: "hsl(346.8 77.2% 49.8%)", // Red (same as --chart-2)
};

// Custom print statistics pie chart component using Shadcn UI
interface PrintPieChartProps {
  data: {
    printed: number;
    not_printed: number;
  };
  title: string;
  loading?: boolean;
}

const PrintPieChart = ({ data, title, loading = false }: PrintPieChartProps) => {
  // Extract values with fallbacks to prevent errors
  const printedValue = Number(data?.printed ?? 0);
  const notPrintedValue = Number(data?.not_printed ?? 0);
  
  // Format data for Recharts
  const chartData = [
    { name: "printed", value: printedValue },
    { name: "not_printed", value: notPrintedValue },
  ];

  // Debug data
  console.log("Print Chart Data:", { title, data, printedValue, notPrintedValue, chartData });
  console.log(data.not_printed);
  
  // Calculate total and percentage for footer
  const total = printedValue + notPrintedValue;
  const printedPercentage = total > 0 ? Math.round((printedValue / total) * 100) : 0;
  
  if (loading) {
    return (
      <Card className="flex flex-col">
        <CardHeader className="items-center pb-0">
          <CardTitle>{title}</CardTitle>
          <CardDescription>Print Status</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="flex flex-col">
      <CardHeader className="items-center pb-0">
        <CardTitle>{title}</CardTitle>
        <CardDescription>Print Status Overview</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0 flex justify-center">
        <div className="w-100 h-64">
        <ResponsiveContainer width="100%" height="100%">
  <PieChart>
    <Tooltip
      formatter={(value, name) => [
        `${value} items`, 
        name === 'printed' ? 'Printed' : 'Not Printed'
      ]}
    />
    <Pie
      data={chartData}
      dataKey="value"
      nameKey="name"
      cx="50%"
      cy="50%"
      innerRadius={0}
      outerRadius={80}
      label={(entry) => entry.name === 'printed' ? 'Printed' : 'Not Printed'}
    >
      {chartData.map((entry, index) => (
        <Cell 
          key={`cell-${index}`} 
          fill={entry.name === 'printed' ? CHART_COLORS.printed : CHART_COLORS.not_printed}
        />
      ))}
      <Label
        value={total.toString()}
        position="center"
        style={{ fontSize: '24px', fontWeight: 'bold', fill: 'currentColor' }}
      />
    </Pie>
  </PieChart>
</ResponsiveContainer>

        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 font-medium leading-none">
          {printedPercentage}% printed <TrendingUp className="h-4 w-4" />
        </div>
        <div className="leading-none text-muted-foreground">
          Total: {total} items ({data.printed} printed, {data.not_printed} not printed)
        </div>
      </CardFooter>
    </Card>
  );
};

export function ReportingPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("ward-leaders");
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState<PrintStatistics | null>(null);

  // Fetch print statistics when component mounts
  useEffect(() => {
    const fetchPrintStatistics = async () => {
      setLoading(true);
      try {
        const data = await getPrintStatistics();
        setStatistics(data);
      } catch (error) {
        console.error('Error fetching print statistics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrintStatistics();
  }, []);
  
  // Ward Leaders statistics fetching removed as it's no longer needed for the Households tab

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: { pathname: "/reports" } }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col">
        <h1 className="text-2xl font-semibold tracking-tight">Reports</h1>
        <p className="text-muted-foreground mt-1">Access and generate voter analytics reports</p>
      </div>

      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <div className="flex justify-between items-center mb-4">
          <TabsList className="grid grid-cols-3 w-[400px] rounded-xl">
            <TabsTrigger value="ward-leaders" className="rounded-lg data-[state=active]:shadow-sm">
              <Users className="h-4 w-4 mr-2" />
              Ward Leaders
            </TabsTrigger>
            <TabsTrigger value="print-reporting" className="rounded-lg data-[state=active]:shadow-sm">
              <Printer className="h-4 w-4 mr-2" />
              Print Reporting
            </TabsTrigger>
            <TabsTrigger value="households" className="rounded-lg data-[state=active]:shadow-sm">
              <Home className="h-4 w-4 mr-2" />
              Households
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ward-leaders" className="space-y-6">
          <WardLeadersReport />
        </TabsContent>

        <TabsContent value="print-reporting" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">

            {/* Households Pie Chart */}
            <PrintPieChart 
              data={{
                printed: statistics?.households?.printed || 0,
                not_printed: statistics?.households?.not_printed || 0
              }}
              title="Households"
              loading={loading}
            />

            {/* Ward Leaders Pie Chart */}
            <PrintPieChart 
              data={{
                printed: statistics?.wardLeaders?.printed || 0,
                not_printed: statistics?.wardLeaders?.not_printed || 0
              }}
              title="Ward Leaders"
              loading={loading}
            />

            {/* Coordinators Pie Chart */}
            <PrintPieChart 
              data={{
                printed: statistics?.coordinators?.printed || 0,
                not_printed: statistics?.coordinators?.not_printed || 0
              }}
              title="Coordinators"
              loading={loading}
            />
            
            {/* Barangay Print Statistics Bar Chart */}
            <div className="lg:col-span-3 mt-4">
              <PrintStatsByBarangayChart />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="households" className="space-y-6">
          <HouseholdsReport />
        </TabsContent>
      </Tabs>
    </div>
  );
} 