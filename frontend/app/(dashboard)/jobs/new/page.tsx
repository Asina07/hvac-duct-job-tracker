"use client";

import LayoutComp from "@/app/components/LayoutComp";
import {
  createJob,
  getMaterials,
  getProjects,
  getStatuses,
} from "@/app/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/app/components/BackButton";

const NewJobPage = () => {
  const [materials, setMaterials] = useState([]);
  const [projects, setProjects] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    date_received: "",
    job_number: "",
    item: "",
    material_id: "",
    project_id: "",
    level: "",
    total_sqm: "",
    unit: "SQM",
    status_id: "",
    date_to_production: "",
    notes: "",
  });

  useEffect(() => {
    const loadOptions = async () => {
      const [m, p, s] = await Promise.all([
        getMaterials(),
        getProjects(),
        getStatuses(),
      ]);
      setMaterials(m);
      setProjects(p);
      setStatuses(s);
    };
    loadOptions();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createJob(formData);
      setFormData({
        date_received: "",
        job_number: "",
        item: "",
        material_id: "",
        project_id: "",
        level: "",
        total_sqm: "",
        unit: "SQM",
        status_id: "",
        date_to_production: "",
        notes: "",
      });
      router.push("/jobs");
    } catch (err) {
      setError("Failed to create job");
    } finally {
      setLoading(false);
    }
  };
  return (
    <LayoutComp mainHeader={"Create Jobs"}>
      <section className="bg-white dark:bg-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">New Jobs</h1>
          <div className="text-sm text-blue-600 hover:text-blue-800">
            <BackButton />
          </div>
        </div>
        <div className="py-4 px-4 mx-auto bg-white rounded-lg shadow-sm">
          <form onSubmit={handleSubmit}>
            {/* <pre className="text-xs bg-gray-100 p-2 mt-2">
              {JSON.stringify(formData, null, 2)}
            </pre> */}
            <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
              <div>
                <label
                  htmlFor="date_received"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Date Received
                </label>
                <input
                  type="date"
                  name="date_received"
                  id="date_received"
                  value={formData.date_received}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  //   placeholder="12"
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor="Job Number"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Job Number
                </label>
                <input
                  type="text"
                  name="job_number"
                  id="job_number"
                  value={formData.job_number}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  placeholder="#112233"
                />
              </div>
              <div className="w-full sm:col-span-2">
                <label
                  htmlFor="item"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Item
                </label>
                <input
                  type="text"
                  name="item"
                  id="item"
                  onChange={handleChange}
                  value={formData.item}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>
              <div className="flex justify-between sm:col-span-2 w-full gap-4">
                <div className="w-full">
                  <label
                    htmlFor="material_id"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Select Material
                  </label>
                  <select
                    name="material_id"
                    value={formData.material_id}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  >
                    <option value="">Select Material</option>
                    {materials.map((m: any) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full">
                  <label
                    htmlFor="project_id"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Select Project
                  </label>
                  <select
                    name="project_id"
                    value={formData.project_id}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  >
                    <option value="">Select Project</option>
                    {projects.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-full">
                  <label
                    htmlFor="status_id"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Select Status
                  </label>
                  <select
                    name="status_id"
                    value={formData.status_id}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  >
                    <option value="">Select Status</option>
                    {statuses.map((s: any) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="w-full">
                <label
                  htmlFor="total_sqm"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Total SQM
                </label>
                <input
                  type="number"
                  name="total_sqm"
                  id="total_sqm"
                  onChange={handleChange}
                  value={formData.total_sqm}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>

              <div>
                <label
                  htmlFor="unit"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Unit
                </label>
                <input
                  type="text"
                  name="unit"
                  id="unit"
                  onChange={handleChange}
                  value={formData.unit}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>
              <div className="w-full">
                <label
                  htmlFor="level"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Level
                </label>
                <textarea
                  id="level"
                  name="level"
                  onChange={handleChange}
                  value={formData.level}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                ></textarea>
              </div>
              <div>
                <label
                  htmlFor="date_to_production"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Date to Production
                </label>
                <input
                  type="date"
                  name="date_to_production"
                  id="date_to_production"
                  onChange={handleChange}
                  value={formData.date_to_production}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="notes"
                  className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                >
                  Notes
                </label>
                <textarea
                  name="notes"
                  id="notes"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                  onChange={handleChange}
                  value={formData.notes}
                ></textarea>
              </div>
            </div>
            <div className="flex justify-between items-center gap-3">
              <button
                type="submit"
                className="flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-blue-500 rounded-lg focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800"
              >
                Add product
              </button>
              <button
                onClick={() => router.push("/jobs")}
                className="flex items-center px-5 py-2.5 mt-4 sm:mt-6 text-sm font-medium text-center text-white bg-blue-500 rounded-lg focus:ring-4 focus:ring-primary-200 dark:focus:ring-primary-900 hover:bg-primary-800"
              >
                See All Jobs
              </button>
            </div>
          </form>
        </div>
      </section>
    </LayoutComp>
  );
};

export default NewJobPage;
