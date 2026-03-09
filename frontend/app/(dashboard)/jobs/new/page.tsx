"use client";

import LayoutComp from "@/app/components/LayoutComp";
import {
  createJob,
  getMaterials,
  getProjects,
  createMaterial,
  createProject,
  createStatus,
  getStatuses,
} from "@/app/lib/api";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import BackButton from "@/app/components/BackButton";
import { Plus } from "lucide-react";
import Modal from "@/app/components/Modal";

type Material = {
  id: number;
  name: string;
};

type Project = {
  id: number;
  name: string;
};

type Status = {
  id: number;
  name: string;
};
const NewJobPage = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Modal states
  const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Input states
  const [newMaterialName, setNewMaterialName] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newStatusName, setNewStatusName] = useState("");

  // Loading state - one for all
  const [modalLoading, setModalLoading] = useState(false);
  const [formData, setFormData] = useState({
    date_received: "",
    job_number: "",
    item: "",
    material_id: "",
    project_id: "",
    level: "",
    total_sqm: "",
    original_sqm: "",
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
    const { name, value } = e.target;

    // When total_sqm changes, also set original_sqm
    if (name === "total_sqm") {
      setFormData({ ...formData, total_sqm: value, original_sqm: value });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
        original_sqm: "",
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

  const handleAddOption = async (type: "material" | "project" | "status") => {
    const nameMap = {
      material: newMaterialName,
      project: newProjectName,
      status: newStatusName,
    };

    const name = nameMap[type];

    if (!name) {
      alert(`${type} name is required`);
      return;
    }

    setModalLoading(true);
    try {
      let newItem;

      if (type === "material") {
        newItem = await createMaterial({ name });
        setMaterials([...materials, newItem]);
        setFormData({ ...formData, material_id: newItem.id });
        setIsMaterialModalOpen(false);
        setNewMaterialName("");
      } else if (type === "project") {
        newItem = await createProject({ name });
        setProjects([...projects, newItem]);
        setFormData({ ...formData, project_id: newItem.id });
        setIsProjectModalOpen(false);
        setNewProjectName("");
      } else if (type === "status") {
        newItem = await createStatus({ name });
        setStatuses([...statuses, newItem]);
        setFormData({ ...formData, status_id: newItem.id });
        setIsStatusModalOpen(false);
        setNewStatusName("");
      }
    } catch (err) {
      alert(`Failed to add ${type}`);
    } finally {
      setModalLoading(false);
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
                  <button
                    onClick={() => setIsMaterialModalOpen(true)}
                    className="flex items-center px-3 py-2 mt-2 text-sm text-white bg-gray-400 rounded-lg hover:bg-gray-500"
                  >
                    <Plus size={16} className="mr-1" /> Add Material
                  </button>
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
                  <button
                    onClick={() => setIsProjectModalOpen(true)}
                    className="flex items-center px-3 py-2 mt-2 text-sm text-white bg-gray-400 rounded-lg hover:bg-gray-500"
                  >
                    <Plus size={16} className="mr-1" /> Add Project
                  </button>
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
                  <button
                    onClick={() => setIsStatusModalOpen(true)}
                    className="flex items-center px-3 py-2 mt-2 text-sm text-white bg-gray-400 rounded-lg hover:bg-gray-500"
                  >
                    <Plus size={16} className="mr-1" /> Add Status
                  </button>
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

      {/* modal section */}
      {/* Material Modal */}
      <Modal
        isOpen={isMaterialModalOpen}
        onClose={() => {
          setIsMaterialModalOpen(false);
          setNewMaterialName("");
        }}
        title="Add New Material"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={newMaterialName}
            onChange={(e) => setNewMaterialName(e.target.value)}
            placeholder="Enter material name"
            className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsMaterialModalOpen(false);
                setNewMaterialName("");
              }}
              className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAddOption("material")}
              disabled={modalLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {modalLoading ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Project Modal */}
      <Modal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setNewProjectName("");
        }}
        title="Add New Project"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            placeholder="Enter project name"
            className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsProjectModalOpen(false);
                setNewProjectName("");
              }}
              className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAddOption("project")}
              disabled={modalLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {modalLoading ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setNewStatusName("");
        }}
        title="Add New Status"
      >
        <div className="space-y-4">
          <input
            type="text"
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
            placeholder="Enter status name"
            className="border rounded-lg px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setIsStatusModalOpen(false);
                setNewStatusName("");
              }}
              className="px-4 py-2 text-sm bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAddOption("status")}
              disabled={modalLoading}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {modalLoading ? "Adding..." : "Add"}
            </button>
          </div>
        </div>
      </Modal>
    </LayoutComp>
  );
};

export default NewJobPage;
