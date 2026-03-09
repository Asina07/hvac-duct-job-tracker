export interface jobTypes {
  id: 2;
  date_received: string;
  job_number: string;
  item: string;
  material_id: number;
  project_id: number;
  level: string;
  total_sqm: string;
  original_sqm: string;
  unit: string;
  status_id: number;
  date_to_production: string;
  total_delivered_sqm: string;
  notes: string;
  created_at: string;
  updated_at: string;
  user_id: number;
  material_name: string;
  project_name: string;
  status_name: string;
  status_color: string;
}

export interface JobData_Type {
  jobs: jobTypes[];
  pagination: {
    total_jobs: number;
    total_pages: number;
    current_page: number;
    per_page: number;
    has_next_page: boolean;
    has_prev_page: boolean;
  };
  sorting: {
    sort_by: string;
  };
}
