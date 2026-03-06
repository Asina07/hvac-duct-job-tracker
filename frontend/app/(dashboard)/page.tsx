"use client";

import { useEffect, useState } from "react";
import { getDashboard } from "../lib/api";
import SummaryCard from "../components/SummaryCard";
import StatusBadge from "../components/StatusBadge";
import LoadingSpinner from "../components/LoadingSpinner";
import LayoutComp from "../components/LayoutComp";
import { DashboardData } from "../dataTypes/dashboardData.types";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await getDashboard();
        setData(result);
      } catch (err) {
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return null;

  // console.log("Dashboard data:", data);
  const pendingDelivery =
    Number(data.overall.total_sqm) - Number(data.overall.total_delivered_sqm);

  // Group breakdown by material name
  const groupedByMaterial = data.material_status_breakdown.reduce(
    (acc: any, item) => {
      if (!acc[item.material]) {
        acc[item.material] = [];
      }
      acc[item.material].push(item);
      return acc;
    },
    {},
  );
  return (
    <LayoutComp mainHeader={"Dashboard"}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          ↻ Refresh
        </button>
      </div>
      <div className="space-y-6">
        {/* Row 1 - Overall Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* use SummaryCard component here */}
          {/* data.overall.total_jobs */}
          <SummaryCard
            title="Total Jobs"
            value={data?.overall?.total_jobs}
            color="blue"
          />
          {/* data.overall.total_sqm */}
          <SummaryCard
            title="Total SQM"
            value={Number(data?.overall?.total_sqm).toLocaleString()}
            color="orange"
          />
          {/* data.overall.total_delivered_sqm */}
          <SummaryCard
            title="Total Delivery SQM"
            value={Number(data?.overall?.total_delivered_sqm).toLocaleString()}
            color="green"
          />
          {/* pending = total_sqm - total_delivered_sqm */}
          <SummaryCard
            title="Pending Delivery"
            value={pendingDelivery.toLocaleString()}
            color="red"
          />
        </div>

        {/* Row 2 - Status Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-4">
          {/* map through data.by_status */}
          {data.by_status.map((item) => (
            <SummaryCard
              key={item.status}
              title={item.status}
              value={item.total_jobs}
              subtitle={`${Number(item.total_sqm).toLocaleString()} SQM`}
              color={item.color}
            />
          ))}
        </div>
        {/* Material Status Breakdown */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            Status Breakdown by Material
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(groupedByMaterial).map(
              ([material, statuses]: any) => (
                <div key={material} className="border rounded-lg p-4">
                  {/* Material name header */}
                  <h3 className="font-semibold text-gray-800 mb-3 pb-2 border-b">
                    {material}
                  </h3>
                  {/* Status rows */}
                  {statuses.map((item: any) => (
                    <div
                      key={item.status}
                      className="flex justify-between items-center py-1"
                    >
                      <StatusBadge status={item.status} color={item.color} />
                      <div className="text-right">
                        <span className="text-sm font-medium text-gray-800">
                          {item.total_jobs} jobs
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {Number(item.total_sqm).toLocaleString()} SQM
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ),
            )}
          </div>
        </div>
        {/* Row 3 - Delivery Summary Table */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            Delivery Summary by Material
          </h2>

          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Material</th>
                <th className="text-right py-2">Total SQM</th>
                <th className="text-right py-2">Delivered</th>
                <th className="text-right py-2">Pending</th>
              </tr>
            </thead>
            <tbody>
              {data.delivery_summary.map((item) => (
                <tr key={item.material} className="border-b hover:bg-gray-50">
                  <td className="py-2">{item.material}</td>
                  <td className="text-right py-2">
                    {Number(item.total_sqm).toLocaleString()}
                  </td>
                  <td className="text-right py-2 text-green-600">
                    {Number(item.delivered_sqm).toLocaleString()}
                  </td>
                  <td className="text-right py-2 text-orange-600">
                    {Number(item.pending_sqm).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Row 4 - Tag List Waiting */}
        {/* show job_number, project_name, material_name, total_sqm, date_received */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">
            Tag List Waiting for Approval
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Job Number</th>
                <th className="text-right py-2">Project Name</th>
                <th className="text-right py-2">Material Name</th>
                <th className="text-right py-2">Total Sqm</th>
                <th className="text-right py-2">Date Received</th>
              </tr>
            </thead>
            <tbody>
              {data.tag_list_waiting.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="py-2">{item.job_number}</td>
                  <td className="text-right py-2">{item?.project_name}</td>
                  <td className="text-right py-2 text-green-600">
                    {item?.material_name}
                  </td>
                  <td className="text-right py-2 text-orange-600">
                    {Number(item.total_sqm).toLocaleString()}
                  </td>
                  <td className="text-right py-2 text-orange-600">
                    {new Date(item.date_received).toLocaleDateString("en-GB")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </LayoutComp>
  );
}
