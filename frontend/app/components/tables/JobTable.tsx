import React from "react";
import { JobData_Type } from './../../dataTypes/jobData.types';
import StatusBadge from "../StatusBadge";

interface JobTableProps {
  data: JobData_Type;
}

const JobTable = ({data}:JobTableProps) => {
  return (
    <div>
      <div className="w-full overflow-x-auto ">
        <table className="min-w-[1100px] w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr className="border-b">
              <th className="text-center py-2 px-3 whitespace-nowrap">
                Action
              </th>
              <th className="text-right py-2 px-3 whitespace-nowrap">Job_No</th>
              <th className="text-left py-2 px-3 whitespace-nowrap">
                Material
              </th>
              <th className="text-center py-2 px-3 whitespace-nowrap">Item</th>
              <th className="text-center py-2 px-3 whitespace-nowrap">
                Project
              </th>
              <th className="text-center py-2 px-3 whitespace-nowrap">Level</th>
              <th className="text-center py-2 px-3 whitespace-nowrap">
                Total_SQM
              </th>
              <th className="text-center py-2 px-3 whitespace-nowrap">Unit</th>
              <th className="text-center py-2 px-3 whitespace-nowrap">
                Status
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
            {data?.jobs.length > 0 ? (
              <>
                {data?.jobs?.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b hover:bg-blue-50 transition"
                  >
                    <td className="text-center py-2 px-3 whitespace-nowrap">
                      sdglk
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
                      {Number(item.total_sqm).toLocaleString()}
                    </td>
                    <td className="text-center py-2 px-3 whitespace-nowrap">
                      {item.unit}
                    </td>
                    <td className="text-center py-2 px-3 whitespace-nowrap">
                      <StatusBadge
                        status={item.status_name}
                        color={item.status_color}
                      />
                    </td>
                    <td className="text-center py-2 px-3 text-green-600 whitespace-nowrap">
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
                        ? new Date(item.date_to_production).toLocaleDateString(
                            "en-GB",
                          )
                        : "-"}
                    </td>
                  </tr>
                ))}{" "}
              </>
            ) : (
              <div className="w-full flex justify-center items-center mt-6">
                <div className="text-lg font-semibold">No Jobs Available!</div>
              </div>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobTable;
