import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useLocation } from "react-router-dom";

const SortableTable = ({
  data = [],
  columns = [],
  itemsPerPage = 10,
  onRowAction,
  renderCell,
  showColumn1Mobile = true,
  hidePagination = false, // 🆕 Add hidePagination prop
}) => {
  const [sortField, setSortField] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const location = useLocation();
  const shouldHidePagination = hidePagination || location.pathname === "/campaigns";

  // 🔹 Truncate helper
  const truncateText = (text, maxLength = 10) => {
    if (typeof text !== "string") return text;
    return text.length > maxLength
      ? `${text.substring(0, maxLength)}...`
      : text;
  };

  // 🔹 Sorting logic
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  const getSortIcon = (field) => {
    if (sortField !== field) return <ArrowUpDown className="h-4 w-4 ml-1" />;
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-1" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-1" />
    );
  };

  // 🔹 Memoized sorted data
  const sortedData = useMemo(() => {
    if (!sortField) return [...data];
    const column = columns.find((col) => col.key === sortField);

    return [...data].sort((a, b) => {
      let aValue = a[sortField];
      let bValue = b[sortField];

      if (column?.type === "date") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (typeof aValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortField, sortDirection, columns]);

  // 🔹 Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // 🔹 Expand toggle (mobile)
  const toggleExpand = (id) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  // 🔹 Default cell renderer
  const defaultRenderCell = (item, column) => {
    const value = item[column.key];

    if (column?.type === "badge") {
      return (
        <Badge
          className={column.getBadgeColor ? column.getBadgeColor(value) : ""}
        >
          {truncateText(value)}
        </Badge>
      );
    }

    if (column.type === "date") {
      return value ? new Date(value).toLocaleDateString() : "-";
    }

    if (column.render) return column.render(value, item);

    return truncateText(value);
  };

  const cellRenderer = renderCell || defaultRenderCell;

  // 🔹 Pagination range builder
  const getPaginationRange = () => {
    const range = [];
    const visiblePages = 5;

    if (totalPages <= visiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) range.push(i);
    } else {
      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      range.push(1);
      if (start > 2) range.push("...");
      for (let i = start; i <= end; i++) range.push(i);
      if (end < totalPages - 1) range.push("...");
      range.push(totalPages);
    }

    return range;
  };

  return (
    <div className="space-y-4">
      {/* ===== TABLE ===== */}
      <div className="w-full overflow-x-auto">
        {/* ✅ Desktop Table */}
        <div className="hidden sm:block">
          <div className="min-w-[800px]">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((column) => (
                    <TableHead
                      key={column.key}
                      className={`${column.width || "w-auto"} ${
                        column.minWidth || "min-w-[100px]"
                      }`}
                    >
                      {column.sortable !== false ? (
                        <Button
                          variant="ghost"
                          onClick={() => handleSort(column.key)}
                          className="h-auto p-0 font-medium hover:bg-transparent hover:text-primary/80 flex items-center"
                        >
                          {column.label}
                          {getSortIcon(column.key)}
                        </Button>
                      ) : (
                        <span className="font-medium">{column.label}</span>
                      )}
                    </TableHead>
                  ))}
                  {onRowAction && (
                    <TableHead className="w-[100px] text-right">
                      Actions
                    </TableHead>
                  )}
                </TableRow>
              </TableHeader>

              <TableBody>
                {paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + (onRowAction ? 1 : 0)}
                      className="text-center py-8 text-muted-foreground"
                    >
                      No data found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((item, index) => (
                    <TableRow key={item.id || index}>
                      {columns.map((column) => (
                        <TableCell key={column.key}>
                          {cellRenderer(item, column)}
                        </TableCell>
                      ))}
                      {onRowAction && (
                        <TableCell className="text-right">
                          {onRowAction(item)}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
        <div className="block sm:hidden ">
          {/* Mobile Table Header */}
          <div className="flex items-center justify-between p-3 border-b border-muted/30 bg-primary rounded-t-lg text-white text-sm font-semibold">
            {columns[0] && !showColumn1Mobile && (
              <div className="flex-shrink-0 max-w-[50%] overflow-hidden text-ellipsis whitespace-nowrap">
                {columns[0].label}
              </div>
            )}
            {columns[1] && showColumn1Mobile && (
              <div className="flex-shrink-0 max-w-[50%] overflow-hidden text-ellipsis whitespace-nowrap">
                {columns[1].label}
              </div>
            )}
            <div className="flex-shrink-0 max-w-[50%] text-right overflow-hidden text-ellipsis whitespace-nowrap">
              Details
            </div>
          </div>

          {/* ✅ Mobile Cards */}
          <div className="block sm:hidden space-y-3">
            {paginatedData.length === 0 ? (
              <div className="text-center py-8 text-sm text-muted-foreground">
                No data found
              </div>
            ) : (
              paginatedData.map((item, index) => {
                const id = item.id || index;
                const isOpen = expandedRows.has(id);

                return (
                  <div
                    key={id}
                    className="border border-muted/30 rounded-lg shadow-sm overflow-hidden bg-white"
                  >
                    <div className="flex items-start items-center justify-between p-2">
                      <div className="flex items-center gap-3">
                        {columns[0] && (
                          <div className="flex-shrink-0 max-w-[170px] sm:max-w-[200px] overflow-hidden text-ellipsis whitespace-nowrap">
                            {cellRenderer(item, columns[0])}
                          </div>
                        )}
                        <div>
                          {columns[1] && showColumn1Mobile && (
                            <div className="text-sm font-semibold capitalize truncate ">
                              {truncateText(cellRenderer(item, columns[1]), 15)}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => toggleExpand(id)}
                        className="p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4 text-primary" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-primary" />
                        )}
                      </button>
                    </div>

                    {/* Expanded Content */}
                    <div
                      className={`transition-all duration-300 ease-in-out overflow-hidden  ${
                        isOpen ? "max-h-96 " : "max-h-0 p-0"
                      }`}
                    >
                      <hr className="w-full h-0.5  rounded-full bg-primary mb-3" />

                      <div className="pl-3 pb-2 space-y-1 ">
                        {columns
                          .filter(
                            (column, index) =>
                              index !== 0 && // exclude first column
                              column.type !== "checkbox" &&
                              column.key !== "select" &&
                              column.label?.toLowerCase() !== "select"
                          )
                          .map((column) => (
                            <div
                              key={column.key}
                              className="flex text-sm gap-2"
                            >
                              <span className="w-24 items-center text-muted-foreground font-medium">
                                {column.label}:
                              </span>
                              <span>
                                {truncateText(cellRenderer(item, column), 20)}
                              </span>
                            </div>
                          ))}

                        {onRowAction && (
                          <div className="flex items-center gap-2 mt-2 border-black ">
                            {onRowAction(item)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ===== PAGINATION ===== */}
      {/* {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-3 py-3 sm:px-2">
          <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
            Showing {startIndex + 1}–
            {Math.min(startIndex + itemsPerPage, sortedData.length)} of{" "}
            {sortedData.length} items
          </div>

          <Pagination className="justify-end flex-wrap">
            <PaginationContent className="flex flex-wrap items-center gap-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPaginationRange().map((page, idx) => (
                <PaginationItem key={idx}>
                  {page === "..." ? (
                    <span className="px-3 text-muted-foreground">...</span>
                  ) : (
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )} */}

      {/* 🔹 Enhanced Desktop Pagination */}
      {!shouldHidePagination && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t border-gray-100 bg-gray-50/50 gap-3 sm:gap-0">
          <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
            Showing {startIndex + 1}–
            {Math.min(startIndex + itemsPerPage, sortedData.length)} of{" "}
            {sortedData.length} items
          </div>

          <Pagination className="justify-end flex-wrap">
            <PaginationContent className="flex flex-wrap items-center gap-1">
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(currentPage - 1)}
                  className={
                    currentPage === 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {getPaginationRange().map((page, idx) => (
                <PaginationItem key={idx}>
                  {page === "..." ? (
                    <span className="px-3 text-muted-foreground">...</span>
                  ) : (
                    <PaginationLink
                      onClick={() => handlePageChange(page)}
                      isActive={currentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(currentPage + 1)}
                  className={
                    currentPage === totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
};

export default SortableTable;
