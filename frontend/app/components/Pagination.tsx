interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex items-center justify-between mt-4 px-4 py-3 bg-white  rounded-lg shadow-sm">
      {/* Previous Button */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className={`px-4 py-2 rounded-md border text-sm font-medium transition
          ${
            currentPage === 1
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white hover:bg-gray-50 text-gray-700"
          }`}
      >
        ← Previous
      </button>

      {/* Page Info */}
      <span className="text-sm text-gray-600 font-medium">
        Page {currentPage} of {totalPages}
      </span>

      {/* Next Button */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className={`px-4 py-2 rounded-md border text-sm font-medium transition
          ${
            currentPage === totalPages
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-white hover:bg-gray-50 text-gray-700"
          }`}
      >
        Next →
      </button>
    </div>
  );
}
