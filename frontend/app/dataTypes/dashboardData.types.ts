export interface DashboardData {
  overall: {
    total_jobs: string;
    total_sqm: string;
    total_delivered_sqm: string;
  };
  by_material: {
    material: string;
    total_jobs: string;
    total_sqm: string;
  }[];
  by_status: {
    status: string;
    color: string;
    total_jobs: string;
    total_sqm: string;
  }[];
  delivery_summary: {
    material: string;
    total_sqm: string;
    delivered_sqm: string;
    pending_sqm: string;
  }[];
  tag_list_waiting: {
    id: number;
    job_number: string;
    level: string;
    total_sqm: string;
    date_received: string;
    project_name: string;
    material_name: string;
  }[];
  material_status_breakdown: {
    material: string;
    status: string;
    color: string;
    total_jobs: string;
    total_sqm: string;
  }[];
}
