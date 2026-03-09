"use client";

import BackButton from "@/app/components/BackButton";
import LayoutComp from "@/app/components/LayoutComp";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import Pagination from "@/app/components/Pagination";
import StatusBadge from "@/app/components/StatusBadge";
import JobTable from "@/app/components/tables/JobTable";
import { JobData_Type } from "@/app/dataTypes/jobData.types";
import {
  deleteJob,
  getJobs,
  getMaterials,
  getStatuses,
  updateJobStatus,
} from "@/app/lib/api";
import { useAuthStore } from "@/app/store/authStore";
import { Download, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
interface Status {
  id: number;
  name: string;
  color: string;
}
interface Material {
  id: number;
  name: string;
}
const JobPage = () => {
  const [data, setData] = useState<JobData_Type | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState("");
  const [searchstatus, setSearchStatus] = useState("");
  const [searchMaterial, setSearchMterial] = useState("");
  const [searchDates, setSearchDates] = useState("");
  const [page, setPage] = useState(1);

  //update total sqm and original sqm
  const [updatingJobId, setUpdatingJobId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [deliveredSqm, setDeliveredSqm] = useState("");

  const [pagination, setPagination] = useState({
    total_pages: 1,
    total_jobs: 0,
    current_page: 1,
  });

  const router = useRouter();

  // useEffect(() => {
  //   const fetchJobData = async () => {
  //     try {
  //       const result = await getJobs(`page=${page}&limit=10`);
  //       setData(result);
  //       setPagination(result.pagination);
  //     } catch (err) {
  //       setError("Failed to Load Job Data");
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchJobData();
  // }, [page]);

  // ✅ defined outside - now accessible everywhere in component
  const fetchJobData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("page", page.toString());
      params.append("limit", "10");
      if (search) params.append("search", search);
      if (searchstatus) params.append("status_id", searchstatus);
      if (searchMaterial) params.append("material_id", searchMaterial);

      const result = await getJobs(params.toString());
      setData(result);
      setPagination(result.pagination);
    } catch (err) {
      setError("Failed to Load Job Data");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (jobId: number) => {
    if (!selectedStatus) {
      alert("Please select a status");
      return;
    }

    const body: any = {
      status_id: parseInt(selectedStatus),
    };

    const selectedStatusObj = statuses.find(
      (s: Status) => s.id === parseInt(selectedStatus),
    );

    if (selectedStatusObj?.name === "PARTIALLY DELIVERED") {
      if (!deliveredSqm) {
        alert("Please enter delivered amount");
        return;
      }
      body.delivered_sqm = parseFloat(deliveredSqm);
    }

    try {
      // 4. call API
      await updateJobStatus(jobId, body);

      // 5. refresh jobs list
      fetchJobData();

      // 6. reset all states
      setUpdatingJobId(null);
      setSelectedStatus("");
      setDeliveredSqm("");
    } catch (err) {
      alert("Failed to update status");
    }
  };

  // Then useEffect just calls it
  useEffect(() => {
    fetchJobData();
  }, [page]);

  useEffect(() => {
    const loadFilters = async () => {
      try {
        const [statusData, materialData] = await Promise.all([
          getStatuses(),
          getMaterials(),
        ]);
        setStatuses(statusData);
        setMaterials(materialData);
      } catch (err) {
        console.error("Failed to load filters");
      }
    };
    loadFilters();
  }, []);

  // if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return null;

  const handleDelete = async (jobId: number) => {
    try {
      if (confirm("Are you sure you want to delete this job?")) {
        // wait for delete to finish before refreshing
        await deleteJob(jobId);
        // 3. refresh only after successful delete
        fetchJobData();
      }
    } catch (err) {
      console.log("Failed to delete job!", err);
    }
  };

  const handleExport = async () => {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
      // Convert response to blob (binary file)
      const blob = await response.blob();
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "jobs_export.xlsx";
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Failed to export jobs");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/jobs/import`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        },
      );
      const result = await response.json();
      alert(result.message);
      fetchJobData(); // refresh jobs list
    } catch (err) {
      alert("Failed to import jobs");
    }

    // Reset file input
    e.target.value = "";
  };
  return (
    <LayoutComp mainHeader={"All Jobs"}>
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* <h2 className="text-lg font-semibold mb-4">
          Delivery Summary by Material
        </h2> */}
        {/* BackButton */}

        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">List All Jobs</h1>
          <div className="text-sm text-blue-600 hover:text-blue-800">
            <BackButton />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Search by job number */}
            <input
              type="text"
              placeholder="Search job number or project..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Status dropdown */}
            <select
              value={searchstatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              {statuses.map((s: any) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            {/* Material dropdown */}
            <select
              value={searchMaterial}
              onChange={(e) => setSearchMterial(e.target.value)}
              className="border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Materials</option>
              {materials.map((m: any) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-between gap-3">
            {/* Search and Reset buttons */}
            <div className="flex gap-2 mt-3 flex-col md:flex-row ">
              <button
                onClick={() => {
                  setPage(1);
                  fetchJobData();
                }}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Search
              </button>
              <button
                onClick={() => {
                  setSearch("");
                  setSearchStatus("");
                  setSearchMterial("");
                  setPage(1);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
              >
                Reset
              </button>
            </div>

            <div className="flex md:gap-2 items-center justify-center flex flex-col md:flex-row ">
              <button
                onClick={handleExport}
                className="flex items-center mt-3 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
              >
                <Download size={16} className="mr-2" /> Export Excel
              </button>
              {/* Hidden file input */}
              <div className="md:mt-3 mt-2">
              <input
                type="file"
                id="importFile"
                accept=".xlsx"
                onChange={handleImport}
                className="hidden"
              />
              {/* Import button triggers file input */}
              <label
                htmlFor="importFile"
                className="flex items-center px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 cursor-pointer"
              >
                <Upload size={16} className="mr-2" /> Import Excel
              </label></div>
              <button
                onClick={() => router.push("/jobs/new")}
                className="px-4 mt-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
              >
                Create New Job
              </button>
            </div>
          </div>
        </div>
        {/* <JobTable data={data} /> */}
        <div className="w-full overflow-x-auto ">
          {loading ? (
            <div>
              <LoadingSpinner />
            </div>
          ) : (
            <table className="min-w-[1100px] w-full text-sm">
              <thead className="bg-gray-100 sticky top-0 z-10">
                <tr className="border-b">
                  <th className="text-center py-2 px-3 whitespace-nowrap">
                    Action
                  </th>
                  <th className="text-right py-2 px-3 whitespace-nowrap">
                    Job_No
                  </th>
                  <th className="text-left py-2 px-3 whitespace-nowrap">
                    Material
                  </th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">
                    Item
                  </th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">
                    Project
                  </th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">
                    Level
                  </th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">
                    Unit
                  </th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">
                    Status
                  </th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">
                    Total_SQM
                  </th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">
                    Current_SQM
                  </th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">
                    Total_Delivered_SQM
                  </th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">
                    Date_Received
                  </th>
                  <th className="text-center py-2 px-3 whitespace-nowrap">
                    Date_to_Production
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.jobs?.length > 0 ? (
                  data.jobs.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b hover:bg-blue-50 transition"
                    >
                      <td className="py-2 px-3">
                        <div className="flex gap-2">
                          <Link
                            href={`/jobs/${item.id}/edit`}
                            className="text-orange-600 hover:text-orange-800 text-xs font-medium"
                          >
                            Edit
                          </Link>

                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-red-600 hover:text-red-800 text-xs font-medium"
                          >
                            Delete
                          </button>
                        </div>
                      </td>

                      <td className="py-3 px-3 whitespace-nowrap">
                        {item.job_number}
                      </td>

                      <td className="py-4 px-3 whitespace-nowrap">
                        {item.material_name}
                      </td>

                      <td className="text-center py-2 px-3 whitespace-nowrap">
                        {item.item}
                      </td>

                      <td className="text-center py-2 px-3 whitespace-nowrap">
                        {item.project_name}
                      </td>

                      <td className="text-center py-2 px-3 whitespace-nowrap">
                        {item.level}
                      </td>

                      <td className="text-center py-2 px-3 whitespace-nowrap">
                        {item.unit}
                      </td>

                      {/* STATUS COLUMN */}
                      <td className="text-center py-2 px-3 whitespace-nowrap">
                        {updatingJobId === item.id ? (
                          <div className="flex flex-col gap-1">
                            <select
                              value={selectedStatus}
                              onChange={(e) =>
                                setSelectedStatus(e.target.value)
                              }
                              className="border rounded px-2 py-1 text-xs"
                            >
                              <option value="">Select Status</option>

                              {statuses.map((s: Status) => (
                                <option key={s.id} value={s.id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>

                            {statuses.find(
                              (s: Status) => s.id === parseInt(selectedStatus),
                            )?.name === "PARTIALLY DELIVERED" && (
                              <input
                                type="number"
                                placeholder="Delivered SQM"
                                value={deliveredSqm}
                                onChange={(e) =>
                                  setDeliveredSqm(e.target.value)
                                }
                                className="border rounded px-2 py-1 text-xs"
                              />
                            )}

                            <div className="flex gap-1">
                              <button
                                onClick={() => handleStatusUpdate(item.id)}
                                className="bg-green-500 text-white text-xs px-2 py-1 rounded"
                              >
                                Update
                              </button>

                              <button
                                onClick={() => {
                                  setUpdatingJobId(null);
                                  setSelectedStatus("");
                                  setDeliveredSqm("");
                                }}
                                className="bg-red-500 text-white text-xs px-2 py-1 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => setUpdatingJobId(item.id)}
                            className="cursor-pointer"
                            title="Click to update status"
                          >
                            <StatusBadge
                              status={item.status_name}
                              color={item.status_color}
                            />
                          </div>
                        )}
                      </td>

                      <td className="text-center py-2 px-3 whitespace-nowrap font-semibold">
                        {Number(item.original_sqm).toLocaleString()}
                      </td>

                      <td className="text-center py-2 px-3 whitespace-nowrap text-red-600 font-semibold">
                        {Number(item.total_sqm).toLocaleString()}
                      </td>

                      <td className="text-center py-2 px-3 text-green-600 whitespace-nowrap font-semibold">
                        {Number(item.total_delivered_sqm).toLocaleString()}
                      </td>

                      <td className="text-center py-2 px-3 text-orange-600 whitespace-nowrap">
                        {item.date_received
                          ? new Date(item.date_received).toLocaleDateString(
                              "en-GB",
                            )
                          : "-"}
                      </td>

                      <td className="text-center py-2 px-3 text-orange-600 whitespace-nowrap">
                        {item.date_to_production
                          ? new Date(
                              item.date_to_production,
                            ).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={13}
                      className="text-center py-6 text-lg font-semibold"
                    >
                      No Jobs Available!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        <Pagination
          currentPage={pagination.current_page}
          totalPages={pagination.total_pages}
          onPageChange={(newPage) => setPage(newPage)}
        />
      </div>
    </LayoutComp>
  );
};

export default JobPage;
