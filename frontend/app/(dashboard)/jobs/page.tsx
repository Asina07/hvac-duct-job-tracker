"use client";

import BackButton from "@/app/components/BackButton";
import LayoutComp from "@/app/components/LayoutComp";
import LoadingSpinner from "@/app/components/LoadingSpinner";
import Pagination from "@/app/components/Pagination";
import StatusBadge from "@/app/components/StatusBadge";
import JobTable from "@/app/components/tables/JobTable";
import { JobData_Type } from "@/app/dataTypes/jobData.types";
import { getJobs, getMaterials, getStatuses } from "@/app/lib/api";
import React, { useEffect, useState } from "react";

const JobPage = () => {
  const [data, setData] = useState<JobData_Type | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statuses, setStatuses] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [search, setSearch] = useState("");
  const [searchstatus, setSearchStatus] = useState("");
  const [searchMaterial, setSearchMterial] = useState("");
  const [searchDates, setSearchDates] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total_pages: 1,
    total_jobs: 0,
    current_page: 1,
  });

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

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!data) return null;

  // console.log("jobData", data);
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

          {/* Search and Reset buttons */}
          <div className="flex gap-2 mt-3">
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
        </div>
        <JobTable data={data}/>

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
